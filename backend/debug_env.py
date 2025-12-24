from app.config import get_settings
import os
from dotenv import load_dotenv

# Try raw os.getenv without explicit load_dotenv (simulating app behavior if it doesn't call it)
print(f"Code-based os.getenv: {os.getenv('GROQ_API_KEY')}")

# Try via settings
try:
    settings = get_settings()
    print(f"Settings.groq_api_key: {settings.groq_api_key[:4]}...{settings.groq_api_key[-4:] if settings.groq_api_key else 'EMPTY'}")
except Exception as e:
    print(f"Error loading settings: {e}")
