from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
from PyPDF2 import PdfReader
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prodigy-ai-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# File upload settings
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="PRODIGY AI")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str  # "teacher" or "student"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    avatar: Optional[str] = None
    created_at: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None

class ClassCreate(BaseModel):
    name: str
    description: str
    subject: str

class ClassResponse(BaseModel):
    id: str
    name: str
    description: str
    subject: str
    class_code: str
    teacher_id: str
    teacher_name: str
    students: List[str] = []
    created_at: str

class JoinClass(BaseModel):
    class_code: str

class AnnouncementCreate(BaseModel):
    class_id: str
    title: str
    content: str

class AssignmentCreate(BaseModel):
    class_id: str
    title: str
    description: str
    due_date: str
    max_points: int = 100

class SubmissionCreate(BaseModel):
    assignment_id: str
    content: str
    file_ids: List[str] = []

class GradeSubmission(BaseModel):
    submission_id: str
    grade: int
    remarks: str

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None
    class_id: Optional[str] = None

class ChatMessage(BaseModel):
    receiver_id: str
    content: str
    class_id: Optional[str] = None

class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    file_id: Optional[str] = None

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    content: str
    type: str = "general"

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_class_code() -> str:
    return str(uuid.uuid4())[:8].upper()

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(user: UserCreate):
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "avatar": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_doc["id"], user_doc["role"])
    return {
        "token": token,
        "user": {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k != "password"}
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

@api_router.put("/auth/profile")
async def update_profile(update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated

# ==================== CLASS ROUTES ====================

@api_router.post("/classes")
async def create_class(class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create classes")
    
    class_doc = {
        "id": str(uuid.uuid4()),
        "name": class_data.name,
        "description": class_data.description,
        "subject": class_data.subject,
        "class_code": generate_class_code(),
        "teacher_id": current_user["id"],
        "teacher_name": current_user["full_name"],
        "students": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.classes.insert_one(class_doc)
    return {k: v for k, v in class_doc.items() if k != "_id"}

@api_router.get("/classes")
async def get_classes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "teacher":
        classes = await db.classes.find({"teacher_id": current_user["id"]}, {"_id": 0}).to_list(100)
    else:
        classes = await db.classes.find({"students": current_user["id"]}, {"_id": 0}).to_list(100)
    return classes

@api_router.get("/classes/{class_id}")
async def get_class(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_doc

@api_router.post("/classes/join")
async def join_class(data: JoinClass, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can join classes")
    
    class_doc = await db.classes.find_one({"class_code": data.class_code.upper()})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if current_user["id"] in class_doc.get("students", []):
        raise HTTPException(status_code=400, detail="Already enrolled in this class")
    
    await db.classes.update_one(
        {"id": class_doc["id"]},
        {"$addToSet": {"students": current_user["id"]}}
    )
    return {"message": "Successfully joined class", "class_name": class_doc["name"]}

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    if class_doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.classes.delete_one({"id": class_id})
    return {"message": "Class deleted"}

@api_router.get("/classes/{class_id}/students")
async def get_class_students(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await db.users.find(
        {"id": {"$in": class_doc.get("students", [])}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    return students

@api_router.delete("/classes/{class_id}/students/{student_id}")
async def remove_student(class_id: str, student_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id})
    if not class_doc or class_doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.classes.update_one({"id": class_id}, {"$pull": {"students": student_id}})
    return {"message": "Student removed"}

# ==================== ANNOUNCEMENT ROUTES ====================

@api_router.post("/announcements")
async def create_announcement(data: AnnouncementCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create announcements")
    
    class_doc = await db.classes.find_one({"id": data.class_id})
    if not class_doc or class_doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    announcement = {
        "id": str(uuid.uuid4()),
        "class_id": data.class_id,
        "class_name": class_doc["name"],
        "title": data.title,
        "content": data.content,
        "author_id": current_user["id"],
        "author_name": current_user["full_name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.announcements.insert_one(announcement)
    
    # Create notifications for students
    for student_id in class_doc.get("students", []):
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": f"New announcement in {class_doc['name']}",
            "content": data.title,
            "type": "announcement",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    return {k: v for k, v in announcement.items() if k != "_id"}

@api_router.get("/announcements")
async def get_announcements(class_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if class_id:
        query["class_id"] = class_id
    elif current_user["role"] == "student":
        # Get classes the student is enrolled in
        classes = await db.classes.find({"students": current_user["id"]}, {"id": 1}).to_list(100)
        class_ids = [c["id"] for c in classes]
        query["class_id"] = {"$in": class_ids}
    else:
        # Teacher sees their own class announcements
        classes = await db.classes.find({"teacher_id": current_user["id"]}, {"id": 1}).to_list(100)
        class_ids = [c["id"] for c in classes]
        query["class_id"] = {"$in": class_ids}
    
    announcements = await db.announcements.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return announcements

# ==================== ASSIGNMENT ROUTES ====================

@api_router.post("/assignments")
async def create_assignment(data: AssignmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    class_doc = await db.classes.find_one({"id": data.class_id})
    if not class_doc or class_doc["teacher_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assignment = {
        "id": str(uuid.uuid4()),
        "class_id": data.class_id,
        "class_name": class_doc["name"],
        "title": data.title,
        "description": data.description,
        "due_date": data.due_date,
        "max_points": data.max_points,
        "teacher_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.assignments.insert_one(assignment)
    
    # Notify students
    for student_id in class_doc.get("students", []):
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": f"New assignment in {class_doc['name']}",
            "content": data.title,
            "type": "assignment",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    return {k: v for k, v in assignment.items() if k != "_id"}

@api_router.get("/assignments")
async def get_assignments(class_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if class_id:
        query["class_id"] = class_id
    elif current_user["role"] == "student":
        classes = await db.classes.find({"students": current_user["id"]}, {"id": 1}).to_list(100)
        class_ids = [c["id"] for c in classes]
        query["class_id"] = {"$in": class_ids}
    else:
        classes = await db.classes.find({"teacher_id": current_user["id"]}, {"id": 1}).to_list(100)
        class_ids = [c["id"] for c in classes]
        query["class_id"] = {"$in": class_ids}
    
    assignments = await db.assignments.find(query, {"_id": 0}).sort("due_date", 1).to_list(100)
    return assignments

@api_router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: str, current_user: dict = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

# ==================== SUBMISSION ROUTES ====================

@api_router.post("/submissions")
async def create_submission(data: SubmissionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
    
    assignment = await db.assignments.find_one({"id": data.assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if already submitted
    existing = await db.submissions.find_one({
        "assignment_id": data.assignment_id,
        "student_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    
    submission = {
        "id": str(uuid.uuid4()),
        "assignment_id": data.assignment_id,
        "student_id": current_user["id"],
        "student_name": current_user["full_name"],
        "content": data.content,
        "file_ids": data.file_ids,
        "grade": None,
        "remarks": None,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission)
    return {k: v for k, v in submission.items() if k != "_id"}

@api_router.get("/submissions")
async def get_submissions(assignment_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if assignment_id:
        query["assignment_id"] = assignment_id
    
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    
    submissions = await db.submissions.find(query, {"_id": 0}).to_list(100)
    return submissions

@api_router.put("/submissions/grade")
async def grade_submission(data: GradeSubmission, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can grade")
    
    await db.submissions.update_one(
        {"id": data.submission_id},
        {"$set": {"grade": data.grade, "remarks": data.remarks}}
    )
    
    submission = await db.submissions.find_one({"id": data.submission_id}, {"_id": 0})
    
    # Notify student
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": submission["student_id"],
        "title": "Assignment graded",
        "content": f"You received {data.grade} points",
        "type": "grade",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return submission

# ==================== FILE ROUTES ====================

@api_router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    class_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"
    
    content = await file.read()
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Extract text if PDF
    text_content = None
    if file_ext.lower() == '.pdf':
        try:
            pdf_reader = PdfReader(io.BytesIO(content))
            text_content = " ".join([page.extract_text() or "" for page in pdf_reader.pages])
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
    
    file_doc = {
        "id": file_id,
        "filename": file.filename,
        "file_path": str(file_path),
        "file_type": file.content_type,
        "file_size": len(content),
        "folder_id": folder_id,
        "class_id": class_id,
        "owner_id": current_user["id"],
        "text_content": text_content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    return {k: v for k, v in file_doc.items() if k != "_id"}

@api_router.get("/files")
async def get_files(
    folder_id: Optional[str] = None,
    class_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if folder_id:
        query["folder_id"] = folder_id
    if class_id:
        query["class_id"] = class_id
    else:
        query["owner_id"] = current_user["id"]
    
    files = await db.files.find(query, {"_id": 0, "text_content": 0}).to_list(100)
    return files

@api_router.get("/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    return file_doc

@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file_doc = await db.files.find_one({"id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    if file_doc["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete physical file
    try:
        os.remove(file_doc["file_path"])
    except:
        pass
    
    await db.files.delete_one({"id": file_id})
    return {"message": "File deleted"}

# ==================== FOLDER ROUTES ====================

@api_router.post("/folders")
async def create_folder(data: FolderCreate, current_user: dict = Depends(get_current_user)):
    folder = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "parent_id": data.parent_id,
        "class_id": data.class_id,
        "owner_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.folders.insert_one(folder)
    return {k: v for k, v in folder.items() if k != "_id"}

@api_router.get("/folders")
async def get_folders(
    parent_id: Optional[str] = None,
    class_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if parent_id is not None:
        query["parent_id"] = parent_id if parent_id != "null" else None
    if class_id:
        query["class_id"] = class_id
    else:
        query["owner_id"] = current_user["id"]
    
    folders = await db.folders.find(query, {"_id": 0}).to_list(100)
    return folders

@api_router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    folder = await db.folders.find_one({"id": folder_id})
    if not folder or folder["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.folders.delete_one({"id": folder_id})
    await db.files.delete_many({"folder_id": folder_id})
    return {"message": "Folder deleted"}

# ==================== CHAT ROUTES ====================

@api_router.post("/chat/messages")
async def send_message(data: ChatMessage, current_user: dict = Depends(get_current_user)):
    message = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_name": current_user["full_name"],
        "receiver_id": data.receiver_id,
        "content": data.content,
        "class_id": data.class_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(message)
    return {k: v for k, v in message.items() if k != "_id"}

@api_router.get("/chat/messages")
async def get_messages(
    receiver_id: Optional[str] = None,
    class_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if class_id:
        # Class group chat
        messages = await db.chat_messages.find(
            {"class_id": class_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
    elif receiver_id:
        # Direct messages
        messages = await db.chat_messages.find({
            "$or": [
                {"sender_id": current_user["id"], "receiver_id": receiver_id},
                {"sender_id": receiver_id, "receiver_id": current_user["id"]}
            ]
        }, {"_id": 0}).sort("created_at", 1).to_list(100)
    else:
        messages = []
    
    return messages

@api_router.get("/chat/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get unique conversation partners
    pipeline = [
        {"$match": {"$or": [{"sender_id": current_user["id"]}, {"receiver_id": current_user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$sender_id", current_user["id"]]}, "$receiver_id", "$sender_id"]},
            "last_message": {"$first": "$content"},
            "last_time": {"$first": "$created_at"}
        }}
    ]
    results = await db.chat_messages.aggregate(pipeline).to_list(50)
    
    conversations = []
    for r in results:
        user = await db.users.find_one({"id": r["_id"]}, {"_id": 0, "password": 0})
        if user:
            conversations.append({
                "user": user,
                "last_message": r["last_message"],
                "last_time": r["last_time"]
            })
    
    return conversations

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

# ==================== AI ROUTES ====================
from groq import Groq

# Create Groq client (top of file — after imports)
groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])


@api_router.post("/ai/chat")
async def ai_chat(data: AIRequest, current_user: dict = Depends(get_current_user)):

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    # Build context if file text exists
    context = data.context or ""
    if data.file_id:
        file_doc = await db.files.find_one({"id": data.file_id})
        if file_doc and file_doc.get("text_content"):
            context += "\n\n" + file_doc["text_content"][:8000]

    # Create full user prompt
    prompt = f"""
You are PRODIGY AI — a helpful learning tutor.

User Role: {current_user['role']}
User Name: {current_user['full_name']}

Context (if any):
{context}

User Question:
{data.prompt}
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful tutor assistant."},
                {"role": "user", "content": prompt}
            ]
        )

        reply = completion.choices[0].message.content

        # Save AI chat history
        await db.ai_chats.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "prompt": data.prompt,
            "response": reply,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {"response": reply}

    except Exception as e:
        logger.error(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail="AI request failed")


@api_router.post("/ai/summarize")
async def summarize_content(data: AIRequest, current_user: dict = Depends(get_current_user)):
    return {"response": "Summarization will be enabled later 🚀"}


# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/student/{student_id}")
async def get_student_analytics(student_id: str, current_user: dict = Depends(get_current_user)):
    # Get student's submissions and grades
    submissions = await db.submissions.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    
    total_assignments = len(submissions)
    graded = [s for s in submissions if s.get("grade") is not None]
    total_points = sum(s["grade"] for s in graded)
    max_possible = len(graded) * 100
    
    # Get classes
    classes = await db.classes.find({"students": student_id}, {"_id": 0}).to_list(100)
    
    return {
        "total_assignments": total_assignments,
        "completed_assignments": len(graded),
        "average_grade": round(total_points / max_possible * 100, 1) if max_possible > 0 else 0,
        "total_classes": len(classes),
        "submissions": submissions[:10]
    }

@api_router.get("/analytics/class/{class_id}")
async def get_class_analytics(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get assignments for this class
    assignments = await db.assignments.find({"class_id": class_id}, {"_id": 0}).to_list(100)
    assignment_ids = [a["id"] for a in assignments]
    
    # Get all submissions
    submissions = await db.submissions.find({"assignment_id": {"$in": assignment_ids}}, {"_id": 0}).to_list(500)
    
    # Calculate stats per student
    student_stats = {}
    for s in submissions:
        if s["student_id"] not in student_stats:
            student_stats[s["student_id"]] = {"total": 0, "graded": 0, "points": 0}
        student_stats[s["student_id"]]["total"] += 1
        if s.get("grade") is not None:
            student_stats[s["student_id"]]["graded"] += 1
            student_stats[s["student_id"]]["points"] += s["grade"]
    
    return {
        "total_students": len(class_doc.get("students", [])),
        "total_assignments": len(assignments),
        "total_submissions": len(submissions),
        "student_stats": student_stats
    }

# ==================== LEADERBOARD ====================

@api_router.get("/leaderboard")
async def get_leaderboard(class_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    # Get all graded submissions
    query = {}
    if class_id:
        assignments = await db.assignments.find({"class_id": class_id}, {"id": 1}).to_list(100)
        assignment_ids = [a["id"] for a in assignments]
        query["assignment_id"] = {"$in": assignment_ids}
    
    submissions = await db.submissions.find(query, {"_id": 0}).to_list(500)
    
    # Aggregate by student
    student_scores = {}
    for s in submissions:
        if s.get("grade") is not None:
            if s["student_id"] not in student_scores:
                student_scores[s["student_id"]] = {"total": 0, "count": 0, "name": s["student_name"]}
            student_scores[s["student_id"]]["total"] += s["grade"]
            student_scores[s["student_id"]]["count"] += 1
    
    # Calculate averages and sort
    leaderboard = []
    for student_id, data in student_scores.items():
        avg = round(data["total"] / data["count"], 1) if data["count"] > 0 else 0
        leaderboard.append({
            "student_id": student_id,
            "student_name": data["name"],
            "average_score": avg,
            "assignments_completed": data["count"]
        })
    
    leaderboard.sort(key=lambda x: x["average_score"], reverse=True)
    return leaderboard[:20]

# ==================== CALENDAR ====================

@api_router.get("/calendar")
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    events = []
    
    if current_user["role"] == "student":
        classes = await db.classes.find({"students": current_user["id"]}, {"id": 1}).to_list(100)
    else:
        classes = await db.classes.find({"teacher_id": current_user["id"]}, {"id": 1}).to_list(100)
    
    class_ids = [c["id"] for c in classes]
    
    # Get assignments as events
    assignments = await db.assignments.find({"class_id": {"$in": class_ids}}, {"_id": 0}).to_list(100)
    for a in assignments:
        events.append({
            "id": a["id"],
            "title": a["title"],
            "date": a["due_date"],
            "type": "assignment",
            "class_name": a["class_name"]
        })
    
    return events

# ==================== SEARCH ====================

@api_router.get("/search")
async def search(q: str = Query(..., min_length=1), current_user: dict = Depends(get_current_user)):
    results = {
        "classes": [],
        "assignments": [],
        "files": [],
        "announcements": []
    }
    
    # Search classes
    if current_user["role"] == "teacher":
        classes = await db.classes.find({
            "teacher_id": current_user["id"],
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"subject": {"$regex": q, "$options": "i"}}
            ]
        }, {"_id": 0}).to_list(10)
    else:
        classes = await db.classes.find({
            "students": current_user["id"],
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"subject": {"$regex": q, "$options": "i"}}
            ]
        }, {"_id": 0}).to_list(10)
    results["classes"] = classes
    
    # Search assignments
    class_ids = [c["id"] for c in classes] if classes else []
    if class_ids:
        assignments = await db.assignments.find({
            "class_id": {"$in": class_ids},
            "title": {"$regex": q, "$options": "i"}
        }, {"_id": 0}).to_list(10)
        results["assignments"] = assignments
    
    # Search files
    files = await db.files.find({
        "owner_id": current_user["id"],
        "filename": {"$regex": q, "$options": "i"}
    }, {"_id": 0, "text_content": 0}).to_list(10)
    results["files"] = files
    
    return results

# Include router and setup CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
