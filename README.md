# VoiceCart — AI Voice-Powered Shopping Assistant

<div align="center">

![VoiceCart Banner](https://img.shields.io/badge/VoiceCart-AI%20Shopping%20Assistant-6366f1?style=for-the-badge&logo=shopify&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A full-stack, voice-first grocery shopping assistant powered by AI.**  
Add items, remove items, modify quantities, check inventory, navigate to checkout, and generate PDF invoices — all with your voice.

[🚀 Quick Start](#-quick-start) · [📐 Architecture](#-architecture) · [🤖 AI Agent](#-ai-agent-system) · [📡 API Reference](#-api-reference) · [🛠️ Configuration](#️-configuration)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎤 **Voice Commands** | Full hands-free control via microphone — add, remove, update, check stock |
| 🤖 **AI Agent** | Deterministic intent router + LLM fallback (Ollama or OpenAI) |
| 🛒 **Smart Shopping List** | Real-time CRUD with category grouping and optimistic UI updates |
| 📦 **Product Catalog** | MongoDB-backed catalog with stock status, seasonal tags, and substitutes |
| 💡 **Smart Suggestions** | Seasonal and staple recommendations based on your current list |
| 🔍 **Catalog Search** | Filter by name, price, brand, and category |
| 🧾 **PDF Invoice** | Auto-generated, styled invoice downloaded on checkout |
| 🔔 **Real-time Toasts** | Instant success/error/stock-out notifications for every action |
| 👤 **Session Onboarding** | Name/email/phone collected at start, injected into invoice |
| 🌙 **Dark / Light Mode** | Smooth theme switching with persistent preference |
| 📱 **Responsive Design** | Mobile-first UI with bottom navigation and glassmorphism aesthetics |

---

## 🖥️ Screenshots

> _Add items by voice, manage your list in real-time, checkout, and download your invoice._

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | v24 recommended |
| MongoDB | ≥ 7 | Local or Atlas |
| Ollama | Latest | For local AI (optional) |
| Git | Any | — |

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/voicecart.git
cd voicecart
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your settings (see Configuration section)
npm install
```

### 3. Seed the product catalog

```bash
npm run seed
```

### 4. Configure the frontend

```bash
cd ../frontend
npm install
```

### 5. Start both servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📐 Architecture

```
voicecart/
├── backend/                    # Node.js / Express / WebSocket server
│   ├── server.js               # Main entry point, WS handler, agentic loop
│   ├── services/
│   │   └── aiService.js        # LLM adapter + deterministic intent router
│   ├── tools/
│   │   └── toolExecutor.js     # All AI tool implementations (DB operations)
│   ├── models/
│   │   ├── ShoppingItem.js     # Shopping list item schema (Mongoose)
│   │   └── ProductCatalog.js   # Product catalog schema (Mongoose)
│   ├── routes/
│   │   └── items.js            # REST API routes for items
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── errorHandler.js     # Global error middleware
│   └── scripts/
│       └── seedCatalog.js      # Catalog seeding script
│
└── frontend/                   # React + Vite SPA
    └── src/
        ├── App.jsx             # Root component, routing, tab management
        ├── components/
        │   ├── VoiceAssistantHero.jsx   # Main hero / voice UI
        │   ├── VoiceButton.jsx          # Mic button with state animation
        │   ├── ShoppingList.jsx         # Grouped item list
        │   ├── ListItem.jsx             # Individual item row + controls
        │   ├── Checkout.jsx             # Checkout + PDF invoice generation
        │   ├── OnboardingModal.jsx      # Session user details modal
        │   ├── ToastContainer.jsx       # Real-time notification toasts
        │   ├── Header.jsx               # Top navigation bar
        │   ├── CatalogBrowser.jsx       # Product catalog browser UI
        │   ├── SearchResults.jsx        # AI search result cards
        │   ├── SuggestionsPanel.jsx     # Smart recommendation panel
        │   ├── AddItemModal.jsx         # Manual add item modal
        │   └── TextInput.jsx            # Voice / text command input
        ├── hooks/
        │   ├── useWebSocket.js  # WS connection, reconnect, message dispatch
        │   └── useVoiceCapture.js # Microphone capture + audio streaming
        ├── store/
        │   ├── useShoppingStore.js  # Zustand global state
        │   └── useToastStore.js     # Toast notification state
        └── utils/
            └── constants.js     # WS URL, status enums, VOICE_STATES
```

---

## 🤖 AI Agent System

VoiceCart uses a **two-layer AI architecture** to handle voice commands reliably:

### Layer 1 — Deterministic Intent Router (0ms, no LLM)

Before any LLM call, the `intentRouter` function in `aiService.js` uses regex patterns to instantly match high-confidence intents:

```
"add 3 avocados"          → add_item_to_db { name: "Avocados", qty: 3 }
"take me to checkout"     → navigate_to_checkout {}
"finish payment"          → generate_bill {}
"remove milk"             → remove_item_from_db { name: "milk" }
"change milk to 3 litres" → update_item_quantity { name: "milk", qty: 3 }
"I got the eggs"          → mark_item_complete { name: "eggs" }
"is avocado in stock?"    → check_item_stock { name: "avocado" }
"clear everything"        → clear_all_items {}
```

Number words are fully supported: *"two litres of milk"*, *"a dozen eggs"*, *"three apples"*.

### Layer 2 — LLM Fallback

For novel/ambiguous phrasings not caught by the router, the request is forwarded to the configured LLM provider.

### Supported AI Providers

| Provider | Speed | Cost | Quality | Setup |
|---|---|---|---|---|
| **Ollama** (local) | ~1-2s | Free | Varies by model | Install + pull model |
| **OpenAI** (`gpt-4o-mini`) | ~500ms | ~$0.00015/1K tokens | Excellent | API key |

### Available Agent Tools

| Tool | Triggered By |
|---|---|
| `add_item_to_db` | "add X", "buy X", "I need X" |
| `remove_item_from_db` | "remove X", "delete X", "don't need X" |
| `update_item_quantity` | "change X to N", "set X to N" |
| `mark_item_complete` | "I got X", "I bought X", "check off X" |
| `unmark_item` | "I still need X", "uncheck X" |
| `clear_completed_items` | "clear done items", "remove checked" |
| `clear_all_items` | "clear everything", "start fresh" |
| `check_item_stock` | "is X in stock?", "do you have X?" |
| `search_catalog` | "find X", "search for X under $N" |
| `get_suggestions` | "what should I buy?", "surprise me" |
| `get_shopping_list` | "show my list", "what's in my cart?" |
| `navigate_to_checkout` | "checkout", "take me to pay" |
| `generate_bill` | "generate bill", "finish payment", "pay now" |

---

## 📡 API Reference

### WebSocket (`ws://localhost:5000`)

The primary interface. All voice commands and responses flow over a persistent WebSocket connection.

#### Client → Server messages

| `type` | Payload | Description |
|---|---|---|
| `text_command` | `{ text: string }` | Send a text or transcribed voice command |
| `audio_chunk` | `ArrayBuffer` | Raw PCM audio for transcription |
| `load_list` | — | Request current shopping list |

#### Server → Client messages

| `type` | Payload | Description |
|---|---|---|
| `connected` | `{ clientId, userId }` | Connection acknowledged |
| `list_update` | `{ items: ShoppingItem[] }` | Current list after any mutation |
| `response` | `{ message, toolResult, suggestions }` | AI response text |
| `action` | `{ tool, parameters, result }` | Tool execution result (triggers toasts) |
| `search_results` | `{ items: CatalogItem[] }` | Catalog search results |
| `suggestions` | `{ items: CatalogItem[] }` | Smart suggestions |
| `transcript` | `{ text: string }` | Live transcription text |
| `status` | `{ phase }` | Agent phase: transcribing / processing |
| `error` | `{ message }` | Error details |

### REST API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/items` | List all shopping items |
| `POST` | `/api/items` | Create a new item |
| `PUT` | `/api/items/:id` | Update an item |
| `DELETE` | `/api/items/:id` | Delete an item |

---

## 🛠️ Configuration

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# ── Server ────────────────────────────────
PORT=5000
FRONTEND_URL=http://localhost:5173

# ── Database ──────────────────────────────
MONGODB_URI=mongodb://localhost:27017/voicecart

# ── AI Provider ───────────────────────────
# Options: "ollama" | "openai"
AI_PROVIDER=ollama

# Ollama (local, free)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma:2b          # Recommended: llama3.2:3b or phi3:mini

# OpenAI (cloud, best quality)
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini

# ── Transcription ─────────────────────────
# Options: "local" | "whisper"
TRANSCRIPTION_PROVIDER=local
# WHISPER_URL=http://localhost:8080   # If using local Whisper server
```

### Recommended LLM Models

For best results with voice commands, use one of these models:

```bash
# Best quality (recommended)
ollama pull llama3.2:3b

# Lightweight & fast
ollama pull phi3:mini

# Tiny (may hallucinate on complex commands)
ollama pull gemma:2b
```

---

## 🧠 Data Models

### ShoppingItem

```javascript
{
  userId:      String,   // Session user ID
  name:        String,   // Item name
  category:    String,   // dairy | produce | meat | bakery | ...
  quantity:    Number,   // Amount
  unit:        String,   // piece | kg | litre | bottle | ...
  isCompleted: Boolean,  // Checked off?
  notes:       String,   // Optional notes
  createdAt:   Date
}
```

### ProductCatalog

```javascript
{
  name:         String,
  brand:        String,
  price:        Number,
  category:     String,
  inStock:      Boolean,
  isSeasonal:   Boolean,
  seasonMonths: [Number],  // 1-12
  substitutes:  [String],  // Suggested alternatives when out of stock
  tags:         [String]
}
```

---

## 🔄 Data Flow

```
User speaks / types
       ↓
  useVoiceCapture.js
  (mic → PCM audio)
       ↓
  WebSocket → Backend
       ↓
  aiService.js
  ┌────────────────────────┐
  │  intentRouter (Layer 1) │ → instant match → toolExecutor
  │     (regex, 0ms)        │
  └────────────────────────┘
           │ no match
           ↓
  LLM (Ollama / OpenAI)   → parse JSON → toolExecutor
       ↓
  toolExecutor.js
  (MongoDB operations)
       ↓
  WebSocket → Frontend
  ┌──────────────────────────┐
  │  useWebSocket.js         │
  │  - list_update → Zustand │
  │  - action → Toast popup  │
  │  - response → AI message │
  └──────────────────────────┘
```

---

## 🚢 Deployment

### Frontend (Vercel / Netlify)

```bash
cd frontend
npm run build
# Deploy the `dist/` folder
```

Set environment variable:
```
VITE_WS_URL=wss://your-backend-domain.com
```

### Backend (Railway / Render / Fly.io)

```bash
cd backend
# Set all .env variables in your hosting dashboard
npm start
```

Make sure to:
- Set `MONGODB_URI` to your MongoDB Atlas connection string
- Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` for reliable AI in production
- Set `FRONTEND_URL` to your deployed frontend URL

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Ollama](https://ollama.ai/) — Local LLM inference
- [OpenAI](https://openai.com/) — Cloud AI provider
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [jsPDF](https://github.com/parallax/jsPDF) — Client-side PDF generation
- [Lucide React](https://lucide.dev/) — Beautiful icon library
- [Framer Motion](https://www.framer.com/motion/) — Animation library

---

<div align="center">
  Built with ❤️ for modern, hands-free grocery shopping.
</div>
