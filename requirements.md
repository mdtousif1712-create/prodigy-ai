# PRODIGY AI - E-Learning Platform

## Original Problem Statement
Build a complete e-learning platform called "PRODIGY AI" with:
- Separate user roles for Teachers and Students
- Secure username + password login (JWT)
- Persistent storage for all user actions, files, and classroom data
- AI-powered features using OpenAI GPT-5.1

## User Choices
- **AI Integration**: OpenAI GPT-5.1 via Emergent LLM Key
- **Email Notifications**: Skipped (in-app only)
- **Authentication**: JWT-based custom auth
- **Design**: Dark mode primary with light mode toggle
- **Video Storage**: YouTube URL embedding only

## Architecture Completed

### Backend (FastAPI + MongoDB)
- **Authentication**: JWT-based signup/login for teachers and students
- **Class Management**: Create, delete, join classes with unique codes
- **File System**: Upload PDFs, documents, images with folder organization
- **Assignments**: Create, submit, grade with due dates
- **Announcements**: Class-wise notifications
- **AI Integration**: 
  - Chat with context
  - Quiz generation
  - Flashcard generation
  - Document summarization
- **Analytics**: Student progress tracking, class analytics
- **Chat**: Direct messaging between users
- **Leaderboard**: Gamification with rankings

### Frontend (React + Tailwind + Shadcn)
- **Auth Pages**: Login, Signup with role selection
- **Teacher Portal**:
  - Dashboard with stats
  - Class management
  - Assignment creation & grading
  - AI Assistant for content generation
- **Student Portal**:
  - Dashboard with progress
  - Class enrollment
  - Assignment submission
  - AI Tutor for learning
- **Common Features**:
  - File management with folders
  - Chat/messaging
  - Calendar view
  - Leaderboard
  - Notifications
  - Settings

### Design System
- Dark theme primary (Cyber-Academia theme)
- Glassmorphism cards
- Neon glow effects
- Space Grotesk + Manrope fonts
- Purple/teal accent colors

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/classes/*` - Class management
- `/api/assignments/*` - Assignment CRUD
- `/api/submissions/*` - Submission handling
- `/api/announcements/*` - Announcements
- `/api/files/*` - File uploads
- `/api/folders/*` - Folder management
- `/api/chat/*` - Messaging
- `/api/notifications/*` - Notifications
- `/api/ai/*` - AI features
- `/api/analytics/*` - Progress analytics
- `/api/leaderboard` - Rankings
- `/api/calendar` - Calendar events
- `/api/search` - Search functionality

## Next Action Items

### Phase 2 Features
1. **Real-time Chat**: Add WebSocket support for live messaging
2. **Email Notifications**: Integrate SendGrid/Resend for alerts
3. **File Preview**: PDF viewer and image lightbox
4. **Video Embedding**: Enhanced YouTube player integration
5. **Quiz Interactivity**: Interactive quiz UI with score tracking
6. **Flashcard UI**: Flip-card study interface

### Enhancements
1. **Mobile App**: Consider React Native version
2. **Analytics Dashboard**: More detailed charts and metrics
3. **Bulk Operations**: Mass file upload, bulk grading
4. **Export Features**: PDF reports, grade exports
5. **Accessibility**: WCAG compliance improvements

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI, React Router
- **Backend**: FastAPI, Motor (MongoDB async), PyJWT, bcrypt
- **AI**: OpenAI GPT-5.1 via emergentintegrations
- **Database**: MongoDB
- **Styling**: Custom dark theme with CSS variables
