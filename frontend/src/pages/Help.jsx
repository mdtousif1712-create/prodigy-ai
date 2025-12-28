import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Brain, HelpCircle, BookOpen, ArrowLeft, MessageSquare, Shield, FileText } from "lucide-react";

export default function Help() {
  const faqs = [
    {
      question: "How do I join a class?",
      answer: "As a student, go to 'My Classes' and click 'Join Class'. Enter the class code provided by your teacher. The code is typically 8 characters long."
    },
    {
      question: "How do I create a class?",
      answer: "As a teacher, navigate to 'My Classes' and click 'Create Class'. Fill in the class name, subject, and description. A unique class code will be generated for students to join."
    },
    {
      question: "How does the AI Tutor work?",
      answer: "The AI Tutor uses advanced AI to help you learn. You can ask questions, request quizzes, generate flashcards, and get summaries of your study materials. Upload PDFs for context-aware assistance."
    },
    {
      question: "How do I submit an assignment?",
      answer: "Go to 'Assignments', find the assignment you want to submit, and click 'Submit'. Enter your response and click 'Submit Assignment'. You'll receive a confirmation once submitted."
    },
    {
      question: "How are grades calculated?",
      answer: "Teachers assign grades to individual assignments. Your overall average is calculated from all graded assignments. You can view your progress and grades in the 'Progress' section."
    },
    {
      question: "Can I upload files?",
      answer: "Yes! You can upload PDFs, documents, and images. Teachers can share materials with their classes, and students have personal file storage organized into folders."
    },
    {
      question: "How do I message my teacher?",
      answer: "Go to 'Messages' to view your conversations. You can start a new conversation by selecting a teacher or classmate from your class."
    },
    {
      question: "What file types are supported?",
      answer: "PRODIGY AI supports PDF, DOCX, PPT, JPG, PNG, and YouTube video links. Maximum file size depends on your plan."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl gradient-text">PRODIGY AI</span>
          </Link>
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12" data-testid="help-page">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of PRODIGY AI.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                Learn the basics of using PRODIGY AI
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-secondary" />
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help from our support team
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-white/10 card-interactive">
            <CardContent className="p-6 text-center">
              <Brain className="w-10 h-10 mx-auto mb-3 text-accent" />
              <h3 className="font-semibold mb-2">AI Features</h3>
              <p className="text-sm text-muted-foreground">
                Explore AI-powered learning tools
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="glass border-white/10 mb-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Terms & Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Terms of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                By using PRODIGY AI, you agree to our terms of service. These terms govern 
                your use of our platform and services.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Users must be 13 years or older</li>
                <li>• Content must comply with educational standards</li>
                <li>• Respect intellectual property rights</li>
                <li>• No harassment or inappropriate behavior</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                We take your privacy seriously. Here's how we handle your data:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Data is encrypted in transit and at rest</li>
                <li>• We never sell your personal information</li>
                <li>• You can request data deletion anytime</li>
                <li>• AI conversations are used to improve services</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2024 PRODIGY AI. All rights reserved.</p>
          <p className="mt-2">
            Need more help? Contact us at support@prodigyai.com
          </p>
        </div>
      </main>
    </div>
  );
}
