import os
import tempfile
import urllib.request
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np

# Import your prediction logic
from scripts.predict_cnn import predict_song_cnn

# Import the new YouTube utility we built in Phase 2
from scripts.youtube_utils import is_youtube_url, download_youtube_audio

app = FastAPI(title="Taal AI Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once when the server starts
MODEL_PATH = os.path.join(os.path.dirname(__file__), "taal_cnn_model.keras")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    classes = np.array(['bhajani', 'dadra', 'teentaal'])
    print("✅ Model loaded successfully into memory.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

class AudioRequest(BaseModel):
    audio_url: str

@app.get("/")
def health_check():
    return {"status": "active", "model_loaded": model is not None}

@app.post("/predict")
async def predict_taal(request: AudioRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load on the server.")

    # Create a temporary file placeholder
    temp_audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    final_file_path = temp_audio_file.name
    
    try:
        url = request.audio_url

        # --- SMART ROUTING LOGIC ---
        if is_youtube_url(url):
            print(f"Processing YouTube URL: {url}")
            # Use thread pooling to prevent the YouTube download from freezing the server
            final_file_path = await asyncio.to_thread(
                download_youtube_audio, url, temp_audio_file.name
            )
        else:
            print("Processing direct audio upload.")
            # Existing flow: Use thread pooling for the standard download too
            await asyncio.to_thread(urllib.request.urlretrieve, url, temp_audio_file.name)

        # --- ML INFERENCE ---
        # Run the heavy CNN math in a background thread
        result = await asyncio.to_thread(
            predict_song_cnn, final_file_path, model, classes
        )
        winner, confidence, breakdown = result
        
        if not winner:
            return {"error": "Audio too quiet or no percussive beats detected."}
            
        return {
            "prediction": winner.upper(),
            "confidence": round((confidence) * 100, 2),
            "vote_breakdown": breakdown
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