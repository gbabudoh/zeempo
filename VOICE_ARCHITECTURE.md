# Zeempo Voice-to-Voice & Text-to-Text Architecture

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Text-to-Text Flow](#text-to-text-flow)
- [Voice-to-Voice Flow](#voice-to-voice-flow)
- [Components](#components)
- [Setup Guide](#setup-guide)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)

---

## Overview

Zeempo provides two modes of AI conversation in Nigerian Pidgin English and Swahili:

1. **Text-to-Text**: Traditional chat interface with optional voice input/output
2. **Voice-to-Voice**: Real-time conversational AI powered by ElevenLabs

### Technology Stack

**Frontend:**

- React + Vite
- ElevenLabs React SDK (`@elevenlabs/react`)
- Web Speech API (for text mode voice input)

**Backend:**

- FastAPI (Python)
- Groq API (LLM - Llama 3.3 70B)
- Prisma (Database ORM)

**Infrastructure:**

- ngrok (local tunnel for ElevenLabs webhook)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React App (localhost:3000)                              │  │
│  │  ┌────────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ Text Chat UI       │  │ VoiceAgent Component     │   │  │
│  │  │ (Web Speech API)   │  │ (ElevenLabs SDK)         │   │  │
│  │  └────────────────────┘  └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           │ HTTP                               │ WebSocket
           ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   FastAPI Backend       │          │   ElevenLabs Cloud      │
│   (localhost:8000)      │◄─────────│   Conversational AI     │
│                         │  Webhook │                         │
│  /api/text-to-pidgin    │          │  Agent IDs:             │
│  /api/v1/chat/completions│         │  - Pidgin Agent         │
└─────────────────────────┘          │  - Swahili Agent        │
           │                          └─────────────────────────┘
           │                                    ▲
           │                                    │
           ▼                                    │
┌─────────────────────────┐                    │
│   ngrok Tunnel          │────────────────────┘
│   *.ngrok-free.dev      │  HTTPS Public URL
└─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   Groq API              │
│   (Llama 3.3 70B)       │
└─────────────────────────┘
```

---

## Text-to-Text Flow

### User Journey

1. User types message in chat input
2. User clicks Send (or uses voice input via Web Speech API)
3. Frontend sends text to backend
4. Backend processes with Groq LLM
5. Response displayed in chat
6. (Optional) Browser TTS reads response aloud

### Technical Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend (FastAPI)
    participant G as Groq API
    participant D as Database

    U->>F: Type "How far?"
    F->>B: POST /api/text-to-pidgin
    Note over B: Extract message, language, session_id
    B->>D: Save user message to ChatMessage
    B->>G: POST /chat/completions (with system prompt)
    G-->>B: "I dey o! Wetin dey sup?"
    B->>D: Save AI response to ChatMessage
    B-->>F: Return PidginResponse
    F->>U: Display response
    Note over F,U: Optional: Browser TTS reads aloud
```

### Key Files

- **Frontend**: [`src/App.jsx`](frontend/src/App.jsx) - Main chat UI
- **Backend**: [`app/routes/voice.py`](backend/app/routes/voice.py) - `/text-to-pidgin` endpoint
- **Service**: [`app/services/ai_service.py`](backend/app/services/ai_service.py) - Groq integration

---

## Voice-to-Voice Flow

### User Journey

1. User toggles Pidgin/Swahili language
2. User clicks microphone button (bottom-right)
3. ElevenLabs agent greets user
4. User speaks naturally
5. AI responds with voice in real-time
6. Conversation continues until user hangs up

### Technical Flow

```mermaid
sequenceDiagram
    participant U as User
    participant V as VoiceAgent Component
    participant E as ElevenLabs Cloud
    participant N as ngrok Tunnel
    participant B as Backend (FastAPI)
    participant G as Groq API

    U->>V: Click mic (language=pidgin)
    V->>V: Select agent_6901ke08y7nseg2rwcvxv2hva2nx
    V->>E: WebSocket: startSession(agentId)
    E->>U: TTS: "How far? Wetin dey sup?"
    U->>E: Speak: "I dey fine"
    E->>E: ASR: Convert speech to text
    E->>N: POST https://...ngrok.../api/v1/chat/completions
    N->>B: Forward request (OpenAI format)
    B->>B: Inject Pidgin system prompt (if needed)
    B->>G: Stream request to Groq
    G-->>B: Stream: "Glad to hear say you dey fine..."
    B-->>N: SSE Stream (OpenAI format)
    N-->>E: Forward stream
    E->>E: TTS: Convert text to speech
    E->>U: Play audio response
```

### Key Files

- **Frontend**: [`src/components/VoiceAgent.jsx`](frontend/src/components/VoiceAgent.jsx) - ElevenLabs integration
- **Backend**: [`app/routes/voice.py`](backend/app/routes/voice.py) - `/v1/chat/completions` endpoint
- **Service**: [`app/services/ai_service.py`](backend/app/services/ai_service.py) - Streaming support

---

## Components

### Frontend Components

#### `VoiceAgent.jsx`

- **Purpose**: Manages real-time voice conversation
- **Features**:
  - Language-aware agent selection
  - WebSocket connection to ElevenLabs
  - Visual feedback (listening indicator, waveform)
  - Automatic reconnection on language switch
- **Props**:
  - `language`: `'pidgin' | 'swahili'`

#### `App.jsx`

- **Purpose**: Main application container
- **Features**:
  - Text chat interface
  - Language toggle (Pidgin/Swahili)
  - Session management
  - Authentication
  - Integration point for VoiceAgent

### Backend Endpoints

#### `POST /api/text-to-pidgin`

**Text-to-Text Endpoint**

```python
{
  "message": "How are you?",
  "language": "pidgin",  # or "swahili"
  "session_id": "optional-uuid"
}
```

Response:

```python
{
  "response": "I dey fine o!",
  "language": "pidgin",
  "processing_time": 0.5,
  "session_id": "uuid"
}
```

#### `POST /api/v1/chat/completions`

**Custom LLM Endpoint for ElevenLabs**

OpenAI-compatible streaming endpoint. Receives conversational context from ElevenLabs and streams Groq responses.

Request (from ElevenLabs):

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "system", "content": "You are Zeempo..." },
    { "role": "user", "content": "How far?" }
  ],
  "stream": true
}
```

Response (SSE Stream):

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk",...}

data: [DONE]
```

### Services

#### `AIService` ([`ai_service.py`](backend/app/services/ai_service.py))

- **Methods**:
  - `generate_ai_response()`: Non-streaming text generation
  - `generate_ai_response_stream()`: Streaming text generation for voice
- **Configuration**:
  - Model: `llama-3.3-70b-versatile` (Groq)
  - Temperature: 0.7
  - Max tokens: 1000

---

## Setup Guide

### Prerequisites

- Python 3.9+
- Node.js 18+
- ngrok account (free tier works)
- ElevenLabs account
- Groq API key

### Backend Setup

1. **Install dependencies:**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment:**

   ```bash
   # backend/.env
   GROQ_API_KEY=gsk_your_key_here
   DATABASE_URL=postgresql://...
   ```

3. **Start server:**
   ```bash
   python -m app.main
   ```
   Server runs on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**

   ```bash
   # frontend/.env.local
   VITE_ELEVENLABS_AGENT_ID_PIDGIN=agent_6901ke08y7nseg2rwcvxv2hva2nx
   VITE_ELEVENLABS_AGENT_ID_SWAHILI=agent_8701ke0g1911etcvxw34v64ncqz9
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:3000`

### ngrok Setup

1. **Authentication:**

   ```bash
   npx ngrok config add-authtoken YOUR_TOKEN
   ```

2. **Start tunnel:**

   ```bash
   npx ngrok http 8000
   ```

3. **Copy public URL** (e.g., `https://abc123.ngrok-free.dev`)

### ElevenLabs Agent Configuration

#### Pidgin Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create/edit agent: `zeempo-agent-both`
3. **System Prompt:**
   ```
   You are Zeempo, a helpful AI assistant.
   You MUST speak in Nigerian Pidgin English at all times.
   Even if the user speaks Standard English, you reply in Pidgin.
   Keep your responses short, funny, and sharp.
   No big grammar.
   ```
4. **First Message:** `How far? Wetin dey sup today?`
5. **LLM Settings:**
   - Type: Custom LLM
   - Server URL: `https://YOUR_NGROK_URL/api/v1`
   - Model ID: `llama-3.3-70b-versatile`
6. **Publish** the agent

#### Swahili Agent

Duplicate and modify:

- **System Prompt:**
  ```
  Wewe ni Zeempo, msaidizi wa AI.
  LAZIMA useme Kiswahili kila wakati.
  Hata mtumiaji akizungumza Kiingereza, jibu kwa Kiswahili.
  Jibu zako ziwe fupi na zenye kufurahisha.
  ```
- **First Message:** `Habari! Unahitaji msaada gani leo?`

---

## API Endpoints

### Health Check

```
GET /health
```

### Authentication

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Chat

```
GET /api/chats              # List sessions
GET /api/chats/{id}         # Get session history
DELETE /api/chats/{id}      # Delete session
POST /api/text-to-pidgin    # Send message
```

### Custom LLM (ElevenLabs)

```
POST /api/v1/chat/completions  # OpenAI-compatible streaming
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description           | Example                          |
| -------------- | --------------------- | -------------------------------- |
| `GROQ_API_KEY` | Groq API key          | `gsk_...`                        |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `SECRET_KEY`   | JWT signing key       | `random-string`                  |
| `GROQ_MODEL`   | LLM model name        | `llama-3.3-70b-versatile`        |

### Frontend (`frontend/.env.local`)

| Variable                           | Description      | Example        |
| ---------------------------------- | ---------------- | -------------- |
| `VITE_ELEVENLABS_AGENT_ID_PIDGIN`  | Pidgin agent ID  | `agent_690...` |
| `VITE_ELEVENLABS_AGENT_ID_SWAHILI` | Swahili agent ID | `agent_870...` |

---

## Troubleshooting

### Voice Agent Disconnects Immediately

**Symptom:** Mic connects but hangs up after greeting.

**Solutions:**

1. Check backend logs for `404` errors → Fix ngrok URL
2. Check backend logs for `500` errors → Check Groq API key
3. Verify ElevenLabs agent is **Published**

### 404 on `/v1/chat/completions`

**Cause:** Missing `/api` prefix in ElevenLabs Server URL.

**Fix:** Update to `https://YOUR_NGROK_URL/api/v1`

### Agent ID Missing

**Symptom:** Alert: "Agent ID is missing!"

**Fix:**

1. Create `frontend/.env.local`
2. Add both agent IDs
3. Restart `npm run dev`

### ngrok Tunnel Closed

**Symptom:** Connection works initially, then fails.

**Cause:** ngrok free tier closes after ~2 hours.

**Fix:** Restart ngrok, update ElevenLabs Server URL with new domain.

---

## Performance Considerations

### Latency Targets

- **Text-to-Text**: < 2s (Groq response time)
- **Voice-to-Voice**: < 500ms (first token, target)

### Optimization Strategies

1. **Streaming**: All LLM responses use streaming to reduce TTFT
2. **Connection Pooling**: FastAPI handles concurrent requests efficiently
3. **Session Caching**: Chat history loaded from database, not re-sent to LLM

---

## Security Notes

### ngrok Usage

- Free tier exposes your local machine
- Only use for development
- For production, deploy backend to cloud with HTTPS

### API Keys

- Never commit `.env` or `.env.local` files
- Use `.env.example` for templates
- Rotate keys periodically

### CORS

- Current setup allows `localhost:3000` and `localhost:5173`
- Update `app/main.py` CORS origins for production domains

---

## Future Enhancements

### Planned Features

- [ ] Transcript display for voice conversations
- [ ] Voice activity detection tuning
- [ ] Multi-session voice support
- [ ] Voice cloning for personalized responses
- [ ] Mobile app (React Native)
- [ ] Offline mode with local LLM

### Architecture Improvements

- [ ] Replace ngrok with production reverse proxy
- [ ] Add Redis for session state
- [ ] Implement rate limiting
- [ ] Add monitoring (Sentry, DataDog)
- [ ] CI/CD pipeline

---

## Credits

**Developed by:** Zeempo Team  
**LLM Provider:** Groq (Llama 3.3 70B)  
**Voice Provider:** ElevenLabs  
**Framework:** FastAPI + React
