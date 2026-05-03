import re
import yt_dlp

def is_youtube_url(url: str) -> bool:
    """
    Strictly validates if the incoming URL belongs to YouTube to prevent
    Server-Side Request Forgery (SSRF) vulnerabilities.
    """
    youtube_regex = r'^(https?://)?(www\.)?(youtube\.com|youtu\.?be)/.+$'
    return bool(re.match(youtube_regex, url))

def download_youtube_audio(url: str, output_path: str) -> str:
    """
    Extracts audio from a YouTube URL and converts it to WAV.
    Rejects videos longer than 10 minutes (600 seconds) to prevent memory overload.
    
    Returns the final file path if successful, or raises an Exception if it fails.
    """
    base_output_path = output_path.rsplit('.', 1)[0]
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f"{base_output_path}.%(ext)s",
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'match_filter': yt_dlp.utils.match_filter_func("duration <= 600"),
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        final_path = f"{base_output_path}.wav"
        return final_path
        
    except yt_dlp.utils.DownloadError as e:
        if "duration" in str(e).lower():
            raise ValueError("YouTube video exceeds the 10-minute maximum duration limit.")
        raise ValueError(f"Failed to process YouTube URL: {str(e)}")