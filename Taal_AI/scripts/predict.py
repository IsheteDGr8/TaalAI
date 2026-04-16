import os
import librosa
import numpy as np
import joblib
import math
from collections import Counter
import warnings

warnings.filterwarnings("ignore")

# CONFIGURATION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "../features/taal_model.pkl")

print("Loading model...")
model = joblib.load(MODEL_PATH)
classes = model.classes_ # Gets the list of classes the model knows

def get_features(y, sr):
    try:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        if np.ndim(tempo) > 0: tempo = tempo[0]

        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_mean = np.mean(onset_env)
        onset_var = np.var(onset_env)
        onset_max = np.max(onset_env)

        autocorr = librosa.autocorrelate(onset_env, max_size=10000)
        autocorr_mean = np.mean(autocorr)
        autocorr_var = np.var(autocorr)
        autocorr_max = np.max(autocorr)

        pulse = librosa.beat.plp(onset_envelope=onset_env, sr=sr)
        pulse_mean = np.mean(pulse)
        pulse_var = np.var(pulse)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=6)[1:6, :]
        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_std = np.std(mfcc, axis=1)

        features = [
            tempo, 
            onset_mean, onset_var, onset_max,
            autocorr_mean, autocorr_var, autocorr_max,
            pulse_mean, pulse_var,
            *mfcc_mean, *mfcc_std
        ]
        return features
    except Exception as e:
        return None

def predict_song(file_path):
    print(f"\nAnalyzing: {os.path.basename(file_path)}...")
    
    try:
        y_full, sr = librosa.load(file_path, sr=22050)
    except Exception as e:
        print(f"Error loading audio: {e}")
        return

    clip_samples = 22050 * 20
    total_duration = librosa.get_duration(y=y_full, sr=sr)
    num_chunks = math.floor(total_duration / 20)

    if num_chunks == 0:
        num_chunks = 1
        y_full = librosa.util.fix_length(y_full, size=clip_samples)

    print(f"-> Split into {num_chunks} chunks of 20s.")

    predictions = []

    for i in range(num_chunks):
        start = i * clip_samples
        end = start + clip_samples
        chunk = y_full[start:end]

        onset_env = librosa.onset.onset_strength(y=chunk, sr=sr)
        if len(librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)) < 15:
            continue

        feats = get_features(chunk, sr)
        if feats:
            feats_array = np.array(feats).reshape(1, -1)
            
            # --- THE NEW CONFIDENCE THRESHOLD LOGIC ---
            # Get the probabilities for all classes
            probs = model.predict_proba(feats_array)[0]
            max_prob = np.max(probs)
            best_class = classes[np.argmax(probs)]
            
            # If the model isn't at least 60% confident, override it to "unknown"
            if max_prob < 0.55:
                predictions.append("unknown")
            else:
                predictions.append(best_class)

    if not predictions:
        print("Could not analyze (Audio too quiet or short).")
        return

    vote_counts = Counter(predictions)
    winner, count = vote_counts.most_common(1)[0]
    confidence = (count / len(predictions)) * 100

    print("-" * 30)
    print(f"PREDICTED TAAL:  {winner.upper()}")
    print(f"Confidence:      {confidence:.2f}% ({count}/{len(predictions)} chunks)")
    print("-" * 30)
    print("Chunk Votes:", dict(vote_counts))


def predict_for_web(file_path):
    """Return a JSON-serializable dict for the web frontend.
    Tries to use the CNN predictor if available, otherwise falls back
    to the feature-based model. Keys match the frontend's expectations.
    """
    # Try to use the CNN predictor if present
    try:
        from predict_cnn import predict_song_cnn
        cnn_result = predict_song_cnn(file_path)
        # If the cnn_result is a dict and looks like an error, return it
        if isinstance(cnn_result, dict) and ("error" in cnn_result or "predicted_taal" in cnn_result):
            return cnn_result
    except Exception:
        # Fall back to feature-based model below
        pass

    # --- Feature-based fallback (returns dict) ---
    try:
        y_full, sr = librosa.load(file_path, sr=22050)
    except Exception as e:
        return {"error": f"Error loading audio: {e}"}

    clip_samples = 22050 * 20
    total_duration = librosa.get_duration(y=y_full, sr=sr)
    num_chunks = math.floor(total_duration / 20)

    if num_chunks == 0:
        num_chunks = 1
        y_full = librosa.util.fix_length(y_full, size=clip_samples)

    predictions = []

    for i in range(num_chunks):
        start = i * clip_samples
        end = start + clip_samples
        chunk = y_full[start:end]

        onset_env = librosa.onset.onset_strength(y=chunk, sr=sr)
        if len(librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)) < 15:
            continue

        feats = get_features(chunk, sr)
        if feats:
            feats_array = np.array(feats).reshape(1, -1)
            probs = model.predict_proba(feats_array)[0]
            max_prob = np.max(probs)
            best_class = classes[np.argmax(probs)]
            if max_prob < 0.55:
                predictions.append("unknown")
            else:
                predictions.append(best_class)

    if not predictions:
        return {"error": "Could not analyze (Audio too quiet or short)."}

    vote_counts = Counter(predictions)
    winner, count = vote_counts.most_common(1)[0]
    confidence = (count / len(predictions)) * 100

    result = {
        "predicted_taal": str(winner),
        "confidence": round(confidence, 2),
        "chunk_votes": dict(vote_counts),
        "total_chunks": len(predictions)
    }

    return result

if __name__ == "__main__":
    # Test file path goes here
    test_file = r"C:\Users\ishaa\Downloads\Jaago_Mohan_Pyare_Bandish_Bandits_Web_Series_Versi.wav"
    
    if os.path.exists(test_file):
        predict_song(test_file)
    else:
        print("Please edit the 'test_file' variable in the script to point to a song!")

# NOTE: If you are using predict_for_web() in app.py, you will need to copy the new 
# Confidence Threshold logic into that function as well!