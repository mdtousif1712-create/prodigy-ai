import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, Award, Star, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaderboardRes, classesRes] = await Promise.all([
        api.get(`/leaderboard${selectedClass !== "all" ? `?class_id=${selectedClass}` : ""}`),
        api.get("/classes"),
      ]);
      setLeaderboard(leaderboardRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "bg-yellow-500/20 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/20 border-gray-400/30";
    if (rank === 3) return "bg-amber-600/20 border-amber-600/30";
    return "bg-white/5";
  };

  const userRank = leaderboard.findIndex((l) => l.student_id === user?.id) + 1;

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
      <div className="space-y-6" data-testid="leaderboard-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">Top performing students</p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] bg-zinc-900/50 border-zinc-800" data-testid="leaderboard-class-select">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Your Rank */}
        {user?.role === "student" && userRank > 0 && (
          <Card className="glass border-white/10 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Star className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-3xl font-bold">#{userRank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-primary">
                    {leaderboard.find((l) => l.student_id === user?.id)?.average_score || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Second Place */}
            <Card className={`glass border ${getRankColor(2)} card-interactive mt-8`}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-400/20 flex items-center justify-center">
                  <Medal className="w-8 h-8 text-gray-400" />
                </div>
                <Avatar className="w-12 h-12 mx-auto mb-2">
                  <AvatarFallback className="bg-gray-400/20 text-gray-400">
                    {leaderboard[1]?.student_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold truncate">{leaderboard[1]?.student_name}</p>
                <p className="text-2xl font-bold text-gray-400">{leaderboard[1]?.average_score}%</p>
                <p className="text-xs text-muted-foreground">{leaderboard[1]?.assignments_completed} assignments</p>
              </CardContent>
            </Card>

            {/* First Place */}
            <Card className={`glass border ${getRankColor(1)} card-interactive`}>
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse-glow">
                  <Crown className="w-10 h-10 text-yellow-500" />
                </div>
                <Avatar className="w-14 h-14 mx-auto mb-2 border-2 border-yellow-500">
                  <AvatarFallback className="bg-yellow-500/20 text-yellow-500">
                    {leaderboard[0]?.student_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-lg">{leaderboard[0]?.student_name}</p>
                <p className="text-3xl font-bold text-yellow-500">{leaderboard[0]?.average_score}%</p>
                <p className="text-xs text-muted-foreground">{leaderboard[0]?.assignments_completed} assignments</p>
              </CardContent>
            </Card>

            {/* Third Place */}
            <Card className={`glass border ${getRankColor(3)} card-interactive mt-8`}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-600/20 flex items-center justify-center">
                  <Award className="w-8 h-8 text-amber-600" />
                </div>
                <Avatar className="w-12 h-12 mx-auto mb-2">
                  <AvatarFallback className="bg-amber-600/20 text-amber-600">
                    {leaderboard[2]?.student_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold truncate">{leaderboard[2]?.student_name}</p>
                <p className="text-2xl font-bold text-amber-600">{leaderboard[2]?.average_score}%</p>
                <p className="text-xs text-muted-foreground">{leaderboard[2]?.assignments_completed} assignments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>All ranked students</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No rankings available yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete assignments to appear on the leaderboard
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = entry.student_id === user?.id;
                  return (
                    <div
                      key={entry.student_id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-white/5 hover:bg-white/10"
                      }`}
                      data-testid={`leaderboard-rank-${rank}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${
                            rank <= 3 ? getRankColor(rank) : "bg-primary/20 text-primary"
                          }`}>
                            {entry.student_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {entry.student_name}
                            {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.assignments_completed} assignments completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          rank === 1 ? "text-yellow-500" :
                          rank === 2 ? "text-gray-400" :
                          rank === 3 ? "text-amber-600" : "text-primary"
                        }`}>
                          {entry.average_score}%
                        </p>
                        <p className="text-xs text-muted-foreground">Average</p>
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
