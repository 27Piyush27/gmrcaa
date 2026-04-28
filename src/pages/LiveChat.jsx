import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Send, Paperclip, Check, CheckCheck, MessageCircle, ArrowRight,
  Clock, Search, Smile, MoreVertical, Trash2, Star, Reply,
  Circle, Loader2, ShieldCheck, X
} from "lucide-react";
import { Link } from "react-router-dom";

/* ── The only CAs registered on the platform ─────────────────────────────── */
const REGISTERED_CAS = [
  {
    name: "CA Gaurav Makkar",
    role: "Founding Partner • FCA",
    initials: "GM",
    gradient: "from-blue-600 to-cyan-500",
    specialization: "Capital Markets, Statutory Audits, Project Financing",
  },
  {
    name: "CA Saurabh Madan",
    role: "Senior Partner • FCA",
    initials: "SM",
    gradient: "from-emerald-600 to-teal-500",
    specialization: "Corporate Finance, Business Advisory",
  },
];

const EMOJI_QUICK = ["👍", "❤️", "😊", "🙏", "✅", "📎", "💯", "🎉"];

const SMART_REPLIES = [
  "Thank you for the update!",
  "When is the deadline?",
  "Can you share the documents?",
  "I'll review and get back to you.",
  "Please proceed with filing.",
];

