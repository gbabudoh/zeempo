import os
import json
from groq import Groq
from dotenv import load_dotenv

def list_available_models(client):
    """List all available models from Groq"""
    try:
        # List available models
        models = client.models.list()
        print("\nAvailable models:")
        for model in models.data:
            print(f"- {model.id} (created: {model.created})")
        return [model.id for model in models.data]
    except Exception as e:
        print(f"❌ Error listing models: {str(e)}")
        return []

def test_groq_api():
    # Load environment variables from .env file
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
    
    # Get API key from environment
    api_key = os.getenv('GROQ_API_KEY')
    
    if not api_key:
        print("❌ Error: GROQ_API_KEY not found in environment variables")
        return False
    
    try:
        # Initialize Groq client
        client = Groq(api_key=api_key)
        
        # First, list available models
        available_models = list_available_models(client)
        if not available_models:
            print("❌ No models available. Please check your API key and try again.")
            return False
            
        # Try with the first available model
        model_to_use = available_models[0]
        print(f"\nTesting with model: {model_to_use}")
        
        # Test the API with a simple completion
        completion = client.chat.completions.create(
            model=model_to_use,
            messages=[{"role": "user", "content": "Say hello in Nigerian Pidgin"}],
            temperature=0.7,
            max_tokens=50,
            timeout=30  # Add timeout to prevent hanging
        )
        
        # Print the response
        print("\n✅ Success! Groq API is working with the following model:")
        print(f"Model: {model_to_use}")
        print("\nResponse:")
        print(completion.choices[0].message.content)
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing Groq API: {str(e)}")
        if available_models:
            print("\nAvailable models you can try:")
            for model in available_models:
                print(f"- {model}")
        return False

if __name__ == "__main__":
    test_groq_api()
