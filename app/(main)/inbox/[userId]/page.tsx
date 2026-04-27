"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";

export default function MessageThreadPage() {
    const supabase = createClient();
    const router = useRouter();
    const { userId: otherUserId } = useParams<{ userId: string }>();

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [otherProfile, setOtherProfile] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Effect 1: fetch data async
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth/login"); return; }
            setCurrentUser(user);
            setCurrentUserId(user.id);

            // Fetch other user's profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url, headline")
                .eq("id", otherUserId)
                .single();
            setOtherProfile(profile);

            await fetchMessages(user.id);

            // Mark all as read
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("sender_id", otherUserId)
                .eq("recipient_id", user.id)
                .eq("is_read", false);
        };
        init();
    }, [otherUserId]);

    // Effect 2: Realtime channel — synchronous pattern
    useEffect(() => {
        if (!currentUserId) return;

        const channelName = `thread_${currentUserId}_${otherUserId}`;

        // Remove stale channels to prevent duplicate event listeners in StrictMode
        supabase.getChannels().forEach(ch => {
            if (ch.topic === `realtime:${channelName}` || ch.topic === channelName) {
                supabase.removeChannel(ch);
            }
        });

        const channel = supabase.channel(channelName);

        channel.on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "messages",
        }, async (payload) => {
            const msg = payload.new as any;
            const isRelevant =
                (msg.sender_id === currentUserId && msg.recipient_id === otherUserId) ||
                (msg.sender_id === otherUserId && msg.recipient_id === currentUserId);
            if (!isRelevant) return;

            if (msg.recipient_id === currentUserId && !msg.is_read) {
                await supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
            }
            setMessages(prev => [...prev, { ...msg, is_read: true }]);
        });

        channel.subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUserId, otherUserId]);

    useEffect(() => {
        // Scroll to bottom on new messages
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async (userId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .or(
                `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
            )
            .order("created_at", { ascending: true });

        if (data) setMessages(data);
        setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !currentUser || sending) return;

        setSending(true);
        await supabase.from("messages").insert({
            sender_id: currentUser.id,
            recipient_id: otherUserId,
            content: input.trim(),
        });
        setInput("");
        setSending(false);
        // Regain focus after sending
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e as any);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-57px)] md:h-screen w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#121212] border-b border-border px-4 py-3 flex items-center gap-3">
                <Link href="/inbox" className="text-muted hover:text-foreground transition-colors mr-1">
                    <ArrowLeft size={18} />
                </Link>
                {otherProfile && (
                    <>
                        <UserAvatar
                            userId={otherProfile.id}
                            src={otherProfile.avatar_url}
                            name={otherProfile.display_name}
                            size="md"
                        />
                        <div>
                            <Link href={`/profile/${otherProfile.id}`} className="text-sm font-semibold text-foreground hover:underline">
                                {otherProfile.display_name}
                            </Link>
                            {otherProfile.headline && (
                                <div className="text-[11px] text-muted">{otherProfile.headline}</div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loading ? (
                    <div className="text-center text-muted text-sm py-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted text-sm py-10">No messages yet. Say hello! 👋</div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe
                                    ? "bg-primary text-primary-foreground rounded-br-sm border border-border"
                                    : "bg-[#1a1a1a] text-foreground border border-border rounded-bl-sm"
                                    }`}>
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-0">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                    <div className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60 text-right" : "text-muted"}`}>
                                        {new Date(msg.created_at).toLocaleString("en-US", {
                                            hour: "numeric", minute: "2-digit", hour12: true
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border bg-[#121212] p-4">
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        className="flex-1 input-field py-2 px-3 text-sm resize-none min-h-[42px] max-h-[120px]"
                        placeholder="Write a message... (Enter to send, Shift+Enter for newline)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="btn btn-primary px-4 py-2 text-sm shrink-0"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