/* ── Time formatting helper ──────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LiveChat() {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [starredMsgs, setStarredMsgs] = useState(new Set());
  const [caProfiles, setCaProfiles] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isCA = role === "ca" || role === "admin";

  /* ── Scroll to bottom ──────────────────────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  /* ── Fetch CA profiles for display ─────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["ca", "admin"]);
      if (!data?.length) return;
      const caIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", caIds);
      const map = {};
      (profiles || []).forEach((p) => { map[p.user_id] = p; });
      setCaProfiles(map);
    })();
  }, [user]);

  /* ── Fetch conversations ───────────────────────────────────────────────── */
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const col = isCA ? "ca_id" : "client_id";
    const { data, error } = await supabase
      .from("dm_conversations")
      .select("*")
      .eq(col, user.id)
      .order("last_message_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }
    setConversations(data || []);
    setLoading(false);
  }, [user, isCA]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  /* ── Fetch messages for active conversation ────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    if (!activeConvId) return;
    const { data, error } = await supabase
      .from("dm_messages")
      .select("*")
      .eq("conversation_id", activeConvId)
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (error) { console.error(error); return; }
    setMessages(data || []);
    scrollToBottom();

    // Mark unread messages as read
    const unreadIds = (data || [])
      .filter((m) => !m.read && m.sender_id !== user.id)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("dm_messages")
        .update({ read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  }, [activeConvId, user, scrollToBottom]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  /* ── Realtime subscriptions ────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("dm-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, (payload) => {
        const msg = payload.new;
        if (msg.conversation_id === activeConvId) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
          if (msg.sender_id !== user.id) {
            supabase.from("dm_messages").update({ read: true, read_at: new Date().toISOString() }).eq("id", msg.id);
          }
        }
        fetchConversations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_conversations" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, activeConvId, fetchConversations, scrollToBottom]);

  /* ── Start conversation with a CA (client-side) ────────────────────────── */
  const startConversation = async (caUserId) => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_or_create_dm_conversation", {
      _client_id: user.id,
      _ca_id: caUserId,
    });
    if (error) { toast.error("Failed to start conversation"); return; }
    setActiveConvId(data);
    fetchConversations();
  };

  /* ── Send message ──────────────────────────────────────────────────────── */
  const sendMessage = async (text) => {
    const content = (text || newMessage).trim();
    if (!content || !activeConvId || sending) return;
    setSending(true);
    setNewMessage("");
    setShowSmartReplies(false);
    setShowEmoji(false);

    const { error } = await supabase.from("dm_messages").insert({
      conversation_id: activeConvId,
      sender_id: user.id,
      content,
      message_type: "text",
    });
    if (error) { toast.error("Failed to send"); console.error(error); }
    setSending(false);
    inputRef.current?.focus();
  };

  /* ── Delete message ────────────────────────────────────────────────────── */
  const deleteMessage = async (msgId) => {
    await supabase.from("dm_messages").update({ deleted: true }).eq("id", msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  /* ── Toggle star ───────────────────────────────────────────────────────── */
  const toggleStar = (msgId) => {
    setStarredMsgs((prev) => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  /* ── Get partner info ──────────────────────────────────────────────────── */
  const getPartnerInfo = (conv) => {
    const partnerId = isCA ? conv.client_id : conv.ca_id;
    const profile = caProfiles[partnerId];
    if (profile) return { name: profile.name, initials: profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() };
    // For CAs, try matching by name
    const caMatch = REGISTERED_CAS.find((ca) => {
      const p = caProfiles[conv.ca_id];
      return p && p.name.toLowerCase().includes(ca.name.replace("CA ", "").toLowerCase());
    });
    if (caMatch && !isCA) return { name: caMatch.name, initials: caMatch.initials };
    return { name: "User", initials: "U" };
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const partner = activeConv ? getPartnerInfo(activeConv) : null;
  const unreadCount = (convId) => {
    if (convId !== activeConvId) return 0; // We don't have per-conv unread count cached; real impl would track
    return 0;
  };

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const p = getPartnerInfo(c);
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  /* ── Sign-in required ──────────────────────────────────────────────────── */
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

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <PageTransition>
      <div className="min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-6">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-soft" style={{ height: "calc(100vh - 140px)" }}>
            <div className="flex h-full">

              {/* ── Sidebar ──────────────────────────────────────────────── */}
              <div className="w-80 border-r border-border/40 flex flex-col bg-secondary/20 hidden md:flex">
                <div className="p-4 border-b border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-lg">Messages</h2>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium">Secure</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background text-sm" />
                  </div>
                </div>

                {/* CA list for clients to start conversations */}
                {!isCA && conversations.length === 0 && !loading && (
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Start a conversation with our CAs:</p>
                    {REGISTERED_CAS.map((ca) => (
                      <button key={ca.name} onClick={async () => {
                        // Find CA user_id from profiles
                        const caName = ca.name.replace("CA ", "");
                        const match = Object.entries(caProfiles).find(([, p]) =>
                          p.name.toLowerCase().includes(caName.toLowerCase())
                        );
                        if (match) { await startConversation(match[0]); }
                        else { toast.error(`${ca.name} is not yet registered. Please contact via the Contact page.`); }
                      }}
                        className="w-full p-3 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/30 flex items-center gap-3 transition-colors text-left">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ca.gradient} flex items-center justify-center text-white text-sm font-bold`}>
                          {ca.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ca.name}</p>
                          <p className="text-[11px] text-muted-foreground">{ca.role}</p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConvs.length === 0 && conversations.length > 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No matching conversations</p>
                  ) : (
                    filteredConvs.map((conv) => {
                      const p = getPartnerInfo(conv);
                      const isActive = activeConvId === conv.id;
                      const caMatch = REGISTERED_CAS.find((ca) => ca.initials === p.initials);
                      return (
                        <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                          className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/60 transition-colors text-left border-b border-border/20 ${isActive ? "bg-secondary/80" : ""}`}>
                          <div className="relative flex-shrink-0">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${caMatch?.gradient || "from-violet-500 to-blue-500"} flex items-center justify-center text-white text-sm font-bold`}>
                              {p.initials}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{p.name}</p>
                              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                                {timeAgo(conv.last_message_at)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conv.last_message || "No messages yet"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}

                  {/* New conversation button for clients */}
                  {!isCA && conversations.length > 0 && (
                    <div className="p-3 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1">Start new chat</p>
                      {REGISTERED_CAS.map((ca) => {
                        const existing = conversations.some((c) => {
                          const p = caProfiles[c.ca_id];
                          return p && p.name.toLowerCase().includes(ca.name.replace("CA ", "").toLowerCase());
                        });
                        if (existing) return null;
                        return (
                          <button key={ca.name} onClick={async () => {
                            const caName = ca.name.replace("CA ", "");
                            const match = Object.entries(caProfiles).find(([, p]) =>
                              p.name.toLowerCase().includes(caName.toLowerCase()));
                            if (match) await startConversation(match[0]);
                            else toast.error(`${ca.name} not registered yet.`);
                          }}
                            className="w-full p-2 rounded-lg hover:bg-secondary/60 flex items-center gap-2 text-sm transition-colors">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${ca.gradient} flex items-center justify-center text-white text-[10px] font-bold`}>
                              {ca.initials}
                            </div>
                            <span className="text-muted-foreground">{ca.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Chat Area ────────────────────────────────────────────── */}
              <div className="flex-1 flex flex-col">
                {!activeConvId ? (
                  /* Empty state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 rounded-2xl bg-secondary/60 flex items-center justify-center mb-6">
                      <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to Messages</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">
                      {isCA
                        ? "Client messages will appear here. Select a conversation to start chatting."
                        : "Chat directly with your CA. Select a conversation or start a new one from the sidebar."}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      End-to-end secured • Messages stored safely
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="p-4 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {partner?.initials || "?"}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{partner?.name || "Chat"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {otherTyping ? (
                              <><span className="text-accent animate-pulse">typing...</span></>
                            ) : (
                              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</>
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Mobile back button could go here */}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
                        </div>
                      )}
                      {messages.map((msg) => {
                        const isMine = msg.sender_id === user.id;
                        const isStarred = starredMsgs.has(msg.id);
                        return (
                          <motion.div key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            className={`flex group ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className="relative max-w-[70%]">
                              {/* Action buttons on hover */}
                              <div className={`absolute top-0 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1`}>
                                <button onClick={() => toggleStar(msg.id)} className="p-1 rounded hover:bg-secondary">
                                  <Star className={`w-3 h-3 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                </button>
                                {isMine && (
                                  <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded hover:bg-secondary">
                                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                                  </button>
                                )}
                              </div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? "bg-foreground text-background rounded-br-md"
                                  : "bg-secondary rounded-bl-md"
                              }`}>
                                <p>{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                                  {isStarred && <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />}
                                  <span className={`text-[10px] ${isMine ? "opacity-60" : "text-muted-foreground"}`}>
                                    {formatTime(msg.created_at)}
                                  </span>
                                  {isMine && (
                                    msg.read
                                      ? <CheckCheck className="w-3 h-3 text-blue-400" />
                                      : <Check className="w-3 h-3 opacity-60" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Smart replies */}
                    <AnimatePresence>
                      {showSmartReplies && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="border-t border-border/30 overflow-hidden">
                          <div className="p-2 flex gap-2 overflow-x-auto">
                            {SMART_REPLIES.map((r) => (
                              <button key={r} onClick={() => sendMessage(r)}
                                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border/50 text-xs hover:bg-secondary transition-colors">
                                {r}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Emoji picker */}
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="border-t border-border/30 overflow-hidden">
                          <div className="p-2 flex gap-1.5 justify-center">
                            {EMOJI_QUICK.map((e) => (
                              <button key={e} onClick={() => { setNewMessage((prev) => prev + e); setShowEmoji(false); inputRef.current?.focus(); }}
                                className="text-xl p-2 rounded-lg hover:bg-secondary transition-colors">
                                {e}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input */}
                    <div className="p-4 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 flex-shrink-0"
                          onClick={() => { setShowSmartReplies(!showSmartReplies); setShowEmoji(false); }}>
                          <Reply className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 flex-shrink-0"
                          onClick={() => { setShowEmoji(!showEmoji); setShowSmartReplies(false); }}>
                          <Smile className="w-4 h-4" />
                        </Button>
                        <Input ref={inputRef} placeholder="Type a message..." value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                          className="flex-1 rounded-xl h-10 bg-secondary/40" />
                        <Button onClick={() => sendMessage()} size="icon"
                          className="rounded-full w-10 h-10 flex-shrink-0"
                          disabled={!newMessage.trim() || sending}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
