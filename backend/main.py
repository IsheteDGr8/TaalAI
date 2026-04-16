import os
import urllib.request
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np

# Import your prediction logic
from scripts.predict_cnn import predict_song_cnn, extract_spectrogram

app = FastAPI(title="Taal AI Inference API")

# --- NEW: CORS SECURITY FIX ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows any frontend to connect (localhost or Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------

# Load the model once when the server starts
MODEL_PATH = os.path.join(os.path.dirname(__file__), "taal_cnn_model.keras")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    classes = np.array(['bhajani', 'dadra', 'teentaal'])
    print("✅ Model loaded successfully into memory.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Define the expected JSON payload from the frontend
class AudioRequest(BaseModel):
    audio_url: str

@app.get("/")
def health_check():
    return {"status": "active", "model_loaded": model is not None}

@app.post("/predict")
async def predict_taal(request: AudioRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load on the server.")

    # Create a temporary file to hold the downloaded audio
    temp_audio_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    
    try:
        # Download the audio from the Supabase/Frontend URL
        urllib.request.urlretrieve(request.audio_url, temp_audio_file.name)
        
        # Run your existing CNN prediction logic on the temporary file
        winner, confidence, breakdown = predict_song_cnn(temp_audio_file.name, model, classes)
        
        if not winner:
            return {"error": "Audio too quiet or no percussive beats detected."}
            
        # Return the clean JSON to the frontend
        return {
            "prediction": winner.upper(),
            "confidence": round((confidence) * 100, 2),
            "vote_breakdown": breakdown
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
        
    finally:
        # CRITICAL: Always delete the temporary file to save server memory!
        if os.path.exists(temp_audio_file.name):
            os.remove(temp_audio_file.name)