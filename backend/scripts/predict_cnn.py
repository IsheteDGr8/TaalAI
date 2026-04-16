import os
import librosa
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from collections import Counter
import warnings
import math

warnings.filterwarnings('ignore')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(SCRIPT_DIR, "../cnn_data/taal_cnn_model.keras")
CLASSES_FILE = os.path.join(SCRIPT_DIR, "../cnn_data/classes.npy")

model = load_model(MODEL_FILE)
classes = np.load(CLASSES_FILE, allow_pickle=True)

MAX_FRAMES = 862 
N_MELS = 128

def extract_spectrogram(chunk, sr):
    S = librosa.feature.melspectrogram(y=chunk, sr=sr, n_mels=N_MELS, hop_length=512)
    S_DB = librosa.power_to_db(S, ref=np.max)
    
    # STRICT NORMALIZATION
    S_DB = (S_DB - np.min(S_DB)) / (np.max(S_DB) - np.min(S_DB) + 1e-8)
    
    if S_DB.shape[1] < MAX_FRAMES:
        pad_width = MAX_FRAMES - S_DB.shape[1]
        S_DB = np.pad(S_DB, pad_width=((0, 0), (0, pad_width)), mode='constant')
    else:
        S_DB = S_DB[:, :MAX_FRAMES]
        
    return S_DB.reshape(1, N_MELS, MAX_FRAMES, 1)

def predict_song_cnn(file_path):
    print(f"\nAnalyzing: {os.path.basename(file_path)}...")
    try:
        y_full, sr = librosa.load(file_path, sr=22050)
    except Exception as e:
        print(f"Error: {e}")
        return {"error": f"Error loading audio: {e}"}

    clip_samples = 22050 * 20
    num_chunks = math.floor(librosa.get_duration(y=y_full, sr=sr) / 20)
    if num_chunks == 0:
        num_chunks = 1
        y_full = librosa.util.fix_length(y_full, size=clip_samples)

    predictions = []

    for i in range(num_chunks):
        start = i * clip_samples
        chunk = y_full[start:start + clip_samples]

        onset_env = librosa.onset.onset_strength(y=chunk, sr=sr)
        if len(librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)) < 15:
            continue

        spec_data = extract_spectrogram(chunk, sr)
        probs = model.predict(spec_data, verbose=0)[0]
        
        # Native model prediction
        best_class = str(classes[np.argmax(probs)])
        predictions.append(best_class)

    if not predictions:
        print("Audio too quiet.")
        return {"error": "Audio too quiet or short"}

    vote_counts = Counter(predictions)
    winner, count = vote_counts.most_common(1)[0]

    confidence = (count / len(predictions)) * 100

    result = {
        "predicted_taal": str(winner),
        "confidence": round(confidence, 2),
        "chunk_votes": dict(vote_counts),
        "total_chunks": len(predictions)
    }

    print("-" * 30)
    print(f"CNN PREDICTED TAAL: {winner.upper()}")
    print(f"Confidence:         {confidence:.2f}%")
    print("Chunk Votes:", dict(vote_counts))
    print("-" * 30)

    return result