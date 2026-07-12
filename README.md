# SymptomCare AI - Medical Symptom Assistant

SymptomCare AI is a full-stack, AI-powered medical symptom checking application. It features a responsive, premium healthcare-themed glassmorphic UI, a conversational symptom analysis chatbot, user profiles, diagnostic summaries, and a secure authentication panel.

---

## 📁 Folder Structure

```
med chatbot/
├── backend/
│   ├── src/
│   │   ├── config/db.ts          # Database config with local JSON-file fallback
│   │   ├── controllers/
│   │   │   ├── authController.ts # Sign up, sign in, email verify, password reset
│   │   │   └── chatController.ts # Message handler, session manager, AI query trigger
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts # JWT verify middleware
│   │   ├── models/
│   │   │   ├── User.ts           # Unified Mongoose / FileDB User schema
│   │   │   └── ChatSession.ts    # Unified Mongoose / FileDB ChatSession schema
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── chatRoutes.ts
│   │   ├── services/
│   │   │   ├── aiService.ts      # Gemini AI / OpenAI / Rule-based offline mock AI
│   │   │   └── mailService.ts    # NodeMailer / Developer terminal console logs
│   │   └── server.ts             # Express core server entry
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthPage.tsx       # Landing page (Sign In, Sign Up, Forgot, Reset)
│   │   │   ├── Dashboard.tsx      # Daily tips, categories, recent checks
│   │   │   ├── ChatInterface.tsx  # ChatGPT-like symptom chatbot with dictation
│   │   │   ├── Profile.tsx        # Profile account info
│   │   │   ├── EmergencySection.tsx # Emergency contacts & first-aid guidelines
│   │   │   ├── Navbar.tsx         # Header, theme toggle
│   │   │   ├── Sidebar.tsx        # Responsive left navigation panel
│   │   │   └── ProtectedRoute.tsx # Route guard
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Session management & token handlers
│   │   ├── services/
│   │   │   └── api.ts             # Axios interceptor wrapper
│   │   ├── index.css              # Custom styling & Tailwind CSS v4 imports
│   │   ├── App.tsx                # Client router
│   │   └── main.tsx               # DOM mount point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env
└── README.md                      # Documentation
```

---

## 🔒 Authentication Flow

1. **User Sign Up**: 
   - User inputs name, email, and password (validated for length and digit strength).
   - Backend hashes the password with `bcryptjs` and generates an email verification token.
   - Saves user profile with status `isVerified: false`.
2. **Email Verification**:
   - The verification link is sent via NodeMailer (or printed in the backend terminal console for immediate local dev testing).
   - Clicking the verification token route redirects the client to call `/api/auth/verify-email?token=...`, updating the user status to `isVerified: true`.
3. **User Sign In**:
   - User submits email and password.
   - Backend compares password hashes. If verified, signs a JWT (valid for 7 days).
   - If "Remember Me" is checked, client stores token in `localStorage`. If unchecked, stores token in `sessionStorage` (cleared on tab close).
4. **Google Sign In (Mock Integration)**:
   - On clicking Google Login, the client sends profile details. 
   - Backend validates the identity, creates a verified account if first time, or retrieves the user profile, returning the token immediately.

---

## 🩺 AI & Database Fallback Mechanisms

To ensure **zero-friction local execution**, SymptomCare AI has built-in offline developer fallbacks:
- **Database Fallback:** If local MongoDB is not running or no `MONGODB_URI` is supplied in `backend/.env`, the system automatically mounts a lightweight, thread-safe JSON-file database engine (`/backend/data/db.json`). Sign ups, email verification flags, passwords, and chat history logs will persist perfectly between server reboots.
- **AI Service Fallback:** The backend will check for `GEMINI_API_KEY`, followed by `OPENAI_API_KEY`. If neither is configured, the bot falls back to an offline rule-based symptom analyzer that evaluates common clinical keyword patterns (e.g., *fever*, *headache*, *cough*, *chest pain*, *stomach*) to maintain full conversation capability.

---

## 🚀 Local Installation & Setup

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 2. Install Dependencies
Open a terminal in the root workspace folder:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environments
Create copies of the env templates:
- **Backend:** Copy `backend/.env.example` to `backend/.env`.
- **Frontend:** Copy `frontend/.env.example` to `frontend/.env`.

Update the AI API keys inside `backend/.env` if you want to use real Gemini/OpenAI models. Leaving them blank enables mock simulation mode immediately.

### 4. Run Dev Servers
Start the backend first:
```bash
# In backend directory
npm run dev
```
In another terminal, start the frontend:
```bash
# In frontend directory
npm run dev
```

The client will be running at [http://localhost:5180](http://localhost:5180) and the API server at [http://localhost:5080](http://localhost:5080).

---

## 🌐 Production Deployment Steps

### Frontend Build
Compile static React files:
```bash
cd frontend
npm run build
```
This outputs a optimized bundle to `frontend/dist` which can be deployed to static CDNs such as **Vercel**, **Netlify**, or **AWS S3**.

### Backend Build & Run
Compile TypeScript backend files:
```bash
cd backend
npm run build
npm start
```
Deploy the Node server to platform host services like **Render**, **Railway**, **Heroku**, or inside a Docker container on AWS ECS / DigitalOcean Droplets.
