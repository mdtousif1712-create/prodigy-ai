import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    class_id: "",
    title: "",
    description: "",
    due_date: "",
    max_points: 100,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, classesRes, submissionsRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/classes"),
        api.get("/submissions"),
      ]);
      setAssignments(assignmentsRes.data);
      setClasses(classesRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.class_id || !formData.title || !formData.due_date) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const res = await api.post("/assignments", formData);
      setAssignments([res.data, ...assignments]);
      setDialogOpen(false);
      setFormData({ class_id: "", title: "", description: "", due_date: "", max_points: 100 });
      toast.success("Assignment created!");
    } catch (error) {
      toast.error("Failed to create assignment");
    }
  };

  const getSubmissionStats = (assignmentId) => {
    const assignmentSubmissions = submissions.filter((s) => s.assignment_id === assignmentId);
    const graded = assignmentSubmissions.filter((s) => s.grade !== null);
    const assignment = assignments.find((a) => a.id === assignmentId);
    const classData = classes.find((c) => c.id === assignment?.class_id);
    const totalStudents = classData?.students?.length || 0;

    return {
      submitted: assignmentSubmissions.length,
      graded: graded.length,
      total: totalStudents,
      progress: totalStudents > 0 ? Math.round((assignmentSubmissions.length / totalStudents) * 100) : 0,
    };
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  const filteredAssignments = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="space-y-6" data-testid="teacher-assignments">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage assignments across all classes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 neon-glow" data-testid="create-assignment-dialog-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for one of your classes
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800" data-testid="assignment-class-select">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Assignment title"
                    className="bg-zinc-900/50 border-zinc-800"
                    data-testid="assignment-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Assignment instructions..."
                    className="bg-zinc-900/50 border-zinc-800"
                    rows={3}
                    data-testid="assignment-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="bg-zinc-900/50 border-zinc-800"
                      data-testid="assignment-due-date-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Points</Label>
                    <Input
                      type="number"
                      value={formData.max_points}
                      onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })}
                      className="bg-zinc-900/50 border-zinc-800"
                      data-testid="assignment-max-points-input"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" data-testid="create-assignment-submit-btn">
                  Create Assignment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800"
            data-testid="search-assignments-input"
          />
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first assignment to get started
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const stats = getSubmissionStats(assignment.id);
              const overdue = isOverdue(assignment.due_date);

              return (
                <Card key={assignment.id} className="glass border-white/10 card-interactive" data-testid={`assignment-card-${assignment.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground ml-13 mt-2">
                          {assignment.description || "No description"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={overdue ? "destructive" : "outline"}
                          className="flex items-center gap-1"
                        >
                          {overdue ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Max: {assignment.max_points} pts
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Submissions
                            </span>
                            <span>{stats.submitted}/{stats.total} students</span>
                          </div>
                          <Progress value={stats.progress} className="h-2" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-secondary">{stats.graded}</p>
                            <p className="text-xs text-muted-foreground">Graded</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-accent">{stats.submitted - stats.graded}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                          <Link to="/teacher/grading">
                            <Button variant="outline" size="sm">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Grade
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
