import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Trophy,
  Star,
  BookOpen,
  FileText,
  CheckCircle2,
  Target,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentProgress() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, submissionsRes, classesRes] = await Promise.all([
        api.get(`/analytics/student/${user.id}`),
        api.get("/submissions"),
        api.get("/classes"),
      ]);
      setAnalytics(analyticsRes.data);
      setSubmissions(submissionsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return "text-secondary";
    if (grade >= 70) return "text-primary";
    if (grade >= 50) return "text-accent";
    return "text-destructive";
  };

  const getGradeBadge = (grade) => {
    if (grade >= 90) return { label: "Excellent", color: "bg-secondary/20 text-secondary border-secondary/30" };
    if (grade >= 70) return { label: "Good", color: "bg-primary/20 text-primary border-primary/30" };
    if (grade >= 50) return { label: "Average", color: "bg-accent/20 text-accent border-accent/30" };
    return { label: "Needs Improvement", color: "bg-destructive/20 text-destructive border-destructive/30" };
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

  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const avgGrade = analytics?.average_grade || 0;

  return (
    <Layout>
      <div className="space-y-6" data-testid="student-progress">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Progress</h1>
          <p className="text-muted-foreground mt-1">
            Track your academic performance and achievements
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-secondary border-secondary/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="mt-4">
                <p className={`text-4xl font-bold ${getGradeColor(avgGrade)}`}>{avgGrade}%</p>
                <p className="text-sm text-muted-foreground mt-1">Average Grade</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-secondary" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">{analytics?.completed_assignments || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Completed Assignments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">{analytics?.total_classes || classes.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Enrolled Classes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">{gradedSubmissions.filter((s) => s.grade >= 90).length}</p>
                <p className="text-sm text-muted-foreground mt-1">A+ Grades</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your overall academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className={getGradeColor(avgGrade)}>{avgGrade}%</span>
                </div>
                <Progress value={avgGrade} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Top Performance</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.max(...gradedSubmissions.map((s) => s.grade || 0), 0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Highest grade achieved</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Submissions</span>
                  </div>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                  <p className="text-xs text-muted-foreground">Total submissions</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Graded</span>
                  </div>
                  <p className="text-2xl font-bold">{gradedSubmissions.length}</p>
                  <p className="text-xs text-muted-foreground">Assignments graded</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest graded assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {gradedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No graded assignments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gradedSubmissions.slice(0, 10).map((submission) => {
                  const badge = getGradeBadge(submission.grade);
                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          submission.grade >= 70 ? "bg-secondary/20" : "bg-accent/20"
                        }`}>
                          <span className={`text-lg font-bold ${getGradeColor(submission.grade)}`}>
                            {submission.grade}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Assignment Submission</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={badge.color}>{badge.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Performance breakdown by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No classes enrolled yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => {
                  // Calculate class-specific stats (simplified)
                  const progress = Math.floor(Math.random() * 40) + 60; // Placeholder
                  return (
                    <div key={cls.id} className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-sm text-muted-foreground">{cls.subject}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{cls.teacher_name}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span>{progress}%</span>
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
