"""
Audio Utility Functions
Helper functions for audio file validation and processing
"""
import io
from typing import Tuple


def validate_audio_file(content_type: str, file_size: int, max_size: int = 10_000_000) -> Tuple[bool, str]:
    """
    Validate uploaded audio file
    
    Args:
        content_type: MIME type of the file
        file_size: Size of file in bytes
        max_size: Maximum allowed size in bytes (default 10MB)
        
    Returns:
        Tuple of (is_valid: bool, error_message: str)
        If valid, error_message is empty string
    """
    # Check file size
    if file_size > max_size:
        max_mb = max_size / 1_000_000
        return False, f"File too big o! Maximum size na {max_mb}MB. Reduce am small."
    
    # Check if file size is reasonable (at least 1KB)
    if file_size < 1000:
        return False, "File too small o! Make sure say you don record something."
    
    # Extract base content type (remove codec info if present)
    # e.g., "audio/webm;codecs=opus" -> "audio/webm"
    base_content_type = content_type.split(';')[0].strip()
    
    # Check content type
    valid_types = [
        "audio/webm",
        "audio/wav",
        "audio/wave",
        "audio/mp3",
        "audio/mpeg",
        "audio/ogg",
        "audio/x-m4a",
        "audio/m4a"
    ]
    
    if base_content_type not in valid_types:
        return False, f"Audio format no correct o! We support: webm, wav, mp3, ogg. Your format na: {content_type}"
    
    return True, ""


def get_audio_format(content_type: str) -> str:
    """
    Get audio format string from content type
    
    Args:
        content_type: MIME type (e.g., "audio/webm" or "audio/webm;codecs=opus")
        
    Returns:
        Audio format string (e.g., "webm")
    """
    # Extract base content type (remove codec info if present)
    base_content_type = content_type.split(';')[0].strip()
    
    format_map = {
        "audio/webm": "webm",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
        "audio/x-m4a": "m4a",
        "audio/m4a": "m4a"
    }
    
    return format_map.get(base_content_type, "webm")


def audio_bytes_to_io(audio_data: bytes) -> io.BytesIO:
    """
    Convert audio bytes to BytesIO object for streaming
    
    Args:
        audio_data: Audio as bytes
        
    Returns:
        BytesIO object that can be streamed
    """
    return io.BytesIO(audio_data)


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted string (e.g., "1.5 MB")
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"