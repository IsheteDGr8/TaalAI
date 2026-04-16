import os
import glob
from archive.Taal_AI.scripts.predict_cnn import predict_song_cnn as predict_song 

# CONFIGURATION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# os.path.normpath cleans up the "../" so Windows understands it perfectly
TEST_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "../test"))

def run_batch_test():
    if not os.path.exists(TEST_DIR):
        print(f"Please create the directory: {TEST_DIR} and add test audio files.")
        return

    # Find all wav/mp3 files in the test directory and its subfolders
    test_files = glob.glob(os.path.join(TEST_DIR, "**/*.*"), recursive=True)
    audio_files = [f for f in test_files if f.lower().endswith(('.wav', '.mp3'))]

    print(f"Found {len(audio_files)} files for Batch Testing.\n")
    print("="*50)

    for file_path in audio_files:
        # The true label is just the name of the folder it's in
        true_label = os.path.basename(os.path.dirname(file_path)).lower()
        
        print(f"\n[TRUE LABEL: {true_label.upper()}]")
        # Run your prediction script
        predict_song(file_path)
        print("="*50)

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning)
    run_batch_test()