import os
import re
import math

# CONFIGURATION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
UNKNOWN_DIR = os.path.join(SCRIPT_DIR, "../processed/unknown")

# How much of the end to chop off? (0.3 = delete the last 30% of the clips)
CHOP_RATIO = 0.3 

def main():
    if not os.path.exists(UNKNOWN_DIR):
        print(f"Error: Folder not found at {UNKNOWN_DIR}")
        return

    print(f"Scanning {UNKNOWN_DIR}...")
    
    # 1. Group files by their original Song Name
    # Regex finds "Song Name" from "Song Name_001.wav"
    # It looks for the LAST underscore followed by 3 digits
    pattern = re.compile(r"(.*)_(\d{3})\.wav$")
    
    song_groups = {}

    all_files = [f for f in os.listdir(UNKNOWN_DIR) if f.lower().endswith(".wav")]

    for filename in all_files:
        match = pattern.match(filename)
        if match:
            song_name = match.group(1)
            if song_name not in song_groups:
                song_groups[song_name] = []
            song_groups[song_name].append(filename)

    # 2. Process each song group
    deleted_count = 0
    
    print(f"Found {len(song_groups)} unique songs.")

    for song, files in song_groups.items():
        # Sort files to ensure 001, 002, 003 order
        files.sort()
        
        total_chunks = len(files)
        
        # Determine how many to cut
        # If song has 10 chunks, cut 3. If song has 3 chunks, cut 1.
        num_to_cut = math.ceil(total_chunks * CHOP_RATIO)
        
        # Safety: Don't delete everything. Leave at least 2 chunks if possible.
        if total_chunks - num_to_cut < 2:
            num_to_cut = 0 # Keep them all if it's very short
            
        # Identify files to delete (the last N files)
        files_to_delete = files[-num_to_cut:] if num_to_cut > 0 else []

        for fname in files_to_delete:
            full_path = os.path.join(UNKNOWN_DIR, fname)
            try:
                os.remove(full_path)
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting {fname}: {e}")

    print(f"\n--- Cleanup Complete ---")
    print(f"Deleted {deleted_count} files (the endings of songs).")
    print(f"Your 'Unknown' dataset is now much safer!")

if __name__ == "__main__":
    main()