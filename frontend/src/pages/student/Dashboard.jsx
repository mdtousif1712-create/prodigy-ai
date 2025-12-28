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
  FileText,
  Bell,
  ArrowRight,
  Brain,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, assignmentsRes, submissionsRes, announcementsRes, analyticsRes] = await Promise.all([
        api.get("/classes"),
        api.get("/assignments"),
        api.get("/submissions"),
        api.get("/announcements"),
        api.get(`/analytics/student/${user.id}`),
      ]);

      setClasses(classesRes.data);
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);
      setAnnouncements(announcementsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getPendingAssignments = () => {
    const submittedIds = new Set(submissions.map((s) => s.assignment_id));
    return assignments.filter((a) => !submittedIds.has(a.id) && new Date(a.due_date) > new Date());
  };

  const getUpcomingDeadlines = () => {
    const pending = getPendingAssignments();
    return pending.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);
  };

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
      <div className="space-y-8" data-testid="student-dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your learning progress for today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/student/ai-tutor">
              <Button className="bg-primary hover:bg-primary/90 neon-glow" data-testid="ai-tutor-btn">
                <Brain className="w-4 h-4 mr-2" />
                AI Tutor
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Enrolled Classes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                {getPendingAssignments().length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {getPendingAssignments().length}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{getPendingAssignments().length}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending Assignments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-secondary" />
                </div>
                <Badge variant="outline" className="text-secondary border-secondary/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Good
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.average_grade || 0}%</p>
                <p className="text-sm text-muted-foreground mt-1">Average Grade</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.completed_assignments || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Completed Assignments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Deadlines */}
          <Card className="lg:col-span-2 glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Assignments due soon</CardDescription>
              </div>
              <Link to="/student/assignments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {getUpcomingDeadlines().length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-secondary mb-4" />
                  <p className="text-muted-foreground">All caught up! No pending assignments.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUpcomingDeadlines().map((assignment) => {
                    const dueDate = new Date(assignment.due_date);
                    const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 2;

                    return (
                      <Link key={assignment.id} to="/student/assignments">
                        <div className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                          isUrgent ? "bg-destructive/10 border border-destructive/30" : "bg-white/5 hover:bg-white/10"
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isUrgent ? "bg-destructive/20" : "bg-primary/20"
                            }`}>
                              <FileText className={`w-5 h-5 ${isUrgent ? "text-destructive" : "text-primary"}`} />
                            </div>
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                            </div>
                          </div>
                          <Badge variant={isUrgent ? "destructive" : "outline"}>
                            {daysLeft === 0 ? "Due Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
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
              <Link to="/student/ai-tutor" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer">
                  <Brain className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">AI Tutor</p>
                    <p className="text-xs text-muted-foreground">Get help with any topic</p>
                  </div>
                </div>
              </Link>
              <Link to="/student/classes" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="font-medium">Join Class</p>
                    <p className="text-xs text-muted-foreground">Enter class code</p>
                  </div>
                </div>
              </Link>
              <Link to="/calendar" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium">Calendar</p>
                    <p className="text-xs text-muted-foreground">View all deadlines</p>
                  </div>
                </div>
              </Link>
              <Link to="/leaderboard" className="block">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Leaderboard</p>
                    <p className="text-xs text-muted-foreground">See your ranking</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Announcements */}
        <Card className="glass border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Updates from your teachers</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">{announcement.class_name}</Badge>
                        <h4 className="font-medium">{announcement.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
