## AUDIO INGESTION PIPELINE ##
## YouTube link --> Audio file downloader using yt-dlp  ##
## Audio downloaded from youtube videos, whose links are in data/SongLinks.txt, and stored in data/raw/ ##
import yt_dlp
import os
import sys

# Ensure stdout uses UTF-8 on Windows to avoid UnicodeEncodeError when printing
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

def download_from_file(txt_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_dir + '/%(title)s.%(ext)s',
        'postprocessors': [
            {
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }
        ],
        'quiet': False
    }

    with open(txt_path, 'r') as f:
        links = [l.strip() for l in f.readlines()]

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for link in links:
            try:
                print(f"Downloading: {link}")
                ydl.download([link])
            except Exception as e:
                print("FAILED:", link, e)

download_from_file("data/SongLinks.txt", "data/raw")





## NORMALIZATION: CONVERSION ##
## Audio format --> .wav format using ffmpeg ##
## Audio from data/raw/ converted to .wav format and saved in data/raw/ ##
import subprocess

RAW_DIRS = [
    "data/raw",
]

def convert_folder(folder):
    for fname in os.listdir(folder):
        if fname.lower().endswith(".webm"):
            in_path = os.path.join(folder, fname)
            out_name = fname.replace(".webm", ".wav")
            out_path = os.path.join(folder, out_name)

            print("Converting:", in_path)
            cmd = [
                "ffmpeg", "-y",
                "-i", in_path,
                "-ac", "1",
                "-ar", "22050",
                out_path
            ]
            subprocess.run(cmd)

if __name__ == "__main__":
    for folder in RAW_DIRS:
        print("\n=== Converting folder:", folder, "===\n")
        convert_folder(folder)





## NORMALIZATION: DELETION OF OLD NON-WAV FORMAT AUDIO ##
## Delete all raw audio not in .wav ##
RAW_DIR = "data/raw"
for fname in os.listdir(RAW_DIR):
    if not fname.lower().endswith(".wav"):
        fpath = os.path.join(RAW_DIR, fname)
        print("Deleting:", fpath)
        os.remove(fpath)




## NORMALIZATION: TRIMMING ##
## Trimming audio to 30s using ffmpeg ##
RAW_SONGS = "data/raw"
OUT_SONGS = "data/trimmed"

os.makedirs(OUT_SONGS, exist_ok=True)

def trim_folder(in_folder, out_folder):
    for fname in os.listdir(in_folder):
        if fname.lower().endswith(".wav"):
            in_path = os.path.join(in_folder, fname)
            out_name = "TRIMMED-" + fname
            out_path = os.path.join(out_folder, out_name)

            # Use a safe print to avoid UnicodeEncodeError on Windows consoles
            try:
                print("Trimming:", in_path)
            except UnicodeEncodeError:
                safe = in_path.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(sys.stdout.encoding or "utf-8")
                print("Trimming:", safe)
            cmd = [
                "ffmpeg", "-y",
                "-i", in_path,
                "-t", "30",
                out_path
            ]
            subprocess.run(cmd)

if __name__ == "__main__":
    print("\n=== Trimming Songs ===")
    trim_folder(RAW_SONGS, OUT_SONGS)