import librosa
import soundfile as sf
import os
import math

# CONFIGURATION
# Uses relative paths so it works from 'scripts' folder
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(SCRIPT_DIR, "../raw")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../processed")

SAMPLE_RATE = 22050
CLIP_DURATION = 20  # seconds
MIN_DURATION = 5    # Discard chunks shorter than this (e.g., end of song silence)

def process_file(in_path, out_folder, filename):
    try:
        # Load audio
        y, sr = librosa.load(in_path, sr=SAMPLE_RATE, mono=True)
        
        # Trim leading/trailing silence
        y, _ = librosa.effects.trim(y, top_db=25)
        
        total_duration = librosa.get_duration(y=y, sr=sr)
        required_samples = SAMPLE_RATE * CLIP_DURATION
        
        # LOGIC: Slice or Pad?
        if total_duration > CLIP_DURATION:
            # === LONG FILE (SLICE IT) ===
            num_chunks = math.floor(total_duration / CLIP_DURATION)
            print(f"--> Slicing '{filename}' into {num_chunks} chunks...")
            
            for i in range(num_chunks):
                start_sample = i * required_samples
                end_sample = start_sample + required_samples
                
                chunk = y[start_sample:end_sample]
                
                # Double check length (should be exact, but good safety)
                if len(chunk) == required_samples:
                    chunk = librosa.util.normalize(chunk)
                    
                    # Create new filename: original_001.wav
                    chunk_name = f"{os.path.splitext(filename)[0]}_{i+1:03d}.wav"
                    out_path = os.path.join(out_folder, chunk_name)
                    
                    sf.write(out_path, chunk, SAMPLE_RATE)
                    
        else:
            # === SHORT FILE (PAD IT) ===
            # If it's too short (like < 2s), maybe skip? For now we pad.
            if total_duration < 2.0: 
                print(f"Skipping '{filename}' (Too short: {total_duration:.2f}s)")
                return

            y = librosa.util.fix_length(y, size=required_samples)
            y = librosa.util.normalize(y)
            
            out_path = os.path.join(out_folder, filename)
            sf.write(out_path, y, SAMPLE_RATE)
            print(f"Processed short file: {filename}")

    except Exception as e:
        print(f"Error processing {filename}: {e}")

def main():
    # Ensure output directory exists
    if not os.path.exists(INPUT_DIR):
        print(f"Error: Raw data folder not found at {INPUT_DIR}")
        return

    # Iterate over all taal folders in 'raw'
    for label in os.listdir(INPUT_DIR):
        label_in_dir = os.path.join(INPUT_DIR, label)
        label_out_dir = os.path.join(OUTPUT_DIR, label)

        # Skip files that aren't folders (like .DS_Store)
        if not os.path.isdir(label_in_dir):
            continue

        os.makedirs(label_out_dir, exist_ok=True)
        print(f"\n=== Processing Class: {label} ===")

        files = [f for f in os.listdir(label_in_dir) if f.lower().endswith(('.wav', '.mp3', '.m4a'))]
        
        for file in files:
            in_path = os.path.join(label_in_dir, file)
            process_file(in_path, label_out_dir, file)

if __name__ == "__main__":
    main()