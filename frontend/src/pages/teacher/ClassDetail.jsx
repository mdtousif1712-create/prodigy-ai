import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Users,
  FileText,
  Bell,
  Plus,
  Copy,
  Upload,
  Trash2,
  Calendar,
  ExternalLink,
  Video,
  File,
  Image,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherClassDetail() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [videoDialog, setVideoDialog] = useState(false);

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    due_date: "",
    max_points: 100,
  });
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const [classRes, studentsRes, assignmentsRes, announcementsRes, filesRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/classes/${classId}/students`),
        api.get(`/assignments?class_id=${classId}`),
        api.get(`/announcements?class_id=${classId}`),
        api.get(`/files?class_id=${classId}`),
      ]);

      setClassData(classRes.data);
      setStudents(studentsRes.data);
      setAssignments(assignmentsRes.data);
      setAnnouncements(announcementsRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const copyClassCode = () => {
    navigator.clipboard.writeText(classData.class_code);
    toast.success("Class code copied!");
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await api.post("/announcements", {
        ...announcementForm,
        class_id: classId,
      });
      setAnnouncements([res.data, ...announcements]);
      setAnnouncementDialog(false);
      setAnnouncementForm({ title: "", content: "" });
      toast.success("Announcement posted!");
    } catch (error) {
      toast.error("Failed to post announcement");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.due_date) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const res = await api.post("/assignments", {
        ...assignmentForm,
        class_id: classId,
      });
      setAssignments([res.data, ...assignments]);
      setAssignmentDialog(false);
      setAssignmentForm({ title: "", description: "", due_date: "", max_points: 100 });
      toast.success("Assignment created!");
    } catch (error) {
      toast.error("Failed to create assignment");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("class_id", classId);

    try {
      const res = await api.post("/files/upload", formData);
      setFiles([res.data, ...files]);
      toast.success("File uploaded!");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await api.delete(`/classes/${classId}/students/${studentId}`);
      setStudents(students.filter((s) => s.id !== studentId));
      toast.success("Student removed");
    } catch (error) {
      toast.error("Failed to remove student");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return Image;
    if (fileType?.includes("video")) return Video;
    if (fileType?.includes("pdf")) return FileText;
    return File;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsRes498\?v=|\/watch\?.*v=))([^&\?\/]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
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

  if (!classData) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold">Class not found</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="class-detail">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{classData.name}</h1>
                <p className="text-muted-foreground">{classData.subject}</p>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">{classData.description}</p>
          </div>
          <Button variant="outline" onClick={copyClassCode} className="flex items-center gap-2" data-testid="copy-class-code-btn">
            <Copy className="w-4 h-4" />
            Code: {classData.class_code}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="glass border-white/10 p-1">
            <TabsTrigger value="materials" className="data-[state=active]:bg-primary/20">
              <FileText className="w-4 h-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-primary/20">
              <Users className="w-4 h-4 mr-2" />
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-primary/20">
              <Bell className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <div className="flex gap-3">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" />
                <Button asChild disabled={uploading}>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </span>
                </Button>
              </label>
              <Dialog open={videoDialog} onOpenChange={setVideoDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    Add Video Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10">
                  <DialogHeader>
                    <DialogTitle>Add YouTube Video</DialogTitle>
                    <DialogDescription>
                      Paste a YouTube URL to embed a video
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-800"
                    />
                    {videoUrl && getYouTubeEmbedUrl(videoUrl) && (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={getYouTubeEmbedUrl(videoUrl)}
                          className="w-full h-full"
                          allowFullScreen
                          title="Video preview"
                        />
                      </div>
                    )}
                    <Button className="w-full" onClick={() => {
                      if (videoUrl && getYouTubeEmbedUrl(videoUrl)) {
                        setFiles([{
                          id: Date.now().toString(),
                          filename: "YouTube Video",
                          file_type: "video/youtube",
                          video_url: videoUrl,
                        }, ...files]);
                        setVideoUrl("");
                        setVideoDialog(false);
                        toast.success("Video added!");
                      } else {
                        toast.error("Invalid YouTube URL");
                      }
                    }}>
                      Add Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {files.length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No materials uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.file_type);
                  return (
                    <Card key={file.id} className="glass border-white/10 card-interactive">
                      <CardContent className="p-4">
                        {file.file_type === "video/youtube" ? (
                          <div className="aspect-video rounded-lg overflow-hidden mb-3">
                            <iframe
                              src={getYouTubeEmbedUrl(file.video_url)}
                              className="w-full h-full"
                              allowFullScreen
                              title={file.filename}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                            <FileIcon className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <p className="font-medium truncate">{file.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : "Video"}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="create-assignment-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Create Assignment</DialogTitle>
                  <DialogDescription>
                    Add a new assignment for your students
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                      placeholder="Assignment title"
                      className="bg-zinc-900/50 border-zinc-800"
                      data-testid="assignment-title-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
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
                        value={assignmentForm.due_date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                        className="bg-zinc-900/50 border-zinc-800"
                        data-testid="assignment-due-date-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Points</Label>
                      <Input
                        type="number"
                        value={assignmentForm.max_points}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, max_points: parseInt(e.target.value) })}
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

            {assignments.length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="glass border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-muted-foreground">
                          Max Points: {assignment.max_points}
                        </span>
                        <Link to="/teacher/grading">
                          <Button variant="outline" size="sm">
                            View Submissions
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {students.length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students enrolled yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Share the class code: <span className="font-mono text-primary">{classData.class_code}</span>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <Card key={student.id} className="glass border-white/10">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {student.full_name?.charAt(0) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {student.full_name} from the class.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveStudent(student.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="create-announcement-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10">
                <DialogHeader>
                  <DialogTitle>Post Announcement</DialogTitle>
                  <DialogDescription>
                    Create an announcement for all students
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="Announcement title"
                      className="bg-zinc-900/50 border-zinc-800"
                      data-testid="announcement-title-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content *</Label>
                    <Textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      placeholder="Announcement content..."
                      className="bg-zinc-900/50 border-zinc-800"
                      rows={4}
                      data-testid="announcement-content-input"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" data-testid="create-announcement-submit-btn">
                    Post Announcement
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {announcements.length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No announcements yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="glass border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
