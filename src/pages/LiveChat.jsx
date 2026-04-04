import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  Send, Paperclip, Phone, Video, MoreVertical, Check, CheckCheck,
  MessageCircle, ArrowRight, User, Clock, Search
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

const easing = [0.22, 1, 0.36, 1];

const CONVERSATIONS = [
  { id: 1, name: "CA Ravi Kumar", role: "Senior CA", avatar: "RK", online: true, unread: 2,
    lastMessage: "I've reviewed your Form 16. Let's discuss the deductions.", lastTime: "2 min ago" },
  { id: 2, name: "CA Meena Patel", role: "GST Specialist", avatar: "MP", online: true, unread: 0,
    lastMessage: "Your GSTR-1 for December has been filed.", lastTime: "1 hour ago" },
  { id: 3, name: "CA Amit Sharma", role: "Audit Manager", avatar: "AS", online: false, unread: 0,
    lastMessage: "The audit report draft is ready for your review.", lastTime: "Yesterday" },
];

const INITIAL_MESSAGES = {
  1: [
    { id: 1, sender: "ca", text: "Good morning! I've started reviewing your documents for ITR filing.", time: "10:00 AM", read: true },
    { id: 2, sender: "ca", text: "I noticed your Form 16 shows ₹1.2L in Section 80C deductions. Do you have any additional investments to declare?", time: "10:05 AM", read: true },
    { id: 3, sender: "user", text: "Yes, I have NPS contributions of ₹50,000 under 80CCD(1B)", time: "10:15 AM", read: true },
    { id: 4, sender: "ca", text: "Great, that's an additional ₹50,000 deduction. I'll include that. Also, do you have any medical insurance premiums under 80D?", time: "10:18 AM", read: true },
    { id: 5, sender: "user", text: "I pay ₹25,000 annual premium for health insurance", time: "10:22 AM", read: true },
    { id: 6, sender: "ca", text: "Perfect. With all deductions, your estimated tax liability comes to approximately ₹42,000. I'll prepare the computation and share it with you by tomorrow.", time: "10:25 AM", read: true },
    { id: 7, sender: "ca", text: "I've reviewed your Form 16. Let's discuss the deductions available to optimize your return.", time: "11:30 AM", read: false },
    { id: 8, sender: "ca", text: "Can you also share last 3 months bank statements? I see some investments that might qualify for additional deductions.", time: "11:32 AM", read: false },
  ],
  2: [
    { id: 1, sender: "ca", text: "Hello! Your GSTR-1 for December 2025 has been successfully filed.", time: "Yesterday", read: true },
    { id: 2, sender: "user", text: "Thank you! What about GSTR-3B?", time: "Yesterday", read: true },
    { id: 3, sender: "ca", text: "GSTR-3B is due by January 20th. I'll file it by the 18th. Your ITC reconciliation is complete.", time: "Yesterday", read: true },
  ],
  3: [
    { id: 1, sender: "ca", text: "The statutory audit for FY 2024-25 is progressing well. Draft report will be ready by next week.", time: "2 days ago", read: true },
    { id: 2, sender: "user", text: "Great. Are there any observations I should be aware of?", time: "2 days ago", read: true },
    { id: 3, sender: "ca", text: "The audit report draft is ready for your review. I've sent it to your email. Please check the management representation letter as well.", time: "Yesterday", read: true },
  ],
};

export default function LiveChat() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(1);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="border-border/50 text-center max-w-md mx-auto p-10">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold text-lg mb-2">Sign in Required</h2>
            <p className="text-sm text-muted-foreground mb-6">Please sign in to message your CA.</p>
            <Button asChild className="rounded-xl gap-2">
              <Link to="/auth">Sign In <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const activeConversation = CONVERSATIONS.find(c => c.id === activeChat);
  const chatMessages = messages[activeChat] || [];

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      sender: "user",
      text: newMessage,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), msg] }));
    setNewMessage("");

    // Simulate CA reply after 2s
    setTimeout(() => {
      const replies = [
        "Thanks for that information. I'll update the records accordingly.",
        "Noted. I'll get back to you with the updated computation shortly.",
        "Sure, I'll take care of this. Is there anything else you need?",
        "Great, I'll process this right away. You'll receive a confirmation soon.",
      ];
      const reply = {
        id: Date.now() + 1,
        sender: "ca",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        read: false,
      };
      setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), reply] }));
    }, 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-6">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-soft" style={{ height: "calc(100vh - 140px)" }}>
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-80 border-r border-border/40 flex flex-col bg-secondary/20 hidden md:flex">
                <div className="p-4 border-b border-border/40">
                  <h2 className="font-semibold text-lg mb-3">Messages</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background text-sm" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {CONVERSATIONS.map(conv => (
                    <button key={conv.id} onClick={() => setActiveChat(conv.id)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/60 transition-colors text-left border-b border-border/20 ${
                        activeChat === conv.id ? "bg-secondary/80" : ""
                      }`}>
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {conv.avatar}
                        </div>
                        {conv.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{conv.name}</p>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{conv.lastTime}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{conv.role}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                        {activeConversation?.avatar}
                      </div>
                      {activeConversation?.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activeConversation?.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {activeConversation?.online ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</>
                        ) : (
                          <><Clock className="w-3 h-3" />Last seen recently</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full w-9 h-9"><Phone className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full w-9 h-9"><Video className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-full w-9 h-9"><MoreVertical className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-foreground text-background rounded-br-md"
                          : "bg-secondary rounded-bl-md"
                      }`}>
                        <p>{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.sender === "user" ? "justify-end" : ""}`}>
                          <span className={`text-[10px] ${msg.sender === "user" ? "opacity-60" : "text-muted-foreground"}`}>{msg.time}</span>
                          {msg.sender === "user" && (
                            msg.read ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessage()}
                      className="flex-1 rounded-xl h-10 bg-secondary/40"
                    />
                    <Button onClick={sendMessage} size="icon" className="rounded-full w-10 h-10 flex-shrink-0"
                      disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
