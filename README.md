<div align="center">

  <img src="frontend/public/logo.svg" alt="VoiceCart Logo" width="100" height="100" />

  # VoiceCart — AI-Powered Conversational Shopping Assistant

  **An Enterprise-Grade, Full-Stack Conversational Commerce & Accessibility Platform**

  [![Live Frontend](https://img.shields.io/badge/Live_App-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://voicecart-app.netlify.app)
  [![Production Backend](https://img.shields.io/badge/API_Server-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://voicecart-t5c9.onrender.com)
  [![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
  [![Inference](https://img.shields.io/badge/Inference-Groq_Cloud_(Llama_3.3_70B)-F55036?style=for-the-badge&logo=fastapi&logoColor=white)](https://groq.com)

  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

  <br />

  [🌐 Live Application](https://voicecart-app.netlify.app) · [📐 System Architecture](#-system-architecture) · [🧠 Core Engineering](#-core-engineering--problem-solving) · [📡 API & Protocols](#-websocket--api-specification) · [🚀 Deployment Guide](#-production-deployment)

</div>

---

## 📌 Executive Summary & Problem Statement

### 🎯 The Industry Problem
Traditional e-commerce grocery applications suffer from **high cart-abandonment rates** and **cognitive friction**:
1. **Multi-Step Search & Navigation**: Users waste time typing, applying multiple filters, and manually selecting quantities.
2. **Accessibility Barriers**: Visually impaired, elderly, or multitasking users (e.g., cooking, driving) cannot easily interact with touchscreen UI grids.
3. **Static Catalogues**: Traditional apps fail to recommend seasonal substitutes or notify stockouts proactively before the checkout stage.

### 💡 The Solution: VoiceCart
**VoiceCart** is an end-to-end, multi-modal conversational shopping assistant designed to make online shopping as effortless as speaking to an in-store attendant. Built with high-speed **WebSocket event streams**, **Groq Whisper speech-to-text (~150ms)**, a **two-layer deterministic intent router**, and **70B-parameter LLM reasoning**, VoiceCart converts free-form human voice commands into structured transactional cart operations in sub-second response times.

---

## 🌟 Key Capabilities & Features

```
                   VoiceCart Enterprise Feature Matrix
 ┌───────────────────────┬─────────────────────────────────────────────────┐
 │ 🎙️ Voice-First UX     │ Real-time microphone capture & PCM streaming   │
 │ ⚡ Sub-Second Speed   │ Hybrid Deterministic Router + Groq 70B LLM     │
 │ 📦 Smart Inventory    │ Real-time stock verification & substitutes      │
 │ 🛒 End-to-End Flow   │ Voice-triggered Checkout, Payment & Invoicing   │
 │ 📄 Instant PDF Bill   │ Client-side dynamic PDF invoice compilation     │
 │ 🔔 Instant Feedback   │ Color-coded real-time action toasts             │
 │ 🌙 Design System      │ Responsive, Accessible Dark/Light Glassmorphism │
 └───────────────────────┴─────────────────────────────────────────────────┘
```

- **Natural Speech Processing**: Handles colloquial speech, fractions, and units (*"add two litres of whole milk"*, *"a dozen eggs"*, *"half a kg of apples"*).
- **Dynamic Category Mapping**: Automatically infers standard grocery categories (*Dairy, Produce, Bakery, Beverages, Meat, etc.*).
- **Proactive Stockout Detection**: If an item is unavailable, the assistant rejects the addition and suggests in-stock substitutes in real time.
- **Voice-Orchestrated Checkout**: Users can say *"take me to checkout"* and *"generate my final bill"* to navigate screens and auto-download a PDF receipt hands-free.
- **Zero-Friction Onboarding**: Session-isolated onboarding modal ensures clean sessions with no data leakage between different users.

---

## 📐 System Architecture

VoiceCart is engineered around a **decoupled, event-driven reactive architecture**:

```mermaid
flowchart TD
    User([🎙️ User Voice / Text Input]) -->|Web Audio API| Client[⚛️ React 18 SPA - Netlify]
    
    subgraph Frontend [Frontend Layer - Netlify]
        Client --> Store[(Zustand State Store)]
        Client --> AudioProc[Voice Capture & Audio Streamer]
        Client --> PDFGen[jsPDF Invoice Generator]
        Client --> ToastSys[Toast Notification System]
    end

    AudioProc -->|WebSocket /ws| Gateway[🚀 Express + WS Server - Render]

    subgraph Backend [Backend & AI Layer - Render]
        Gateway --> IntentRouter{⚡ Layer 1: Deterministic Router}
        IntentRouter -->|Pattern Match 0ms| ToolExec[🛠️ Tool Executor]
        IntentRouter -->|Complex / Novel Phrasing| LLM[🧠 Layer 2: Groq Llama-3.3 70B]
        LLM --> ToolExec
        ToolExec --> DB[(🍃 MongoDB Atlas Cloud)]
    end

    ToolExec -->|Action Confirmation & List Update| Gateway
    Gateway -->|WS Broadcast| Store
    Store --> ToastSys
    Store --> PDFGen
```

---

## 🧠 Core Engineering & Problem Solving

### 1. Dual-Layer AI Architecture (Zero-Latency + High Intelligence)
* **Problem**: Relying solely on small local LLMs (`gemma:2b`) led to hallucinations, high latency, and repetitive loops. Relying solely on large cloud LLMs introduces unnecessary API costs and network roundtrips.
* **Solution**: Implemented a **two-tier execution engine**:
  - **Tier 1 (Deterministic Router)**: Regex-based pattern matching handles 90% of routine actions (*add, remove, update quantity, check stock, navigate, clear list*) in **0–2ms**.
  - **Tier 2 (Groq Cloud LLM)**: Handles complex, multi-turn reasoning and conversational requests using `llama-3.3-70b-versatile` / `groq/compound-mini`.

### 2. Audio Pipeline & Speech-To-Text
* **Audio Capture**: Browser `MediaRecorder` captures audio in `audio/webm;codecs=opus`.
* **Streaming Protocol**: Chunks are streamed over binary WebSockets to the Node.js gateway.
* **Cloud Transcription**: Processed via **Groq Whisper Large v3 Turbo** with average transcription latency of **~150ms**.

### 3. State Management & Optimistic UI
* Built with **Zustand** for zero-boilerplate reactive state management.
* Client updates item quantities and status optimistically before WebSocket server confirmation, providing instant visual feedback.

### 4. Client-Side Invoice Generation
* Integrated `jspdf` and `html2canvas` to render high-resolution vectorized receipts on-the-fly without server CPU overhead.

---

## 🛠️ AI Tool Schemas & Inventory Engine

The backend equips the AI agent with **13 discrete tools**:

| Tool Identifier | Description | Example Voice Trigger |
|---|---|---|
| `add_item_to_db` | Adds or increments product in cart with auto-category | *"Add 2 litres of milk"* |
| `remove_item_from_db` | Removes specific product from cart | *"Remove the eggs from my list"* |
| `update_item_quantity` | Updates quantity and normalized unit | *"Change milk to 3 litres"* |
| `mark_item_complete` | Marks an item as purchased / checked off | *"I got the bread"* |
| `unmark_item` | Restores an item to active status | *"I still need eggs"* |
| `clear_completed_items`| Purges all completed items | *"Clear checked items"* |
| `clear_all_items` | Resets the cart for a new session | *"Empty my shopping cart"* |
| `check_item_stock` | Queries catalog for availability & price | *"Is avocado in stock?"* |
| `search_catalog` | Multi-parameter search by query/price/category | *"Find snacks under $5"* |
| `get_suggestions` | Generates smart seasonal recommendations | *"What is in season this month?"* |
| `get_shopping_list` | Returns formatted item summary | *"What's in my cart right now?"* |
| `navigate_to_checkout` | Triggers UI tab switch to checkout view | *"Take me to checkout"* |
| `generate_bill` | Triggers client payment & auto-downloads PDF | *"Generate my bill and download it"* |

---

## 📡 WebSocket & API Specification

### WebSocket Events (`wss://voicecart-t5c9.onrender.com/ws`)

#### Client ➡️ Server
```json
{
  "type": "text_command",
  "text": "Add 3 avocados to my cart"
}
```

#### Server ➡️ Client
```json
{
  "type": "action",
  "tool": "add_item_to_db",
  "parameters": {
    "name": "Avocado",
    "category": "produce",
    "quantity": 3,
    "unit": "piece"
  },
  "result": {
    "success": true,
    "action": "added",
    "item": { "_id": "...", "name": "Avocado", "quantity": 3, "category": "produce" }
  }
}
```

---

## 📊 Database Schema (MongoDB Atlas)

### `ShoppingItem` Collection
```typescript
interface IShoppingItem {
  userId: string;        // Session identifier
  name: string;          // Normalized item name
  category: 'dairy' | 'produce' | 'meat' | 'bakery' | 'beverages' | 'snacks' | 'frozen' | 'household' | 'personal_care' | 'other';
  quantity: number;      // Parsed quantity (default: 1)
  unit: string;          // 'piece' | 'kg' | 'litre' | 'bottle' | 'pack' | 'dozen'
  isCompleted: boolean;  // Checkout/Purchased state
  notes: string;         // Optional notes
  createdAt: Date;
  updatedAt: Date;
}
```

### `ProductCatalog` Collection
```typescript
interface IProductCatalog {
  name: string;          // Catalog title
  brand: string;         // Brand name
  price: number;         // Unit price (USD)
  category: string;      // Category mapping
  inStock: boolean;      // Real-time stock status
  isSeasonal: boolean;   // Seasonal recommendation flag
  seasonMonths: number[];// Active seasonal months (1-12)
  substitutes: string[]; // Recommended alternative products
  tags: string[];        // Search keywords
}
```

---

## 🚀 Production Deployment

### 1. Live Environments
- **Frontend SPA**: [https://voicecart-app.netlify.app](https://voicecart-app.netlify.app)
- **Backend API & WS Gateway**: [https://voicecart-t5c9.onrender.com](https://voicecart-t5c9.onrender.com)
- **Cloud Database**: MongoDB Atlas (Cluster 0)

### 2. Environment Variables Configuration

#### Backend (`Render`):
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://aniketgarg915_db_user:3V8sKqtNRVBMpDMy@cluster0.cfuqqix.mongodb.net/voicecart?retryWrites=true&w=majority&appName=Cluster0
FRONTEND_URL=https://voicecart-app.netlify.app
TRANSCRIPTION_PROVIDER=groq
WHISPER_MODEL=whisper-large-v3-turbo
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=groq/compound-mini
```

#### Frontend (`Netlify`):
```env
VITE_WS_URL=wss://voicecart-t5c9.onrender.com/ws
```

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/Aniketgarg04/voicecart.git
cd voicecart

# 2. Setup & run Backend
cd backend
npm install
npm run seed     # Seeds 41 catalog products to MongoDB Atlas
npm run dev

# 3. Setup & run Frontend
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` to test the application locally.

---

## 🏆 Project Impact & Engineering Highlights

1. **Accessibility**: Provides complete hands-free commerce for users with disabilities or situational impairments.
2. **Ultra-Low Latency**: Sub-second end-to-end voice-to-action execution via Groq LPU inference.
3. **Resilient Architecture**: Zero single-point-of-failure fallback between regex intent parsing and cloud LLMs.
4. **Cloud-Native**: Fully automated CI/CD pipeline integrated across GitHub, Netlify, Render, and MongoDB Atlas.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <b>Developed by Aniket Garg</b><br />
  <i>VIT Chennai — Placement & Portfolio Project</i>
</div>
