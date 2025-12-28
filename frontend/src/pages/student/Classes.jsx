import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  Users,
  ArrowRight,
  Search,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data);
    } catch (error) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error("Please enter a class code");
      return;
    }

    setJoining(true);
    try {
      const res = await api.post("/classes/join", { class_code: classCode.toUpperCase() });
      toast.success(`Joined ${res.data.class_name}!`);
      setDialogOpen(false);
      setClassCode("");
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join class");
    } finally {
      setJoining(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="space-y-6" data-testid="student-classes">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground mt-1">
              View and join your enrolled classes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 neon-glow" data-testid="join-class-btn">
                <Plus className="w-4 h-4 mr-2" />
                Join Class
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle>Join a Class</DialogTitle>
                <DialogDescription>
                  Enter the class code provided by your teacher
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinClass} className="space-y-4 mt-4">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="Enter class code (e.g., ABC12345)"
                    className="pl-10 bg-zinc-900/50 border-zinc-800 text-center text-lg font-mono tracking-wider"
                    maxLength={8}
                    data-testid="class-code-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={joining}
                  data-testid="join-class-submit-btn"
                >
                  {joining ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Join Class"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800"
            data-testid="search-classes-input"
          />
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <Card className="glass border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Join a class using the code from your teacher
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Join Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="glass border-white/10 card-interactive group" data-testid={`class-card-${cls.id}`}>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cls.subject}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {cls.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {cls.students?.length || 0} students
                    </Badge>
                    <Badge variant="outline" className="text-secondary border-secondary/30">
                      {cls.teacher_name}
                    </Badge>
                  </div>

                  <Link to={`/student/classes/${cls.id}`}>
                    <Button className="w-full bg-white/5 hover:bg-white/10 text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                      View Class
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
