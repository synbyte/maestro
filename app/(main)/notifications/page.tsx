"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, MessageSquare, Heart, Zap, Calendar, Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function NotificationsPage() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            setNotifications(data || []);
            setLoading(false);

            // Mark all as read when visiting the page
            if (data && data.some((n: any) => !n.is_read)) {
                await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("user_id", user.id)
                    .eq("is_read", false);
            }
        };

        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <Mail className="w-5 h-5 text-blue-400" />;
            case 'comment': return <MessageSquare className="w-5 h-5 text-green-400" />;
            case 'reaction': return <Heart className="w-5 h-5 text-red-400" />;
            case 'milestone': return <Zap className="w-5 h-5 text-yellow-400" />;
            case 'event': return <Calendar className="w-5 h-5 text-purple-400" />;
            default: return <Bell className="w-5 h-5 text-accent" />;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="text-muted animate-pulse">Loading notifications...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Notifications</h1>
                    <p className="text-muted">Stay updated with your cohort's activity.</p>
                </div>
                {notifications.length > 0 && (
                    <div className="bg-[#1a1a1a] border border-border px-3 py-1 rounded-full text-xs text-muted flex items-center gap-2">
                        <Check size={14} />
                        All caught up
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {notifications.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-[#1a1a1a] border border-dashed border-border rounded-xl"
                        >
                            <Bell className="w-12 h-12 text-[#333] mx-auto mb-4" />
                            <p className="text-muted">No notifications yet.</p>
                        </motion.div>
                    ) : (
                        notifications.map((n, i) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`group p-4 rounded-xl border transition-all hover:bg-[#1a1a1a] ${n.is_read ? 'bg-transparent border-border/40' : 'bg-[#1a1a1a]/50 border-accent/30 shadow-[0_0_15px_rgba(var(--accent),0.05)]'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="mt-1">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-semibold text-sm ${n.is_read ? 'text-[#ecebe4]' : 'text-accent'}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] text-muted uppercase tracking-widest">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#aaaaa5] leading-relaxed">
                                            {n.content}
                                        </p>
                                        
                                        {n.metadata?.post_id && (
                                            <Link 
                                                href="/dashboard" 
                                                className="inline-flex items-center gap-1.5 text-xs text-accent mt-3 hover:underline"
                                            >
                                                View Post
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
