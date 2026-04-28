"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, Zap, Calendar, Heart, MessageSquare, Bell } from "lucide-react";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();

    useEffect(() => {
        let channel: any = null;

        const setupListeners = (user: any) => {
            if (channel) return; // Already subscribed

            console.log("🔔 Notifications System Active for:", user.email);

            channel = supabase
                .channel('realtime_notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications' },
                    (payload) => {
                        if (payload.new.user_id === user.id) {
                            const { type, title, content } = payload.new;
                            
                            let icon = <Bell className="w-4 h-4 text-accent" />;
                            if (type === 'message') icon = <Mail className="w-4 h-4 text-blue-400" />;
                            if (type === 'event') icon = <Calendar className="w-4 h-4 text-purple-400" />;
                            if (type === 'comment') icon = <MessageSquare className="w-4 h-4 text-green-400" />;
                            if (type === 'reaction') icon = <Heart className="w-4 h-4 text-red-400" />;

                            toast(title, {
                                description: content,
                                icon: icon,
                                duration: 5000,
                            });
                        }
                    }
                )
                .subscribe((status) => {
                    console.log("📡 Realtime Status:", status);
                });
        };

        // 1. Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setupListeners(session.user);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                setupListeners(session.user);
            } else if (event === 'SIGNED_OUT') {
                if (channel) {
                    supabase.removeChannel(channel);
                    channel = null;
                }
            }
        });

        return () => {
            if (channel) supabase.removeChannel(channel);
            subscription.unsubscribe();
        };
    }, []);

    return <>{children}</>;
}
