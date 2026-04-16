import yt_dlp
import os
import re

# CONFIGURATION
# This assumes you run this from the 'scripts' folder
BASE_RAW_DIR = "../test"
LINKS_FILE = "test_links.txt"

def get_target_folder(line):
    """Parses the line to find [Taal] and returns the folder path."""
    line = line.lower()
    if "[teentaal]" in line:
        return os.path.join(BASE_RAW_DIR, "teentaal")
    elif "[dadra]" in line:
        return os.path.join(BASE_RAW_DIR, "dadra")
    elif "[bhajani]" in line:
        return os.path.join(BASE_RAW_DIR, "bhajani")
    elif "[unknown]" in line:
        return os.path.join(BASE_RAW_DIR, "unknown")
    else:
        return None # Skip if no tag found

def download_songs():
    
    if not os.path.exists(LINKS_FILE):
        print(f"Error: {LINKS_FILE} not found. Make sure you are in the 'scripts' folder.")
        return

    with open(LINKS_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"): continue

        # 1. Determine Output Folder based on Tag
        target_dir = get_target_folder(line)
        
        if not target_dir:
            print(f"Skipping (No tag found): {line}")
            continue

        # 2. Extract URL
        # Looks for http... up to the first space or end of line
        url_match = re.search(r'(https?://\S+)', line)
        if not url_match:
            print(f"Skipping (No URL): {line}")
            continue
        
        url = url_match.group(1)
        
        # 3. Download
        print(f"\nDownloading to {target_dir}: {url}")
        os.makedirs(target_dir, exist_ok=True)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{target_dir}/%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    download_songs()