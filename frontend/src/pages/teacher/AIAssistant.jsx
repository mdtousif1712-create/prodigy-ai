import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Send,
  FileText,
  Sparkles,
  BookOpen,
  ListChecks,
  Lightbulb,
  Copy,
  RefreshCw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherAIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [generationType, setGenerationType] = useState("chat");
  const [generatedContent, setGeneratedContent] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchFiles = async () => {
    try {
      const res = await api.get("/files");
      setFiles(res.data.filter((f) => f.file_type?.includes("pdf") || f.text_content));
    } catch (error) {
      console.error("Failed to fetch files");
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        prompt: input,
        file_id: selectedFile || null,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (error) {
      toast.error("Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    if (!input.trim()) {
      toast.error("Please enter a topic or description");
      return;
    }

    setLoading(true);
    setGeneratedContent("");

    try {
      let endpoint = "/ai/chat";
      let prompt = input;

      if (type === "assignment") {
        prompt = `Generate a detailed assignment about: ${input}. Include objectives, instructions, submission guidelines, and grading criteria.`;
      } else if (type === "mcq") {
        endpoint = "/ai/generate-quiz";
      } else if (type === "remediation") {
        prompt = `A student is struggling with: ${input}. Suggest remediation strategies, practice exercises, and resources to help them improve.`;
      }

      const res = await api.post(endpoint, {
        prompt: prompt,
        file_id: selectedFile || null,
      });

      setGeneratedContent(res.data.response);
      toast.success("Content generated!");
    } catch (error) {
      toast.error("Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const quickPrompts = [
    "Create a lesson plan for teaching fractions to 5th graders",
    "Generate 10 multiple choice questions about photosynthesis",
    "Suggest activities for teaching creative writing",
    "Create a rubric for evaluating essays",
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="teacher-ai-assistant">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">AI Assistant</h1>
            <p className="text-muted-foreground">
              Your intelligent teaching companion powered by AI
            </p>
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-6" onValueChange={setGenerationType}>
          <TabsList className="glass border-white/10 p-1">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="assignment" className="data-[state=active]:bg-primary/20">
              <FileText className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="mcq" className="data-[state=active]:bg-primary/20">
              <ListChecks className="w-4 h-4 mr-2" />
              MCQ Generator
            </TabsTrigger>
            <TabsTrigger value="remediation" className="data-[state=active]:bg-primary/20">
              <Lightbulb className="w-4 h-4 mr-2" />
              Remediation
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="glass border-white/10">
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Brain className="w-16 h-16 text-primary/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md">
                        Ask me anything about teaching, curriculum design, or get help with content creation.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickPrompts.slice(0, 2).map((prompt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(prompt)}
                            className="text-xs"
                          >
                            {prompt.slice(0, 40)}...
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-2xl ${
                              msg.role === "user"
                                ? "bg-primary/20 text-foreground"
                                : "bg-white/5 text-foreground"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.role === "assistant" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-6 text-xs"
                                onClick={() => copyToClipboard(msg.content)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 p-4 rounded-2xl">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t border-white/10">
                  {files.length > 0 && (
                    <div className="mb-3">
                      <Select value={selectedFile} onValueChange={setSelectedFile}>
                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                          <SelectValue placeholder="Optional: Select a document for context" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="">No document</SelectItem>
                          {files.map((file) => (
                            <SelectItem key={file.id} value={file.id}>
                              {file.filename}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="bg-zinc-900/50 border-zinc-800"
                      disabled={loading}
                      data-testid="ai-chat-input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={loading || !input.trim()}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="ai-send-btn"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignment Generator */}
          <TabsContent value="assignment" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Assignment Generator
                </CardTitle>
                <CardDescription>
                  Generate detailed assignments with objectives and grading criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic or Description</Label>
                  <Textarea
                    placeholder="e.g., Write an essay about climate change and its effects on biodiversity..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800"
                    rows={3}
                    data-testid="assignment-topic-input"
                  />
                </div>
                <Button
                  onClick={() => handleGenerate("assignment")}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="generate-assignment-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Assignment
                </Button>
              </CardContent>
            </Card>

            {generatedContent && generationType === "assignment" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Generated Assignment</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-white/5 whitespace-pre-wrap text-sm">
                    {generatedContent}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MCQ Generator */}
          <TabsContent value="mcq" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-secondary" />
                  MCQ Generator
                </CardTitle>
                <CardDescription>
                  Generate multiple choice questions with answers and explanations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Textarea
                    placeholder="e.g., The French Revolution, Photosynthesis, Linear Algebra..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800"
                    rows={3}
                    data-testid="mcq-topic-input"
                  />
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Or select a document</Label>
                    <Select value={selectedFile} onValueChange={setSelectedFile}>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="">No document</SelectItem>
                        {files.map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button
                  onClick={() => handleGenerate("mcq")}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-secondary/90"
                  data-testid="generate-mcq-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ListChecks className="w-4 h-4 mr-2" />
                  )}
                  Generate MCQs
                </Button>
              </CardContent>
            </Card>

            {generatedContent && generationType === "mcq" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Generated Questions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-white/5 whitespace-pre-wrap text-sm">
                    {generatedContent}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Remediation Tab */}
          <TabsContent value="remediation" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  Remediation Suggestions
                </CardTitle>
                <CardDescription>
                  Get personalized strategies to help struggling students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Describe the learning challenge</Label>
                  <Textarea
                    placeholder="e.g., Student struggles with basic multiplication tables, has difficulty with reading comprehension..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800"
                    rows={3}
                    data-testid="remediation-input"
                  />
                </div>
                <Button
                  onClick={() => handleGenerate("remediation")}
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  data-testid="generate-remediation-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4 mr-2" />
                  )}
                  Get Suggestions
                </Button>
              </CardContent>
            </Card>

            {generatedContent && generationType === "remediation" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Remediation Strategies</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedContent)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-white/5 whitespace-pre-wrap text-sm">
                    {generatedContent}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
