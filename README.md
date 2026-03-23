# Nexus Collaboration Platform

Nexus is a real-time, end-to-end simulated enterprise chat application engineered for high-performance team communication. It features full authentication, dynamic workspace and channel architectures, and an integrated advanced AI assistant natively embedded within the communication channels.

## 🌟 Key Features

- **Dynamic Workspaces & Channels**: Deploy scalable workspaces instantly and construct infinitely nested communication threads seamlessly.
- **Real-Time Communication**: Leveraging Pusher WebSockets to guarantee instant messaging deliveries without refreshing.
- **Nexus AI Agent**: A built-in Assistant powered natively by the Gemini 2.0 Flash engine. Invoke analytical queries securely by typing `/ask`, `/summarize`, or `/todo` right inside any channel.
- **Robust Security**: Utilizes Firebase Authentication combined natively with MongoDB. All profile mapping, token validation, and API routes are strictly modeled and typed.
- **Sleek UI/UX Architecture**: Crafted extensively with Shadcn UI, Tailwind CSS native glassmorphism tokens, and responsive mobile-first methodologies.

## 🚀 Setup Guide

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/nexus-chat.git
   cd nexus-chat
   npm install
   ```

2. **Configure Environment Variables**
   Rename `.env.local.example` to `.env.local` and substitute your actual credential keys:
   - `MONGODB_URI` - MongoDB Atlas Connect String
   - `NEXT_PUBLIC_FIREBASE...` - Your Firebase Client configurations
   - `GEMINI_API_KEY` - Google API Gemini Key for the Nexus AI core
   - `PUSHER...` - Pusher API App Keys for WebSockets

3. **Launch the Engine**
   ```bash
   npm run dev
   ```
   Server initializes at [http://localhost:3000](http://localhost:3000).

---
*Built with Next.js 15, Tailwind CSS, MongoDB, Firebase, and Pusher.*
