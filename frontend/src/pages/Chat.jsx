import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { api, useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classes, setClasses] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchData = async () => {
    try {
      const [conversationsRes, classesRes] = await Promise.all([
        api.get("/chat/conversations"),
        api.get("/classes"),
      ]);
      setConversations(conversationsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/messages?receiver_id=${selectedUser.id}`);
      setMessages(res.data);
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;

    const newMessage = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.full_name,
      receiver_id: selectedUser.id,
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInput("");

    try {
      await api.post("/chat/messages", {
        receiver_id: selectedUser.id,
        content: input,
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="space-y-6" data-testid="chat-page">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with teachers and classmates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800"
                  data-testid="search-conversations-input"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user?.id}
                        onClick={() => setSelectedUser(conv.user)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          selectedUser?.id === conv.user?.id
                            ? "bg-primary/20 border border-primary/30"
                            : "hover:bg-white/5"
                        }`}
                        data-testid={`conversation-${conv.user?.id}`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {conv.user?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.user?.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {conv.user?.role}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {/* Class members to start new chat */}
                <div className="p-4 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Class Members
                  </h4>
                  <div className="space-y-2">
                    {classes.slice(0, 3).map((cls) => (
                      <div key={cls.id} className="text-xs text-muted-foreground">
                        {cls.name}: {cls.students?.length || 0} members
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 glass border-white/10 flex flex-col">
            {selectedUser ? (
              <>
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {selectedUser.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedUser.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{selectedUser.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender_id === user.id
                                ? "bg-primary/20"
                                : "bg-white/5"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        className="bg-zinc-900/50 border-zinc-800"
                        data-testid="chat-input"
                      />
                      <Button onClick={handleSend} className="bg-primary hover:bg-primary/90" data-testid="send-message-btn">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Choose a conversation from the list to start chatting
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
