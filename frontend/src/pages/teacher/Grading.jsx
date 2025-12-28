import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: "", remarks: "" });
  const [filter, setFilter] = useState("pending");
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [submissionsRes, assignmentsRes, classesRes] = await Promise.all([
        api.get("/submissions"),
        api.get("/assignments"),
        api.get("/classes"),
      ]);
      setSubmissions(submissionsRes.data);
      setAssignments(assignmentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!gradeForm.grade) {
      toast.error("Please enter a grade");
      return;
    }

    try {
      await api.put("/submissions/grade", {
        submission_id: selectedSubmission.id,
        grade: parseInt(gradeForm.grade),
        remarks: gradeForm.remarks,
      });

      setSubmissions(
        submissions.map((s) =>
          s.id === selectedSubmission.id
            ? { ...s, grade: parseInt(gradeForm.grade), remarks: gradeForm.remarks }
            : s
        )
      );

      setSelectedSubmission(null);
      setGradeForm({ grade: "", remarks: "" });
      toast.success("Grade submitted!");
    } catch (error) {
      toast.error("Failed to submit grade");
    }
  };

  const getAssignment = (assignmentId) => assignments.find((a) => a.id === assignmentId);

  const filteredSubmissions = submissions.filter((s) => {
    const assignment = getAssignment(s.assignment_id);
    
    // Filter by grading status
    if (filter === "pending" && s.grade !== null) return false;
    if (filter === "graded" && s.grade === null) return false;

    // Filter by class
    if (selectedClass !== "all" && assignment?.class_id !== selectedClass) return false;

    // Filter by search
    if (searchQuery && !s.student_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const pendingCount = submissions.filter((s) => s.grade === null).length;
  const gradedCount = submissions.filter((s) => s.grade !== null).length;

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
      <div className="space-y-6" data-testid="teacher-grading">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Grading</h1>
          <p className="text-muted-foreground mt-1">
            Review and grade student submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gradedCount}</p>
                <p className="text-sm text-muted-foreground">Graded</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{submissions.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800"
              data-testid="search-submissions-input"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] bg-zinc-900/50 border-zinc-800" data-testid="filter-class-select">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              className={filter === "pending" ? "bg-primary" : ""}
              data-testid="filter-pending-btn"
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === "graded" ? "default" : "outline"}
              onClick={() => setFilter("graded")}
              className={filter === "graded" ? "bg-secondary" : ""}
              data-testid="filter-graded-btn"
            >
              Graded ({gradedCount})
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              data-testid="filter-all-btn"
            >
              All
            </Button>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No submissions found</h3>
              <p className="text-muted-foreground text-center">
                {filter === "pending" ? "All caught up! No pending submissions." : "No submissions match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => {
              const assignment = getAssignment(submission.assignment_id);
              return (
                <Card key={submission.id} className="glass border-white/10 card-interactive" data-testid={`submission-card-${submission.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {submission.student_name?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{submission.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment?.title} • {assignment?.class_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {submission.grade !== null ? (
                          <div className="text-center">
                            <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30">
                              <Star className="w-3 h-3 mr-1" />
                              {submission.grade}/{assignment?.max_points || 100}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        <Button
                          variant={submission.grade !== null ? "outline" : "default"}
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGradeForm({
                              grade: submission.grade?.toString() || "",
                              remarks: submission.remarks || "",
                            });
                          }}
                          className={submission.grade === null ? "bg-primary hover:bg-primary/90" : ""}
                          data-testid={`grade-btn-${submission.id}`}
                        >
                          {submission.grade !== null ? "Edit Grade" : "Grade Now"}
                        </Button>
                      </div>
                    </div>

                    {/* Submission content preview */}
                    <div className="mt-4 p-3 rounded-lg bg-white/5">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.content || "No content submitted"}
                      </p>
                    </div>

                    {submission.remarks && (
                      <div className="mt-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                        <p className="text-sm">
                          <span className="font-medium text-secondary">Feedback:</span>{" "}
                          {submission.remarks}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Grade Dialog */}
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="glass border-white/10">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                {selectedSubmission?.student_name}'s submission for{" "}
                {getAssignment(selectedSubmission?.assignment_id)?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Submission content */}
              <div className="space-y-2">
                <Label>Submission Content</Label>
                <div className="p-4 rounded-lg bg-white/5 max-h-40 overflow-y-auto">
                  <p className="text-sm">{selectedSubmission?.content || "No content"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grade (out of {getAssignment(selectedSubmission?.assignment_id)?.max_points || 100})</Label>
                <Input
                  type="number"
                  min="0"
                  max={getAssignment(selectedSubmission?.assignment_id)?.max_points || 100}
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                  placeholder="Enter grade"
                  className="bg-zinc-900/50 border-zinc-800"
                  data-testid="grade-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Feedback (Optional)</Label>
                <Textarea
                  value={gradeForm.remarks}
                  onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
                  placeholder="Add feedback for the student..."
                  className="bg-zinc-900/50 border-zinc-800"
                  rows={3}
                  data-testid="feedback-input"
                />
              </div>

              <Button onClick={handleGrade} className="w-full bg-primary hover:bg-primary/90" data-testid="submit-grade-btn">
                Submit Grade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
