# Zeempo 🎙️

Zeempo is a modern AI-powered conversation platform designed for the African context, supporting **Nigerian/Ghanaian Pidgin English** and **Swahili**. It features a clean, premium interface and seamless voice-to-voice and text-to-voice interactions using the Groq LLaMA 3.3 70B model.

## ✨ Features

- **Multi-Language Support**: Seamlessly switch between Pidgin English and Swahili.
- **Voice Integration**: Speech-to-Text (STT) and Text-to-Speech (TTS) optimized for African accents (`sw-KE` and `en-NG`).
- **AI Intelligence**: Powered by Groq's high-speed API with custom system prompts for cultural accuracy.
- **Premium UI**: Modern, light-themed responsive design with custom branding.
- **Chat History**: Locally saved conversations so you never lose your yarning.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: Groq (LLaMA 3.3 70B)
- **Voice APIs**: Browser-native SpeechRecognition and SpeechSynthesis

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js & npm
- [Groq API Key](https://console.groq.com/)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/gbabudoh/zeempo.git
   cd zeempo
   ```

2. **Backend Setup**:

   ```bash
   cd backend
   pip install -r requirements.txt
   # Create a .env file with your GROQ_API_KEY
   python -m app.main
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🌍 Languages Supported

- **Pidgin**: "How you dey? Na Zeempo dey here to help you yarn!"
- **Swahili**: "Habari yako! Zeempo iko hapa kukusaidia leo."

---

Developed with ❤️ for Africa.
