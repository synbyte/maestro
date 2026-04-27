"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/user-avatar";

export default function InboxPage() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [userId, setUserId] = useState<string | null>(null);

    // Effect 1: Fetch user + initial data
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth/login"); return; }
            setUser(user);
            setUserId(user.id);
            await fetchConversations(user.id);
        };
        init();
    }, []);

    // Effect 2: Realtime channel — synchronous pattern avoids StrictMode double-subscribe
    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`inbox_${userId}`);

        channel
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `recipient_id=eq.${userId}`,
            }, () => fetchConversations(userId));

        channel.subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    const fetchConversations = async (userId: string) => {
        const { data } = await supabase
            .from("messages")
            .select(`
                id, content, is_read, created_at,
                sender_id, recipient_id,
                sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
                recipient:profiles!messages_recipient_id_fkey(id, display_name, avatar_url)
            `)
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
            .order("created_at", { ascending: false });

        if (!data) { setLoading(false); return; }

        // Group by the "other" person in each conversation
        const convMap = new Map<string, any>();
        for (const msg of data) {
            const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
            const otherProfile = msg.sender_id === userId ? msg.recipient : msg.sender;
            if (!convMap.has(otherId)) {
                convMap.set(otherId, {
                    otherId,
                    otherProfile,
                    lastMessage: msg,
                    unreadCount: 0,
                });
            }
            // Count unread messages TO me
            if (!msg.is_read && msg.recipient_id === userId) {
                convMap.get(otherId).unreadCount += 1;
            }
        }

        setConversations(Array.from(convMap.values()));
        setLoading(false);
    };

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-2xl py-10 px-6">
            <div className="mb-8 border-b border-border pb-4">
                <h1 className="text-3xl font-medium tracking-tight">Inbox</h1>
                <p className="text-muted text-sm mt-1">Your private conversations.</p>
            </div>

            {loading ? (
                <div className="text-muted text-sm text-center py-10">Loading...</div>
            ) : conversations.length === 0 ? (
                <div className="text-muted text-sm text-center py-10 border border-border rounded-xl">
                    No messages yet. Visit someone's profile to start a conversation!
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map(conv => (
                        <Link
                            key={conv.otherId}
                            href={`/inbox/${conv.otherId}`}
                            className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-[#1a1a1a] transition-colors group"
                        >
                            <UserAvatar
                                userId={conv.otherId}
                                src={conv.otherProfile?.avatar_url}
                                name={conv.otherProfile?.display_name}
                                size="lg"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`text-sm font-semibold ${conv.unreadCount > 0 ? "text-foreground" : "text-muted"}`}>
                                        {conv.otherProfile?.display_name || "Unknown"}
                                    </span>
                                    <span className="text-[11px] text-muted">
                                        {new Date(conv.lastMessage.created_at).toLocaleString("en-US", {
                                            month: "numeric", day: "numeric",
                                            hour: "numeric", minute: "2-digit", hour12: true
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted"}`}>
                                        {conv.lastMessage.sender_id === user?.id ? "You: " : ""}
                                        {conv.lastMessage.content}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
