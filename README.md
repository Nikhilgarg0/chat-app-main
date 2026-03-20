# 💬 Secure Channels — Chat App

> A real-time, room-based encrypted chat application built for **Bidyut Innovations**, powered by Next.js, Firebase, Pusher, and MongoDB.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Key Components](#key-components)
- [Deployment](#deployment)

---

## Overview

**Secure Channels** is a full-stack real-time chat application that allows users to create or join private chat rooms using unique room codes. Users authenticate via Firebase and exchange messages that are persisted in MongoDB and broadcast in real time using Pusher.

---

## Features

- 🔐 **Firebase Authentication** — Email/password sign-up and login
- 🏠 **Room-Based Chat** — Create or join rooms with a 6-character alphanumeric code
- ⚡ **Real-Time Messaging** — Powered by Pusher for instant message delivery
- 💾 **Message Persistence** — Messages stored in MongoDB, with history loaded on room join (last 50 messages)
- 🔄 **Optimistic UI** — Messages appear instantly in the sender's UI before server confirmation
- 📋 **Room Code Sharing** — One-click copy of room code for easy sharing
- 🔁 **Session Persistence** — Room is preserved on page refresh via `sessionStorage`
- 📱 **Responsive Design** — Works on desktop and mobile with a premium dark UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS v4, shadcn/ui |
| Authentication | Firebase Auth |
| Real-Time | Pusher (server + client) |
| Database | MongoDB via Mongoose |
| Icons | Lucide React |
| Deployment | Node.js custom server (`server.js`) |

---

## Project Structure

```
chat-app/
├── app/
│   ├── api/
│   │   └── messages/
│   │       └── route.js        # REST API: GET & POST messages
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout
│   └── page.js                 # Main chat page (auth, home, chat screens)
├── src/
│   ├── components/
│   │   ├── MessageBubble.jsx   # Chat message UI component
│   │   └── ui/                 # shadcn/ui components (button, input, badge, etc.)
│   ├── hooks/
│   │   └── useSocket.js        # Pusher subscription + message sending hook
│   ├── lib/
│   │   ├── firebase.js         # Firebase app + Auth initialization
│   │   ├── mongodb.js          # MongoDB connection helper
│   │   ├── pusher.js           # Pusher server + client instances
│   │   ├── socket.js           # (Legacy) Socket.IO reference
│   │   └── utils.js            # Utility helpers
│   └── models/
│       └── Message.js          # Mongoose Message schema
├── server.js                   # Custom Node.js server with Socket.IO (legacy/reference)
├── next.config.ts              # Next.js config
├── package.json
└── tsconfig.json
```

---

## Architecture

```
User Browser
    │
    ├── Firebase Auth ──────────────────► Firebase (Google Cloud)
    │
    ├── Pusher Client (useSocket.js)
    │       │  subscribe to chat-{room}
    │       │  receive "new-message" events
    │       ▼
    │   Pusher Service ◄───────────────── API Route (POST /api/messages)
    │                                         │
    └── HTTP (fetch)                          ├── MongoDB (persist message)
            │                                 └── pusherServer.trigger(...)
            ▼
    Next.js API Routes
    /api/messages (GET | POST)
```

**Message Flow:**
1. User types a message and presses Enter or clicks Send.
2. Message is added to local state immediately (optimistic update).
3. A `POST /api/messages` request is sent with `{ room, author, content, time, msgId }`.
4. The API saves the message to MongoDB and calls `pusherServer.trigger()`.
5. All clients subscribed to `chat-{room}` receive the `new-message` event.
6. Duplicate messages are filtered using `msgId` to prevent double rendering.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A Firebase project with Email/Password auth enabled
- A Pusher account (Channels product)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd chat-app

# Install dependencies
npm install
```

### Run in Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Run with Custom Server (Socket.IO reference)

```bash
node server.js
```

> **Note:** The production real-time layer uses **Pusher**, not Socket.IO. `server.js` is retained as a reference implementation.

---

## Environment Variables

Create a `.env.local` file in the root of the project:

```env
# Firebase (Client-side — must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chatapp

# Pusher (Server-side)
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

---

## API Reference

### `GET /api/messages?room={roomId}`

Fetches the last 50 messages for a given room, sorted by creation time (ascending).

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "...",
      "room": "ABC123",
      "author": "john",
      "content": "Hello!",
      "time": "10:32 AM",
      "msgId": "abc123def456",
      "createdAt": "..."
    }
  ]
}
```

### `POST /api/messages`

Saves a new message to MongoDB and broadcasts it to all room subscribers via Pusher.

**Request Body:**
```json
{
  "room": "ABC123",
  "author": "john",
  "content": "Hello!",
  "time": "10:32 AM",
  "msgId": "abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "message": { ... }
}
```

---

## Key Components

### `page.js` — Main Page Controller

Manages three screens using a `screen` state variable:

| Screen | Description |
|---|---|
| `auth` | Email/password login and registration via Firebase |
| `home` | Dashboard to create a new room or join by code |
| `chat` | Active chat room with real-time messages |

### `useSocket.js` — Real-Time Hook

Handles all Pusher logic:
- Subscribes to `chat-{room}` channel on mount
- Loads message history via `GET /api/messages`
- Exposes `sendMessage(author, content)` which does an optimistic UI update and sends a `POST` request
- Deduplicates messages using `msgId`

### `MessageBubble.jsx` — Message Component

Renders a single message. Own messages appear on the right (blue), others on the left (slate grey).

### `Message.js` — Mongoose Schema

```js
{
  room: String,      // Room ID
  author: String,    // Username (derived from Firebase email)
  content: String,   // Message text
  time: String,      // Formatted display time (e.g. "10:32 AM")
  msgId: String,     // Client-generated unique ID for deduplication
  createdAt: Date,   // Auto-managed by Mongoose timestamps
  updatedAt: Date
}
```

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add all environment variables in the Vercel dashboard.
4. Deploy — Next.js API routes handle the backend automatically.

### Self-Hosted (Node.js)

```bash
npm run build
node server.js
```

Set `NODE_ENV=production` and configure a process manager like **PM2**:

```bash
pm2 start server.js --name chat-app
```

---

## License

Private — built for **Bidyut Innovations**. All rights reserved.
