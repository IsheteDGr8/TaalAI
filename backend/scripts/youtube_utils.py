import re
import yt_dlp

def is_youtube_url(url: str) -> bool:
    """
    Validates whether the URL belongs to YouTube (used as the SSRF gate for the
    download path). Accepts any YouTube subdomain — www, m (mobile share),
    music, gaming, etc. — and the short youtu.be host. Case-insensitive and
    whitespace-tolerant so a copy-paste from a mobile share menu still works.
    """
    if not url or not isinstance(url, str):
        return False
    # Allow zero-or-more subdomain segments (www., m., music., gaming., ...).
    # Hostname segments use [\w-] which already covers a-z, A-Z, 0-9, and hyphen.
    youtube_regex = r'^(?:https?://)?(?:[\w-]+\.)*(?:youtube\.com|youtu\.be)/.+$'
    return bool(re.match(youtube_regex, url.strip(), re.IGNORECASE))

def download_youtube_audio(url: str, output_path: str, start_time: float = None, end_time: float = None) -> str:
    """
    Extracts audio from a YouTube URL and converts it to WAV.

    If ``start_time`` and ``end_time`` are provided, yt-dlp's ``download_ranges`` feature
    is used to download ONLY that segment of the video. This bypasses the 10-minute
    full-video limit and is dramatically faster (a 1-minute cut of a 30-minute video
    downloads in seconds instead of minutes).

    For full-video downloads, the 10-minute cap is still enforced for memory safety.

    Returns the final WAV file path on success, or raises ValueError on failure.
    """
    base_output_path = output_path.rsplit('.', 1)[0]
    has_range = start_time is not None and end_time is not None

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f"{base_output_path}.%(ext)s",
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }

    if has_range:
        # Download ONLY the requested segment. force_keyframes_at_cuts ensures clean cuts
        # without re-encoding the entire stream.
        ydl_opts['download_ranges'] = yt_dlp.utils.download_range_func(
            None, [(float(start_time), float(end_time))]
        )
        ydl_opts['force_keyframes_at_cuts'] = True
    else:
        ydl_opts['match_filter'] = yt_dlp.utils.match_filter_func("duration <= 600")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        final_path = f"{base_output_path}.wav"
        return final_path

    except yt_dlp.utils.DownloadError as e:
        if "duration" in str(e).lower():
            raise ValueError("YouTube video exceeds the 10-minute maximum duration limit. Try cropping to a specific section instead.")
        raise ValueError(f"Failed to process YouTube URL: {str(e)}")