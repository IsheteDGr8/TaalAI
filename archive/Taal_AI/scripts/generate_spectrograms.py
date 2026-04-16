import os
import librosa
import numpy as np
import warnings
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings('ignore')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "../processed")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../cnn_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_FRAMES = 862 
N_MELS = 128

def audio_to_spectrogram(file_path):
    try:
        y, sr = librosa.load(file_path, sr=22050)
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=N_MELS, hop_length=512)
        S_DB = librosa.power_to_db(S, ref=np.max)
        
        # ---> STRICT NORMALIZATION (0.0 to 1.0) <---
        # This prevents the AI's math from exploding
        S_DB = (S_DB - np.min(S_DB)) / (np.max(S_DB) - np.min(S_DB) + 1e-8)
        
        if S_DB.shape[1] < MAX_FRAMES:
            pad_width = MAX_FRAMES - S_DB.shape[1]
            S_DB = np.pad(S_DB, pad_width=((0, 0), (0, pad_width)), mode='constant')
        else:
            S_DB = S_DB[:, :MAX_FRAMES]
            
        return S_DB
    except Exception as e:
        return None

def main():
    print("Initializing Deep Learning Data Pipeline...")
    classes = [d for d in os.listdir(DATA_DIR) if os.path.isdir(os.path.join(DATA_DIR, d))]
    print(f"Detected {len(classes)} classes: {classes}")
    
    X, y_labels = [], []

    for label in classes:
        folder = os.path.join(DATA_DIR, label)
        print(f"Processing: [{label}]")
        files = [f for f in os.listdir(folder) if f.endswith('.wav')]
        for i, file in enumerate(files):
            file_path = os.path.join(folder, file)
            spectrogram = audio_to_spectrogram(file_path)
            if spectrogram is not None:
                X.append(spectrogram)
                y_labels.append(label)

    X = np.array(X)[..., np.newaxis] 
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y_labels)

    np.save(os.path.join(OUTPUT_DIR, 'X_data.npy'), X)
    np.save(os.path.join(OUTPUT_DIR, 'y_labels.npy'), y_encoded)
    np.save(os.path.join(OUTPUT_DIR, 'classes.npy'), encoder.classes_)
    print(f"✅ SUCCESS! Matrix Shape: {X.shape}")

if __name__ == "__main__":
    main()