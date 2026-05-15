import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import bcrypt

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Muzukuru To-Do API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = "muzukuru-secret-key-change-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ── In-memory stores ──────────────────────────────────────────────────────────
# users: { username: { "password_hash": bytes, "email": str, "id": str } }
users_db: dict = {}
# todos: { user_id: [ { id, title, completed, created_at } ] }
todos_db: dict = {}

security = HTTPBearer()

# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None

# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(password.encode(), hashed)

def create_token(username: str, user_id: str) -> str:
    payload = {
        "sub": username,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if username is None or user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        logger.info(f"Authenticated user: {username}")
        return {"username": username, "user_id": user_id}
    except jwt.ExpiredSignatureError:
        logger.warning("Expired token attempt")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.warning("Invalid token attempt")
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Auth Routes ───────────────────────────────────────────────────────────────
@app.post("/register", status_code=201)
def register(body: RegisterRequest):
    logger.info(f"Register attempt for username: {body.username}")
    if body.username in users_db:
        logger.warning(f"Registration failed - username taken: {body.username}")
        raise HTTPException(status_code=409, detail="Username already exists")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user_id = str(uuid.uuid4())
    users_db[body.username] = {
        "id": user_id,
        "email": body.email,
        "password_hash": hash_password(body.password),
    }
    todos_db[user_id] = []
    logger.info(f"User registered successfully: {body.username}")
    return {"message": "User created successfully"}


@app.post("/login")
def login(body: LoginRequest):
    logger.info(f"Login attempt for username: {body.username}")
    user = users_db.get(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        logger.warning(f"Failed login for: {body.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(body.username, user["id"])
    logger.info(f"Login successful: {body.username}")
    return {"access_token": token, "token_type": "bearer", "username": body.username}


@app.get("/protected")
def protected(current_user: dict = Depends(get_current_user)):
    return {"message": "Access granted", "user": current_user["username"]}

# ── Todo Routes ───────────────────────────────────────────────────────────────
@app.get("/todos")
def get_todos(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    return todos_db.get(user_id, [])


@app.post("/todos", status_code=201)
def create_todo(body: TodoCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    todo = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "completed": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    todos_db[user_id].append(todo)
    logger.info(f"Todo created by {current_user['username']}: {body.title}")
    return todo


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: str, body: TodoUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user_todos = todos_db.get(user_id, [])
    for todo in user_todos:
        if todo["id"] == todo_id:
            if body.title is not None:
                todo["title"] = body.title
            if body.completed is not None:
                todo["completed"] = body.completed
            logger.info(f"Todo updated by {current_user['username']}: {todo_id}")
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")


@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user_todos = todos_db.get(user_id, [])
    original_len = len(user_todos)
    todos_db[user_id] = [t for t in user_todos if t["id"] != todo_id]
    if len(todos_db[user_id]) == original_len:
        raise HTTPException(status_code=404, detail="Todo not found")
    logger.info(f"Todo deleted by {current_user['username']}: {todo_id}")
