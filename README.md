# StudyFlow 📚

A full-stack study tracking web app for you and your friends — built with MERN (MongoDB, Express, React 18, Node.js). Inspired by Athenify.io with a soothing custom slate-teal palette.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Live stats, 7-day streak, goal progress, radar chart, activity heatmap |
| ⏱️ **Cinematic Timer** | Giant fullscreen clock, 7 accent colors, 4 background styles, pulsing colon |
| 👥 **Study Room** | See which friends are studying live, ranked leaderboard, real-time via Socket.io |
| 🤝 **Friends** | Search by name/email/@username, send/accept/decline requests |
| 📚 **Courses** | Track subjects with emoji, color, and hour goals |
| 🎯 **Goals** | Semester/custom goals with pace analytics (current vs required) |
| 📈 **Statistics** | Daily/weekly charts, radar pattern, doughnut course breakdown |
| 📋 **Sessions** | Full history with filters, manual entry, delete |
| 🏅 **Medals** | Bronze/Silver/Gold daily medals, 30-day history |
| 🎮 **Activities** | Track non-study habits |
| ⚙️ **Settings** | Username, medal thresholds, notification toggles |

---

## 🎨 Design

Soothing **slate-teal** palette — `#0f1623` base, `#5BA4CF` accent, `#34D399` success, `#2DD4BF` teal.  
Timer fullscreen backgrounds: Midnight Focus · Aurora · Deep Ocean · Forest.

---

## 🛠️ Stack

- **Frontend**: React 18 + Vite + Chart.js + react-router-dom v6
- **Backend**: Node.js + Express + Mongoose + Socket.io
- **Database**: MongoDB (local or Atlas)
- **Auth**: JWT (30-day tokens)
- **Real-time**: Socket.io (online presence + study events)

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally **or** a [MongoDB Atlas](https://cloud.mongodb.com) free cluster

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/studyflow.git
cd studyflow

# 2. Install all dependencies (root + backend + frontend)
npm run install-all

# 3. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI and JWT_SECRET

# 4. Run dev servers (both concurrently on ports 5000 + 5173)
npm run dev
```

Open **http://localhost:5173**

---

## 🌐 Deploy to Render (free tier, recommended)

### Step 1 – Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/studyflow.git
git push -u origin main
```

### Step 2 – MongoDB Atlas
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow from anywhere (`0.0.0.0/0`)
4. Connect → Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/studytracker`

### Step 3 – Render Web Service
1. [render.com](https://render.com) → New → Web Service → connect your GitHub repo
2. Settings:

| Field | Value |
|-------|-------|
| **Build Command** | `npm run install-all && npm run build` |
| **Start Command** | `npm start` |
| **Root Directory** | *(leave blank)* |

3. Environment Variables → Add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Render URL e.g. `https://studyflow.onrender.com` |

4. Deploy! First deploy takes ~3 mins.

> **Socket.io**: Works automatically on Render — no extra config needed since frontend + backend are on the same domain in production.

---

## 🚂 Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway add mongodb
railway up
```

Set the same env vars via the Railway dashboard.

---

## 📁 Structure

```
studyflow/
├── backend/
│   └── src/
│       ├── models/          # User, Course, Goal, StudySession, Activity
│       ├── routes/          # auth, sessions, courses, goals, activities, dashboard, friends
│       ├── middleware/       # JWT auth
│       └── server.js         # Express + Socket.io entry point
├── frontend/
│   └── src/
│       ├── components/       # Sidebar, Header, TimerModal, CalendarHeatmap, ProtectedRoute
│       ├── context/          # AuthContext, TimerContext, SocketContext
│       ├── pages/            # Dashboard, Timer, Friends, Sessions, Courses, Goals, Statistics, Activities, Leaderboard, Settings
│       ├── styles/           # Component CSS files
│       └── utils/            # Axios instance
└── package.json              # Root: install-all + dev + build + start
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✓ | Current user |
| PUT | `/api/auth/profile` | ✓ | Update name/username |
| PUT | `/api/auth/settings` | ✓ | Update settings |
| GET | `/api/dashboard` | ✓ | Full dashboard data |
| GET/POST | `/api/sessions` | ✓ | Sessions CRUD |
| GET | `/api/sessions/stats` | ✓ | Aggregated stats |
| GET/POST | `/api/courses` | ✓ | Courses CRUD |
| GET/POST | `/api/goals` | ✓ | Goals CRUD |
| GET | `/api/goals/active` | ✓ | Active goals with progress |
| GET/POST | `/api/activities` | ✓ | Activities CRUD |
| GET | `/api/friends` | ✓ | Friends with stats |
| GET | `/api/friends/requests` | ✓ | Pending requests |
| GET | `/api/friends/search?q=` | ✓ | Search users |
| POST | `/api/friends/request/:id` | ✓ | Send request |
| POST | `/api/friends/accept/:id` | ✓ | Accept request |
| POST | `/api/friends/decline/:id` | ✓ | Decline request |
| DELETE | `/api/friends/:id` | ✓ | Remove friend |

---

## ⚡ Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `timer_start` | Client → Server | `{ courseName }` |
| `timer_stop` | Client → Server | — |
| `friend_online` | Server → Client | `{ userId, name }` |
| `friend_offline` | Server → Client | `{ userId }` |
| `friend_studying` | Server → Client | `{ userId, name, courseName }` |
| `friend_stopped` | Server → Client | `{ userId }` |

---

## 📄 License

MIT — free to use, modify, and deploy.
