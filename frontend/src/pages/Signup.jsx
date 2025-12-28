import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, Eye, EyeOff, ArrowRight, GraduationCap, BookOpen } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, full_name, role } = formData;

    if (!username || !email || !password || !full_name) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const user = await signup(formData);
      toast.success("Account created successfully!");
      navigate(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-primary/20" />
        
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-secondary/30 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6">
            Join the Future of <span className="gradient-text">Education</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you're a teacher looking to enhance your classroom or a student 
            eager to learn, PRODIGY AI has the tools you need.
          </p>

          <div className="space-y-4">
            {[
              { icon: Brain, title: "AI-Powered Learning", desc: "Personalized tutoring and smart content generation" },
              { icon: GraduationCap, title: "Track Progress", desc: "Monitor achievements and identify areas for improvement" },
              { icon: BookOpen, title: "Rich Content", desc: "Upload materials, create assignments, and more" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 glass rounded-xl p-4 card-interactive">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center neon-glow">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <span className="font-bold text-2xl tracking-tight gradient-text">
              PRODIGY AI
            </span>
          </div>

          <Card className="glass border-white/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: "student" })}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all text-left ${
                        formData.role === "student"
                          ? "border-primary bg-primary/10 neon-glow"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                      data-testid="role-student-btn"
                    >
                      <GraduationCap className={`w-5 h-5 ${formData.role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={formData.role === "student" ? "text-primary font-medium" : ""}>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: "teacher" })}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all text-left ${
                        formData.role === "teacher"
                          ? "border-secondary bg-secondary/10"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                      data-testid="role-teacher-btn"
                    >
                      <BookOpen className={`w-5 h-5 ${formData.role === "teacher" ? "text-secondary" : "text-muted-foreground"}`} />
                      <span className={formData.role === "teacher" ? "text-secondary font-medium" : ""}>Teacher</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="bg-zinc-900/50 border-zinc-800"
                    data-testid="signup-fullname-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-zinc-900/50 border-zinc-800"
                    data-testid="signup-username-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-zinc-900/50 border-zinc-800"
                    data-testid="signup-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-zinc-900/50 border-zinc-800 pr-10"
                      data-testid="signup-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full btn-shine ${
                    formData.role === "teacher" 
                      ? "bg-secondary hover:bg-secondary/90" 
                      : "bg-primary hover:bg-primary/90 neon-glow"
                  }`}
                  disabled={loading}
                  data-testid="signup-submit-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
