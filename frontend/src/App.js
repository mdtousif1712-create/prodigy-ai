import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import TeacherClasses from "@/pages/teacher/Classes";
import TeacherClassDetail from "@/pages/teacher/ClassDetail";
import TeacherAssignments from "@/pages/teacher/Assignments";
import TeacherGrading from "@/pages/teacher/Grading";
import TeacherAIAssistant from "@/pages/teacher/AIAssistant";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentClasses from "@/pages/student/Classes";
import StudentClassDetail from "@/pages/student/ClassDetail";
import StudentAssignments from "@/pages/student/Assignments";
import StudentAITutor from "@/pages/student/AITutor";
import StudentProgress from "@/pages/student/Progress";
import MyFiles from "@/pages/MyFiles";
import Chat from "@/pages/Chat";
import Calendar from "@/pages/Calendar";
import Leaderboard from "@/pages/Leaderboard";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Help from "@/pages/Help";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

export const API = `${BACKEND_URL}/api`;





// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// API instance with auth
export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (data) => {
    const res = await api.post("/auth/signup", data);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
    localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} />;
  }

  return children;
};

function App() {
  return (
    <div className="App noise-overlay">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>
            } />
            <Route path="/teacher/classes" element={
              <ProtectedRoute role="teacher"><TeacherClasses /></ProtectedRoute>
            } />
            <Route path="/teacher/classes/:classId" element={
              <ProtectedRoute role="teacher"><TeacherClassDetail /></ProtectedRoute>
            } />
            <Route path="/teacher/assignments" element={
              <ProtectedRoute role="teacher"><TeacherAssignments /></ProtectedRoute>
            } />
            <Route path="/teacher/grading" element={
              <ProtectedRoute role="teacher"><TeacherGrading /></ProtectedRoute>
            } />
            <Route path="/teacher/ai-assistant" element={
              <ProtectedRoute role="teacher"><TeacherAIAssistant /></ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/classes" element={
              <ProtectedRoute role="student"><StudentClasses /></ProtectedRoute>
            } />
            <Route path="/student/classes/:classId" element={
              <ProtectedRoute role="student"><StudentClassDetail /></ProtectedRoute>
            } />
            <Route path="/student/assignments" element={
              <ProtectedRoute role="student"><StudentAssignments /></ProtectedRoute>
            } />
            <Route path="/student/ai-tutor" element={
              <ProtectedRoute role="student"><StudentAITutor /></ProtectedRoute>
            } />
            <Route path="/student/progress" element={
              <ProtectedRoute role="student"><StudentProgress /></ProtectedRoute>
            } />
            
            {/* Common Routes */}
            <Route path="/files" element={
              <ProtectedRoute><MyFiles /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute><Calendar /></ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute><Leaderboard /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/help" element={<Help />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) return <Navigate to="/login" />;
  
  return <Navigate to={user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} />;
};

export default App;
