<<<<<<< HEAD
# HackOverflow
=======
# 🏙️ CivicAI — Multilingual Urban Grievance Intelligence Platform

> Multilingual civic complaint platform with AI classification, WhatsApp bot, and real-time admin dashboards.

---

## 📁 Project Structure

```
civicai/
├── backend/          # Node.js + Express API
├── ai-service/       # FastAPI AI classification service
└── frontend/         # React + Tailwind frontend
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### 2. AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
cp ../.env.example .env
# Add OPENAI_API_KEY to .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
# Create .env with VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🔑 Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT (min 32 chars) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` |
| `OPENAI_API_KEY` | OpenAI API key (for Whisper) |
| `FASTAPI_URL` | AI service URL (default: `http://localhost:8000`) |
| `BASE_URL` | Your frontend URL |
| `CLIENT_URL` | Frontend dev URL for CORS |

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_WHATSAPP_NUMBER=14155238886
```

---

## 📱 WhatsApp Setup (Twilio)

1. Go to [Twilio Console](https://twilio.com) → create account
2. Navigate to: **Messaging → Try it out → Send a WhatsApp message**
3. Note your sandbox number (e.g. `+14155238886`)
4. Save your `ACCOUNT_SID` and `AUTH_TOKEN`
5. Install [ngrok](https://ngrok.com): `ngrok http 5000`
6. Set webhook in Twilio: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
7. WhatsApp webhook method: **HTTP POST**
8. Test by sending "Hi" to the sandbox number on WhatsApp

---

## 🌱 Seed Super Admin

After backend is running:

```bash
curl -X POST http://localhost:5000/api/auth/admin/seed \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "CIVICAI_SEED_2024",
    "name": "Super Admin",
    "email": "admin@civicai.in",
    "password": "yourpassword"
  }'
```

Then log in at `/admin/login` and create state admins from the dashboard.

---

## 🛣️ API Routes

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | None | Send OTP to phone |
| POST | `/api/auth/verify-otp` | None | Verify OTP → JWT |
| GET | `/api/auth/me` | User JWT | Get current user |
| POST | `/api/auth/admin/login` | None | Admin login |

### Complaints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/complaints/file` | User JWT | File complaint (web) |
| GET | `/api/complaints/track/:id` | None | Public complaint tracker |
| GET | `/api/complaints/my` | User JWT | User's complaints |
| GET | `/api/complaints` | Admin JWT | List (filtered) |
| PATCH | `/api/complaints/:id/status` | Admin JWT | Update status |
| GET | `/api/complaints/map/data` | Admin JWT | Map heatmap data |

### Admin
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats/national` | Super Admin | National stats |
| GET | `/api/admin/stats/state/:state` | Admin JWT | State stats |
| GET | `/api/admin/leaderboard` | Super Admin | Municipality ranking |
| POST | `/api/admin/create` | Super Admin | Create admin |
| GET | `/api/admin/list` | Super Admin | List all admins |
| DELETE | `/api/admin/:id` | Super Admin | Delete admin |

### WhatsApp
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/whatsapp/webhook` | Twilio | Receive WA messages |

---

## 🎬 Demo Flow (2 Minutes)

1. Scan QR → WhatsApp bot opens with pre-filled "Hi CivicAI"
2. Bot sends language menu → user picks Hindi
3. User sends voice note complaint
4. Bot replies with tracking ID + link in ~5 seconds
5. Open `/track/CIV-XXXX` → see AI summary, severity, department
6. Switch to State Admin dashboard → complaint appears on map
7. Click district → see complaint card → update status to "In Progress"
8. User's WhatsApp gets instant notification
9. Super Admin dashboard shows updated national stats

---

## 🛠 Tech Stack

- **Frontend**: React 18, React Router, Leaflet.js, Tailwind CSS, Socket.io client
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io, Twilio, JWT
- **AI Service**: FastAPI, OpenAI GPT-4o (classification), Whisper API (transcription)
- **Infrastructure**: MongoDB Atlas, Render/Railway (backend), Vercel (frontend)
>>>>>>> 73686f6 (project)
