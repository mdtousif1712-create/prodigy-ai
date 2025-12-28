import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Bell,
  Calendar,
  Video,
  File,
  Image,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentClassDetail() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const [classRes, assignmentsRes, announcementsRes, filesRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/assignments?class_id=${classId}`),
        api.get(`/announcements?class_id=${classId}`),
        api.get(`/files?class_id=${classId}`),
      ]);

      setClassData(classRes.data);
      setAssignments(assignmentsRes.data);
      setAnnouncements(announcementsRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("image")) return Image;
    if (fileType?.includes("video")) return Video;
    if (fileType?.includes("pdf")) return FileText;
    return File;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url?.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsRes498\?v=|\/watch\?.*v=))([^&\?\/]{11})/);
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
      <div className="space-y-6" data-testid="student-class-detail">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <p className="text-muted-foreground">{classData.subject}</p>
            <Badge variant="outline" className="mt-2">
              Teacher: {classData.teacher_name}
            </Badge>
          </div>
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
            <TabsTrigger value="announcements" className="data-[state=active]:bg-primary/20">
              <Bell className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
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
            {assignments.length === 0 ? (
              <Card className="glass border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const isOverdue = new Date(assignment.due_date) < new Date();
                  return (
                    <Card key={assignment.id} className="glass border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.description || "No description"}
                            </p>
                          </div>
                          <Badge variant={isOverdue ? "destructive" : "outline"} className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm text-muted-foreground">
                            Max Points: {assignment.max_points}
                          </span>
                          <Link to="/student/assignments">
                            <Button size="sm" className="bg-primary hover:bg-primary/90">
                              View & Submit
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
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
                      <p className="text-xs text-muted-foreground mt-3">
                        Posted by {announcement.author_name}
                      </p>
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
