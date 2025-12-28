import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/submissions"),
      ]);
      setAssignments(assignmentsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId) => {
    return submissions.find((s) => s.assignment_id === assignmentId);
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      toast.error("Please enter your submission");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/submissions", {
        assignment_id: selectedAssignment.id,
        content: submissionContent,
        file_ids: [],
      });
      setSubmissions([...submissions, res.data]);
      setSelectedAssignment(null);
      setSubmissionContent("");
      toast.success("Assignment submitted!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAssignments = assignments.filter((a) => {
    const submission = getSubmission(a.id);
    return !submission && new Date(a.due_date) > new Date();
  });

  const submittedAssignments = assignments.filter((a) => getSubmission(a.id));

  const overdueAssignments = assignments.filter((a) => {
    const submission = getSubmission(a.id);
    return !submission && new Date(a.due_date) < new Date();
  });

  const filteredAssignments = (list) =>
    list.filter(
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
      <div className="space-y-6" data-testid="student-assignments">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            View and submit your assignments
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
                <p className="text-2xl font-bold">{pendingAssignments.length}</p>
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
                <p className="text-2xl font-bold">{submittedAssignments.length}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-white/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueAssignments.length}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </CardContent>
          </Card>
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

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="glass border-white/10 p-1">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20">
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="data-[state=active]:bg-primary/20">
              Submitted ({submittedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-primary/20">
              Overdue ({overdueAssignments.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-3">
            {filteredAssignments(pendingAssignments).length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                  <p className="text-muted-foreground">No pending assignments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments(pendingAssignments).map((assignment) => {
                const daysLeft = Math.ceil(
                  (new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 2;

                return (
                  <Card
                    key={assignment.id}
                    className={`glass border-white/10 card-interactive ${
                      isUrgent ? "border-destructive/30" : ""
                    }`}
                    data-testid={`assignment-card-${assignment.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isUrgent ? "bg-destructive/20" : "bg-primary/20"
                            }`}>
                              <FileText className={`w-5 h-5 ${isUrgent ? "text-destructive" : "text-primary"}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground ml-13 mt-2">
                            {assignment.description || "No description"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={isUrgent ? "destructive" : "outline"}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {daysLeft === 0 ? "Due Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days left`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {assignment.max_points} pts
                          </span>
                          <Button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="bg-primary hover:bg-primary/90"
                            data-testid={`submit-btn-${assignment.id}`}
                          >
                            Submit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Submitted Tab */}
          <TabsContent value="submitted" className="space-y-3">
            {filteredAssignments(submittedAssignments).length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No submitted assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments(submittedAssignments).map((assignment) => {
                const submission = getSubmission(assignment.id);
                const hasGrade = submission?.grade !== null;

                return (
                  <Card key={assignment.id} className="glass border-white/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {hasGrade ? (
                            <>
                              <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                                <Star className="w-3 h-3 mr-1" />
                                {submission.grade}/{assignment.max_points}
                              </Badge>
                              {submission.remarks && (
                                <p className="text-sm text-muted-foreground max-w-xs text-right">
                                  "{submission.remarks}"
                                </p>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Grade
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-3">
            {filteredAssignments(overdueAssignments).length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-secondary mb-4" />
                  <p className="text-muted-foreground">No overdue assignments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments(overdueAssignments).map((assignment) => (
                <Card key={assignment.id} className="glass border-white/10 border-destructive/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
                          </div>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        Overdue: {new Date(assignment.due_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Submit Dialog */}
        <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
          <DialogContent className="glass border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.title} - {selectedAssignment?.class_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="font-medium mb-2">Instructions</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedAssignment?.description || "No specific instructions provided."}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    Due: {selectedAssignment && new Date(selectedAssignment.due_date).toLocaleString()}
                  </Badge>
                  <span className="text-muted-foreground">
                    Max Points: {selectedAssignment?.max_points}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Submission</Label>
                <Textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Enter your answer or response here..."
                  className="bg-zinc-900/50 border-zinc-800 min-h-[200px]"
                  data-testid="submission-content-input"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="submit-assignment-btn"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
