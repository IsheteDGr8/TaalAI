import os
import tempfile
import urllib.request
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np

import yt_dlp

# Import your prediction logic
from scripts.predict_cnn import predict_song_cnn
# Import the new YouTube utility we built in Phase 2
from scripts.youtube_utils import is_youtube_url, download_youtube_audio

MODEL_PATH = "taal_cnn_model.keras"  # Adjust this if your model is in a subfolder!
classes = ["bhajani", "dadra", "teentaal"]  # Ensure this matches the exact order you trained them in

app = FastAPI(title="Taal AI Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Hardcode your exact CNN architecture
def build_taal_model():
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(128, 862, 1)),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 3), strides=(2, 3)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 3), strides=(2, 3)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 3), strides=(2, 3)),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(3, activation='softmax')
    ])
    return model

# 2. Build the blueprint and ONLY load the weights
try:
    print("Building model architecture...")
    model = build_taal_model()
    
    print("Loading weights...")
    # Replace 'MODEL_PATH' with your actual path variable, e.g., 'taal_cnn_model.keras'
    model.load_weights(MODEL_PATH) 
    
    print("✅ Model weights loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

class AudioRequest(BaseModel):
    audio_url: str
    start_time: Optional[float] = None  # seconds; analyze only [start_time, end_time]
    end_time: Optional[float] = None

@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    return {"status": "active", "model_loaded": model is not None}


class ProbeRequest(BaseModel):
    audio_url: str


def _probe_youtube_metadata(url: str) -> dict:
    """Lightweight metadata probe — no download. Returns duration in seconds and title."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return {
        "duration": float(info.get("duration", 0)),
        "title": info.get("title", ""),
    }


@app.post("/probe")
async def probe_audio(request: ProbeRequest):
    """Return duration (and title for YouTube) so the frontend can render a trim slider."""
    url = request.audio_url
    if not is_youtube_url(url):
        raise HTTPException(status_code=400, detail="Only YouTube URLs require probing; files report duration client-side.")
    try:
        meta = await asyncio.to_thread(_probe_youtube_metadata, url)
        if meta["duration"] <= 0:
            raise HTTPException(status_code=400, detail="Could not determine video duration.")
        return meta
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(status_code=400, detail=f"Failed to probe YouTube URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Probe error: {str(e)}")

@app.post("/predict")
async def predict_taal(request: AudioRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load on the server.")

    # --- VALIDATE OPTIONAL CROP RANGE ---
    start_time = request.start_time
    end_time = request.end_time
    if (start_time is None) != (end_time is None):
        raise HTTPException(status_code=400, detail="Provide both start_time and end_time, or neither.")
    if start_time is not None:
        if start_time < 0:
            raise HTTPException(status_code=400, detail="start_time must be >= 0.")
        if end_time <= start_time:
            raise HTTPException(status_code=400, detail="end_time must be greater than start_time.")
        if (end_time - start_time) < 20:
            raise HTTPException(status_code=400, detail="Selected section must be at least 20 seconds long.")
        if (end_time - start_time) > 600:
            raise HTTPException(status_code=400, detail="Selected section cannot exceed 10 minutes (600 seconds).")

    # Create a temporary file placeholder
    temp_audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    final_file_path = temp_audio_file.name
    temp_audio_file.close()  # <-- ADD THIS LINE TO UNLOCK THE FILE FOR WINDOWS

    try:
        url = request.audio_url

        # --- SMART ROUTING LOGIC ---
        if is_youtube_url(url):
            print(f"Processing YouTube URL: {url} (range={start_time}-{end_time})")
            # Use thread pooling to prevent the YouTube download from freezing the server.
            # When a crop range is provided, yt-dlp downloads ONLY that segment (huge speed win).
            final_file_path = await asyncio.to_thread(
                download_youtube_audio, url, temp_audio_file.name, start_time, end_time
            )
            # The downloader already trimmed to [start, end]; don't crop inside librosa again.
            # We'll shift timeline timestamps back to absolute song time after inference.
            librosa_end = None  # entire downloaded file IS the requested segment
            librosa_offset_for_load = 0.0
        else:
            print(f"Processing direct audio upload (range={start_time}-{end_time}).")
            await asyncio.to_thread(urllib.request.urlretrieve, url, temp_audio_file.name)
            librosa_end = end_time
            librosa_offset_for_load = start_time

        # --- ML INFERENCE ---
        # Run the heavy CNN math in a background thread.
        # For YouTube: file is already trimmed, so we pass offset=0 to librosa but timeline
        # timestamps should still be shifted by start_time so they reflect the original song time.
        result = await asyncio.to_thread(
            predict_song_cnn,
            final_file_path,
            model,
            classes,
            librosa_offset_for_load,
            librosa_end if not is_youtube_url(url) else None,
        )
        winner, confidence, chunk_timeline = result

        # For YouTube with a crop, shift the timeline timestamps by start_time after the fact
        # (since librosa.load got offset=0 on the already-trimmed file).
        if is_youtube_url(url) and start_time is not None:
            for chunk in chunk_timeline:
                chunk["start_time"] = int(chunk["start_time"] + start_time)
                chunk["end_time"] = int(chunk["end_time"] + start_time)

        if not winner:
            return {"error": "Audio too quiet or no percussive beats detected."}

        return {
            "prediction": winner.upper(),
            "confidence": round((confidence) * 100, 2),
            "timeline": chunk_timeline,
        }
        
    except ValueError as ve:
        # Catch the 10-minute maximum limit error we set in youtube_utils.py
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
        
    finally:
        # CRITICAL CLEANUP: Prevent memory leaks by deleting all temp files
        if os.path.exists(final_file_path):
            os.remove(final_file_path)
        # Fallback check in case yt-dlp created a separate file
        if os.path.exists(temp_audio_file.name) and final_file_path != temp_audio_file.name:
            os.remove(temp_audio_file.name)