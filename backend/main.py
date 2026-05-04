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
    temp_audio_file.close()  # <-- ADD THIS LINE TO UNLOCK THE FILE FOR WINDOWS
    
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