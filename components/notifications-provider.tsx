"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, Zap, Calendar } from "lucide-react";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const isSubscribed = useRef(false);

    useEffect(() => {
        if (isSubscribed.current) return;

        const setupListeners = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            isSubscribed.current = true;
            console.log("🔔 Notifications System Active for:", user.email);

            // Listen for all changes and filter in JS for better reliability
            const channel = supabase
                .channel('realtime_notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    (payload) => {
                        if (payload.new.recipient_id === user.id) {
                            toast.message("New Mail!", {
                                description: "You've received a new direct message.",
                                icon: <Mail className="w-4 h-4 text-accent" />,
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'notifications' },
                    (payload) => {
                        if (payload.new.user_id === user.id) {
                            const { type, title, content } = payload.new;
                            
                            let icon = <Zap className="w-4 h-4 text-accent" />;
                            if (type === 'message') icon = <Mail className="w-4 h-4 text-accent" />;
                            if (type === 'event') icon = <Calendar className="w-4 h-4 text-accent" />;

                            toast.success(title, {
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

            return () => {
                supabase.removeChannel(channel);
                isSubscribed.current = false;
            };
        };

        setupListeners();
    }, []);

    return <>{children}</>;
}
