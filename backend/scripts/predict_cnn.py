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
    """ Slices audio, runs inference, and returns democratic voting results + a per-chunk timeline. """
    try:
        y_full, sr = librosa.load(file_path, sr=22050)
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None, 0.0, []

    clip_samples = 22050 * 20
    num_chunks = math.floor(librosa.get_duration(y=y_full, sr=sr) / 20)
    
    if num_chunks == 0:
        num_chunks = 1
        y_full = librosa.util.fix_length(y_full, size=clip_samples)

    predictions = []
    chunk_timeline = []

    for i in range(num_chunks):
        start = i * clip_samples
        chunk = y_full[start:start + clip_samples]

        # Onset filter: chunks without enough percussive activity are excluded from voting,
        # but still appear in the timeline labeled "SILENT" so the visualizer stays continuous.
        onset_env = librosa.onset.onset_strength(y=chunk, sr=sr)
        has_beats = len(librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)) >= 15

        spec_data = extract_spectrogram(chunk, sr)
        probs = model_instance.predict(spec_data, verbose=0)[0]

        best_class = str(class_labels[np.argmax(probs)])
        confidence = float(np.max(probs))

        if has_beats:
            predictions.append(best_class)
            timeline_label = best_class.upper()
        else:
            timeline_label = "SILENT"

        chunk_timeline.append({
            "chunk_num": i + 1,
            "start_time": i * 20,
            "end_time": (i + 1) * 20,
            "prediction": timeline_label,
            "confidence": round(confidence * 100, 1),
        })

    if not predictions:
        return None, 0.0, chunk_timeline

    vote_counts = Counter(predictions)
    winner, count = vote_counts.most_common(1)[0]
    confidence = count / len(predictions)

    return winner, confidence, chunk_timeline
