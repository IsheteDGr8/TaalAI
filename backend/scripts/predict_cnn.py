import os
import math
import librosa
import numpy as np
from collections import Counter

MAX_FRAMES = 862 
N_MELS = 128

def extract_spectrogram(chunk, sr):
    """ Converts a 20s audio chunk into the required CNN input shape. """
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

def predict_song_cnn(file_path, model_instance, class_labels):
    """ Slices audio, runs inference, and returns democratic voting results. """
    try:
        y_full, sr = librosa.load(file_path, sr=22050, duration=60)
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None, 0.0, {}

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
        probs = model_instance.predict(spec_data, verbose=0)[0]

        best_class = str(class_labels[np.argmax(probs)])
        predictions.append(best_class)

    if not predictions:
        return None, 0.0, {}

    vote_counts = Counter(predictions)
    winner, count = vote_counts.most_common(1)[0]
    confidence = count / len(predictions)

    return winner, confidence, dict(vote_counts)