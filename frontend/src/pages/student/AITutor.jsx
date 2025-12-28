import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sparkles,
  BookOpen,
  ListChecks,
  FileText,
  Copy,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentAITutor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [generatedContent, setGeneratedContent] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    loadHistory();
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

  const loadHistory = async () => {
    try {
      const res = await api.get("/ai/history");
      const history = res.data.slice(0, 10).reverse();
      const formattedHistory = [];
      history.forEach((h) => {
        formattedHistory.push({ role: "user", content: h.prompt });
        formattedHistory.push({ role: "assistant", content: h.response });
      });
      setMessages(formattedHistory);
    } catch (error) {
      console.error("Failed to load history");
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
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    setGeneratedContent("");

    try {
      let endpoint = "/ai/chat";
      if (type === "quiz") endpoint = "/ai/generate-quiz";
      else if (type === "flashcards") endpoint = "/ai/generate-flashcards";
      else if (type === "summarize") endpoint = "/ai/summarize";

      const res = await api.post(endpoint, {
        prompt: input,
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
    "Explain this concept in simple terms",
    "Give me a study plan for this topic",
    "What are the key points I should remember?",
    "Create practice problems for me",
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="student-ai-tutor">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">AI Tutor</h1>
            <p className="text-muted-foreground">
              Your personal AI learning assistant
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass border-white/10 p-1">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-primary/20">
              <ListChecks className="w-4 h-4 mr-2" />
              Quiz Me
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="data-[state=active]:bg-primary/20">
              <BookOpen className="w-4 h-4 mr-2" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="summarize" className="data-[state=active]:bg-primary/20">
              <FileText className="w-4 h-4 mr-2" />
              Summarize
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="glass border-white/10">
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Brain className="w-16 h-16 text-primary/50 mb-4 animate-float" />
                      <h3 className="text-lg font-semibold mb-2">Hi {user?.full_name?.split(" ")[0]}! 👋</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md">
                        I'm your AI tutor. Ask me anything about your studies - I can explain concepts, 
                        create quizzes, and help you understand difficult topics.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {quickPrompts.map((prompt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(prompt)}
                            className="text-xs"
                          >
                            {prompt}
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

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-secondary" />
                  Quiz Generator
                </CardTitle>
                <CardDescription>
                  Test your knowledge with AI-generated quizzes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter a topic (e.g., Photosynthesis, World War II)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800"
                  data-testid="quiz-topic-input"
                />
                {files.length > 0 && (
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Or select a document" />
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
                )}
                <Button
                  onClick={() => handleGenerate("quiz")}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-secondary/90"
                  data-testid="generate-quiz-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ListChecks className="w-4 h-4 mr-2" />
                  )}
                  Generate Quiz
                </Button>
              </CardContent>
            </Card>

            {generatedContent && activeTab === "quiz" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Quiz</CardTitle>
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

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Flashcard Generator
                </CardTitle>
                <CardDescription>
                  Create flashcards for effective studying
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter a topic..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800"
                  data-testid="flashcard-topic-input"
                />
                <Button
                  onClick={() => handleGenerate("flashcards")}
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  data-testid="generate-flashcards-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Generate Flashcards
                </Button>
              </CardContent>
            </Card>

            {generatedContent && activeTab === "flashcards" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Flashcards</CardTitle>
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

          {/* Summarize Tab */}
          <TabsContent value="summarize" className="space-y-4">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Document Summarizer
                </CardTitle>
                <CardDescription>
                  Get chapter-wise summaries of your study materials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {files.length > 0 ? (
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Select a document to summarize" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      {files.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents available. Upload PDFs to summarize them.
                  </p>
                )}
                <Input
                  placeholder="Optional: Specific focus (e.g., Chapter 3, Key concepts)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800"
                />
                <Button
                  onClick={() => handleGenerate("summarize")}
                  disabled={loading || !selectedFile}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="summarize-btn"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Summarize
                </Button>
              </CardContent>
            </Card>

            {generatedContent && activeTab === "summarize" && (
              <Card className="glass border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Summary</CardTitle>
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
