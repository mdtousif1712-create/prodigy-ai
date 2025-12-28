import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  FileText,
  Bell,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  Brain,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    recentAnnouncements: 0,
  });
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, assignmentsRes, submissionsRes, announcementsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/assignments"),
        api.get("/submissions"),
        api.get("/announcements"),
      ]);

      setClasses(classesRes.data);
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);

      const totalStudents = classesRes.data.reduce((acc, c) => acc + (c.students?.length || 0), 0);
      const pendingSubmissions = submissionsRes.data.filter((s) => s.grade === null).length;

      setStats({
        totalClasses: classesRes.data.length,
        totalStudents,
        pendingSubmissions,
        recentAnnouncements: announcementsRes.data.length,
      });
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <Card className="glass border-white/10 card-interactive" data-testid={`stat-card-${label.toLowerCase().replace(' ', '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl bg-${color}/20 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
          {trend && (
            <Badge variant="outline" className="text-secondary border-secondary/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8" data-testid="teacher-dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening in your classes today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/teacher/classes">
              <Button className="bg-primary hover:bg-primary/90 neon-glow" data-testid="create-class-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Total Classes" value={stats.totalClasses} color="primary" />
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents} trend="+12%" color="secondary" />
          <StatCard icon={FileText} label="Pending Grades" value={stats.pendingSubmissions} color="accent" />
          <StatCard icon={Bell} label="Announcements" value={stats.recentAnnouncements} color="primary" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes */}
          <Card className="lg:col-span-2 glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Classes</CardTitle>
                <CardDescription>Manage and view your classes</CardDescription>
              </div>
              <Link to="/teacher/classes">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No classes yet</p>
                  <Link to="/teacher/classes">
                    <Button className="mt-4" variant="outline">
                      Create your first class
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.slice(0, 4).map((cls) => (
                    <Link key={cls.id} to={`/teacher/classes/${cls.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{cls.name}</p>
                            <p className="text-sm text-muted-foreground">{cls.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            <Users className="w-3 h-3 mr-1" />
                            {cls.students?.length || 0}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/teacher/ai-assistant" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer">
                  <Brain className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Generate content with AI</p>
                  </div>
                </div>
              </Link>
              <Link to="/teacher/assignments" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <FileText className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="font-medium">Create Assignment</p>
                    <p className="text-xs text-muted-foreground">Add new assignment</p>
                  </div>
                </div>
              </Link>
              <Link to="/teacher/grading" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium">Grade Submissions</p>
                    <p className="text-xs text-muted-foreground">{stats.pendingSubmissions} pending</p>
                  </div>
                </div>
              </Link>
              <Link to="/calendar" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">View Calendar</p>
                    <p className="text-xs text-muted-foreground">Upcoming deadlines</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assignments */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>Track submission progress</CardDescription>
            </div>
            <Link to="/teacher/assignments">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assignments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.slice(0, 5).map((assignment) => {
                  const assignmentSubmissions = submissions.filter(
                    (s) => s.assignment_id === assignment.id
                  );
                  const classData = classes.find((c) => c.id === assignment.class_id);
                  const totalStudents = classData?.students?.length || 0;
                  const progress = totalStudents > 0 
                    ? Math.round((assignmentSubmissions.length / totalStudents) * 100) 
                    : 0;
                  
                  return (
                    <div key={assignment.id} className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Submissions</span>
                          <span>{assignmentSubmissions.length}/{totalStudents}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
