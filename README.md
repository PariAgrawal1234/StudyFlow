# StudyFlow 📚

A full-stack study tracking web application built with the MERN stack (MongoDB, Express, React, Node.js). Inspired by Athenify.io with a custom soothing slate-teal color palette.

## ✨ Features

- **📊 Dashboard** – Real-time overview with study time, streaks, medals, goal progress, and charts
- **⏱️ Timer** – Stopwatch and Pomodoro modes with course tagging
- **📚 Courses** – Manage study subjects with color tags, emojis, and progress tracking
- **🎯 Goals** – Set semester/custom study goals with pace analytics
- **📈 Statistics** – Weekly/daily charts, radar pattern analysis, course breakdown
- **🏅 Medals** – Bronze/Silver/Gold medals earned by daily study time
- **🎮 Activities** – Track non-study activities
- **⚙️ Settings** – Customizable medal thresholds and notification preferences

## 🖼️ Color Scheme

A soothing slate-teal palette:
- Background: Deep slate `#0f1623`
- Cards: `#1a2540`
- Primary accent: Sky blue `#5BA4CF`
- Secondary: Teal `#2DD4BF`
- Success: Emerald `#34D399`

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Styling | Custom CSS Variables |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/studyflow.git
cd studyflow

# Install all dependencies
npm run install-all

# Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

### Environment Variables

Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/studytracker
JWT_SECRET=your_super_secret_key_here
PORT=5000
NODE_ENV=development
```

### Running Locally

```bash
# Run both frontend and backend concurrently
npm run dev

# Or separately:
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

Visit `http://localhost:5173`

## 📦 Deployment

### Build for production
```bash
npm run build
```

### Deploy to Render (Recommended)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repo
4. Set build command: `npm run install-all && npm run build`
5. Set start command: `npm start`
6. Add environment variables:
   - `MONGODB_URI` – Your MongoDB Atlas connection string
   - `JWT_SECRET` – A strong random string
   - `NODE_ENV` – `production`

### Deploy to Railway

1. Connect GitHub repo on [railway.app](https://railway.app)
2. Add MongoDB plugin
3. Set the same env variables as above

## 📁 Project Structure

```
studyflow/
├── backend/
│   └── src/
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express API routes
│       ├── middleware/    # Auth middleware
│       └── server.js      # Entry point
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── context/       # React contexts (Auth, Timer)
│       ├── pages/         # Page components
│       ├── styles/        # Component CSS files
│       └── utils/         # Axios instance
└── package.json           # Root scripts
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/sessions` | Study sessions |
| GET | `/api/sessions/stats` | Aggregated stats |
| GET/POST | `/api/courses` | Courses CRUD |
| GET/POST | `/api/goals` | Goals CRUD |
| GET/POST | `/api/activities` | Activities CRUD |

## 📄 License

MIT
