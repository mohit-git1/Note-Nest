# Note Nest

A real-time AI meeting assistant that captures live transcription, generates intelligent suggestions, and extracts actionable tasks and goals directly from your conversations. Built for professionals who need a highly responsive, automated cognitive co-pilot.

## Live Demo

Experience the application live: [Note Nest on Vercel](https://note-nest-gilt.vercel.app/)

## Features

- **Live Transcription Pipeline:** High-performance audio ingestion and processing for seamless, real-time meeting transcription.
- **Context-Aware AI Suggestions:** Continuous background analysis of the conversation stream to generate talking points, fact-checks, and clarifications.
- **Automated Task Extraction:** Intelligent detection of commitments and goals from spoken dialogue, automatically organized into a structured To-Do list (Today/Later).
- **Secure Authentication:** Robust credential-based authentication with bcrypt hashing and JWT session management.
- **Zero-Knowledge API Key Storage:** User-provided AI provider keys (Groq) are AES-256 encrypted at rest in the database.
- **High-Fidelity UI/UX:** Responsive, edge-to-edge multi-panel layout engineered for maximum data density and minimal cognitive load.

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (Global state management)

### Backend
- Next.js Serverless API Routes
- NextAuth.js (Authentication & Session Management)

### Database
- MongoDB Atlas
- Mongoose ODM

### AI Integration
- Groq SDK (Llama 3.3 Versatile)
- Whisper API (Audio Transcription)

### Deployment
- Vercel (Edge network, Serverless functions)

## Architecture Overview

Note Nest utilizes a tightly coupled frontend and serverless backend architecture for low latency and high availability.

1. **Client Layer:** Next.js Server Components and Client Components manage the complex state of active meetings, buffering audio and transcript data via Zustand.
2. **API Layer:** Next.js API Routes handle secure transactions. The `detect-actions` route processes transcript chunks asynchronously to identify tasks without blocking the main rendering thread.
3. **Database Layer:** MongoDB Atlas stores persistent session histories, chat logs, user credentials, and encrypted AI keys.
4. **AI Processing:** The application delegates heavy LLM inference to the Groq API. API requests are authenticated using the individual user's decrypted key retrieved dynamically per request.

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- MongoDB Atlas cluster (or local MongoDB instance)
- Groq API Key (for testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Note-Nest.git
cd Note-Nest
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the root directory and populate it according to the Environment Variables section below.

4. Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Environment Variables

The following variables are required to run the application in a local or production environment.

```env
# Database
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority"

# Authentication
NEXTAUTH_URL="http://localhost:3000" # Update to production URL on Vercel
AUTH_SECRET="your-secure-random-32-byte-string" # Run `openssl rand -base64 32`

# Security
ENCRYPTION_KEY="your-secure-64-character-hex-string" # Must be exactly 64 characters (32 bytes hex encoded)
```

## Folder Structure

```
├── src/
│   ├── app/                 # Next.js App Router (Pages, API routes, Layouts)
│   │   ├── (auth)/          # Grouped authentication routes
│   │   ├── api/             # Serverless backend endpoints
│   │   ├── meeting/         # Core application workspace
│   │   ├── library/         # Historical session management
│   │   └── todos/           # Extracted task management
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks (e.g., useAudioRecorder)
│   ├── lib/                 # Utilities, MongoDB connection, AI prompts
│   ├── models/              # Mongoose data schemas
│   ├── store/               # Zustand state management
│   └── types/               # TypeScript interfaces and types
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind design tokens
└── package.json             # Project dependencies
```

## Deployment

This application is optimized for Vercel.

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the **Environment Variables** in the Vercel project settings. Ensure `NEXTAUTH_URL` is set to your final Vercel domain.
4. Deploy. Vercel will automatically configure the serverless functions for the API routes and build the static assets.

## Future Improvements

- **WebSockets Integration:** Transition from polling/chunked API calls to a persistent WebSocket connection for true bi-directional real-time transcription.
- **Calendar API Sync:** Automatic synchronization of detected tasks with Google Calendar or Outlook.
- **Multi-user Workspaces:** Support for team sessions with speaker diarization.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
