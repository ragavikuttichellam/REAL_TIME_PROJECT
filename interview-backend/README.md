# Interview Session – Backend API

Node.js + Express + MongoDB backend for the Interview Session React app.

---

## 📁 Folder Structure

```
interview-backend/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js   # Register, login, profile
│   ├── questionController.js
│   └── sessionController.js
├── middleware/
│   └── auth.js             # JWT protect + adminOnly
├── models/
│   ├── User.js
│   ├── Question.js
│   └── Session.js
├── routes/
│   ├── auth.js
│   ├── questions.js
│   └── sessions.js
├── seed/
│   └── seedQuestions.js    # Seed all questions to MongoDB
├── .env.example
├── package.json
└── server.js
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
cd interview-backend
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Seed questions
```bash
npm run seed
```

### 4. Start server
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Server runs at `http://localhost:5000`

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get logged-in user | ✅ |

### Questions
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/questions` | Get random questions | ✅ |
| GET | `/api/questions/topics` | Get all topics | ✅ |
| POST | `/api/questions/check` | Check a single answer | ✅ |
| POST | `/api/questions` | Create question | 🔐 Admin |
| PUT | `/api/questions/:id` | Update question | 🔐 Admin |
| DELETE | `/api/questions/:id` | Deactivate question | 🔐 Admin |

**Query params for GET `/api/questions`:**
- `limit` – number of questions (default: 15)
- `topic` – filter by topic (JavaScript, React, etc.)
- `type` – Technical | HR | MCQ
- `difficulty` – Easy | Medium | Hard

### Sessions
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/sessions/start` | Start a new session | ✅ |
| POST | `/api/sessions/:id/submit` | Submit answers | ✅ |
| GET | `/api/sessions/history` | Past sessions | ✅ |
| GET | `/api/sessions/leaderboard` | Top 10 scores | ✅ |
| GET | `/api/sessions/:id` | Session detail | ✅ |

---

## 📦 Sample Requests

### Register
```json
POST /api/auth/register
{
  "name": "Sabari",
  "email": "sabari@example.com",
  "password": "123456"
}
```

### Start Session
```json
POST /api/sessions/start
Authorization: Bearer <token>
{
  "count": 15,
  "type": "Technical"
}
```

### Submit Session
```json
POST /api/sessions/:id/submit
Authorization: Bearer <token>
{
  "timeTaken": 320,
  "status": "completed",
  "answers": [
    { "questionId": "abc123", "selectedOption": "let" },
    { "questionId": "abc124", "selectedOption": null }
  ]
}
```

---

## 🔌 Connecting to React Frontend

In your React app, set the base URL:
```js
// src/api/axiosInstance.js
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```
