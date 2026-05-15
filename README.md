# Taskly – Full-Stack To-Do App

A full-stack To-Do application with a **Python FastAPI backend** and **React + TypeScript frontend**, styled with a beautiful **neumorphic UI**.

---

## 🗂 Project Structure

```
todo-app/
├── backend/
│   ├── main.py            # FastAPI app (auth + todos)
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.tsx
    │   ├── index.tsx
    │   ├── components/
    │   │   └── ProtectedRoute.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── DashboardPage.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── styles/
    │   │   └── global.css
    │   └── types/
    │       └── index.ts
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Backend (Python 3.8+)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.  
Swagger docs: **http://localhost:8000/docs**

### Frontend (Node 18+)

```bash
cd frontend
npm install
npm start
```

The app will open at **http://localhost:3000**.

---

## 🔑 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Create a new account |
| POST | `/login` | ❌ | Login and receive JWT |
| GET | `/protected` | ✅ Bearer | Verify token |
| GET | `/todos` | ✅ Bearer | List user's todos |
| POST | `/todos` | ✅ Bearer | Create a todo |
| PATCH | `/todos/{id}` | ✅ Bearer | Update a todo |
| DELETE | `/todos/{id}` | ✅ Bearer | Delete a todo |

---

## ✨ Features

- **JWT Authentication** — tokens stored in localStorage, included in all protected requests
- **CORS** — configured for `http://localhost:3000`
- **Logging** — all requests and errors logged to `app.log`
- **Protected Routes** — React Router guards redirect unauthenticated users
- **Full CRUD** — create, toggle, edit, delete todos
- **Progress Bar** — tracks completion percentage
- **Filters** — view All / Active / Done todos
- **Strict TypeScript** — no `any` types
- **Neumorphic UI** — soft shadows, pressed states, smooth interactions
- **Error handling** — 401 auto-logout, user-facing error messages
- **Loading states** — spinners on all async actions

---

## 🎨 Design

Built with a **neumorphism** aesthetic:
- Background: `#e0e5ec`
- Dual shadows: `#ffffff` (light) + `#a3b1c6` (dark)
- Accent: `#6c63ff`
- Fonts: Nunito (UI) + Space Mono (branding)
