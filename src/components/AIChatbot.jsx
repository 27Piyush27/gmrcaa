import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";






const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ca-chatbot`;
const SUPABASE_CLIENT_KEY =
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const QUICK_OPTIONS = [
"I need help filing my Income Tax Return",
"I want to register for GST",
"I'm starting a new company",
"What services do you offer?"];


export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Create conversation for logged-in users
  const ensureConversation = useCallback(async () => {
    if (!user || conversationId) return conversationId;
    const { data } = await supabase.
    from("chat_conversations").
    insert({ user_id: user.id, title: "AI Assistant Chat" }).
    select("id").
    single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  }, [user, conversationId]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let convId = conversationId;
    if (user) {
      convId = await ensureConversation();
    }

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_CLIENT_KEY}`
        },
        body: JSON.stringify({
          messages: updatedMessages,
          conversationId: convId
        })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsertAssistant = (content) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant message for logged-in users
      if (user && convId && assistantContent) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantContent
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      const fallback =
      /rate limit|429/i.test(errorMsg) ?
      "I’m getting high traffic right now. For starting a new company, I can help with incorporation and compliance. Recommended: [SERVICE:company-law] and [SERVICE:tax]. Tell me whether you want Pvt Ltd, LLP, or OPC." :
      `Sorry, ${errorMsg}. Please try again.`;
      setMessages((prev) => [
      ...prev,
      { role: "assistant", content: fallback }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  // Parse service links from assistant messages
  const renderContent = (content) => {
    const serviceRegex = /\[SERVICE:([\w-]+)\]/g;
    const parts = content.split(serviceRegex);

    if (parts.length === 1) {
      return (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>
          }}>
          
          {content}
        </ReactMarkdown>);

    }

    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <Button
            key={i}
            size="sm"
            variant="accent"
            className="my-1 text-xs"
            onClick={() => navigate(`/services/${part}`)}>
            
            View Service <ArrowRight className="ml-1 h-3 w-3" />
          </Button>);

      }
      return part ?
      <ReactMarkdown
        key={i}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>
        }}>
        
          {part}
        </ReactMarkdown> :
      null;
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-hero transition-all duration-300 hover:scale-110",
          "bg-primary text-primary-foreground",
          !isOpen && "animate-[pulse-ring_2s_ease-in-out_infinite]",
          isOpen && "rotate-90"
        )}
        aria-label="Open AI Assistant">
        
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {isOpen &&
      <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col rounded-3xl border border-border/50 glass-frosted shadow-hero overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-sm text-foreground">
                GMR AI Assistant
              </h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Messages */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ?
          <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  👋 Hello! I'm your CA assistant. How can I help you today?
                </p>
                <div className="grid gap-2">
                  {QUICK_OPTIONS.map((opt) =>
              <button
                key={opt}
                onClick={() => sendMessage(opt)}
                className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary hover:border-foreground/20 hover:scale-[1.02] transition-all duration-200 text-foreground">
                
                      {opt}
                    </button>
              )}
                </div>
              </div> :

          <div className="space-y-3">
                {messages.map((msg, i) =>
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}>
              
                    <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  msg.role === "user" ?
                  "bg-primary text-primary-foreground rounded-br-md" :
                  "bg-secondary text-secondary-foreground rounded-bl-md"
                )}>
                
                      {msg.role === "assistant" ?
                renderContent(msg.content) :
                msg.content}
                    </div>
                  </div>
            )}
                {isLoading && messages[messages.length - 1]?.role !== "assistant" &&
            <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
            }
              </div>
          }
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2">
            
              <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our CA services..."
              className="text-sm h-9"
              disabled={isLoading} />
            
              <Button
              type="submit"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isLoading || !input.trim()}>
              
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {!user &&
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
                <button onClick={() => navigate("/auth")} className="underline hover:text-foreground">
                  Sign in
                </button>{" "}
                to save chat history
              </p>
          }
          </div>
        </div>
      }
    </>);

}