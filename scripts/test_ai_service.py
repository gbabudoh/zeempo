"""
Test script for the AI Service
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the .env file in the parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent / 'backend'
sys.path.append(str(backend_dir))

# Now import the AI service
from app.services.ai_service import AIService

async def test_ai_service():
    """Test the AI service with a sample message"""
    try:
        # Initialize the AI service
        ai_service = AIService()
        
        # Test message
        test_message = "Hello, how are you today?"
        
        print(f"🤖 Sending message to AI: {test_message}")
        
        # Get response (async version)
        response = await ai_service.generate_pidgin_response(test_message)
        
        print("\n✅ AI Response (Pidgin):")
        print(response)
        
        # Test sync version
        print("\n🤖 Testing sync version...")
        sync_response = ai_service.generate_pidgin_response_sync(test_message)
        print("✅ Sync response received!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing AI service: {str(e)}")
        return False

if __name__ == "__main__":
    # Run the async test
    asyncio.run(test_ai_service())
