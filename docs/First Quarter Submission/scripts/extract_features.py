import librosa
import numpy as np
import os
import csv
import warnings

warnings.filterwarnings('ignore')

# CONFIGURATION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "../processed")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "../features/dataset.csv")

# FILTERING THRESHOLD
MIN_ONSETS_PER_CLIP = 15

def extract_features(file_path):
    try:
        y, sr = librosa.load(file_path, sr=22050)
        
        # === QUALITY CHECK ===
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        
        if len(onsets) < MIN_ONSETS_PER_CLIP:
            return None

        # === ADVANCED RHYTHM FEATURES ===
        
        # 1. Tempo (BPM)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        if np.ndim(tempo) > 0: tempo = tempo[0]

        # 2. Onset Dynamics (Punchiness)
        onset_mean = np.mean(onset_env)
        onset_var = np.var(onset_env)
        onset_max = np.max(onset_env)

        # 3. Autocorrelation (Finds repeating periodic cycles like 8 or 16 beats)
        autocorr = librosa.autocorrelate(onset_env, max_size=10000)
        autocorr_mean = np.mean(autocorr)
        autocorr_var = np.var(autocorr)
        autocorr_max = np.max(autocorr)

        # 4. Predominant Local Pulse (Underlying beat grid)
        pulse = librosa.beat.plp(onset_envelope=onset_env, sr=sr)
        pulse_mean = np.mean(pulse)
        pulse_var = np.var(pulse)

        # 5. Timbre (Drop MFCC 0 as it's just volume, keep 1-5 for Tabla thump)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=6)[1:6, :] # Keep rows 1 to 5
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
        print(f"Error reading {file_path}: {e}")
        return None

def main():
    # REMOVED DADRA
    labels = ["teentaal", "bhajani", "unknown"]

    # 19 Total Features
    header = [
        "tempo", 
        "onset_mean", "onset_var", "onset_max", 
        "autocorr_mean", "autocorr_var", "autocorr_max",
        "pulse_mean", "pulse_var"
    ]
    for i in range(1, 6): header.append(f"mfcc{i}_mean")
    for i in range(1, 6): header.append(f"mfcc{i}_std")
    header.append("label")
    header.append("filename")

    rows = []

    print(f"Scanning data in: {DATA_DIR}")
    
    for label in labels:
        folder = os.path.join(DATA_DIR, label)
        if not os.path.exists(folder):
            continue

        print(f"\n--- Extracting: {label} ---")
        
        for file in os.listdir(folder):
            if not file.lower().endswith(".wav"):
                continue

            path = os.path.join(folder, file)
            print(f"Processing: {file}...", end="")

            features = extract_features(path)
            
            if features:
                features.append(label)
                features.append(file)
                rows.append(features)
                print(" OK")
            else:
                print(" SKIPPED (Low Activity)")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print(f"\nDone! Extracted {len(header)-2} features for {len(rows)} clips.")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()