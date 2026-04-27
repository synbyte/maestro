"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PresenceContextType {
    onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export const usePresence = () => useContext(PresenceContext);

// 30 minutes in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function PresenceProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- INACTIVITY LOGIC ---
    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
    };

    useEffect(() => {
        // Events to track activity
        const events = ["mousedown", "keydown", "touchstart", "scroll"];
        
        // Initialize timer
        resetTimer();

        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    // --- PRESENCE LOGIC ---
    useEffect(() => {
        let user: any = null;

        const setupPresence = async () => {
            const { data } = await supabase.auth.getUser();
            user = data.user;
            if (!user) return;

            const channel = supabase.channel("online-users", {
                config: {
                    presence: {
                        key: user.id,
                    },
                },
            });

            channel
                .on("presence", { event: "sync" }, () => {
                    const state = channel.presenceState();
                    const ids = new Set<string>(Object.keys(state));
                    setOnlineUsers(ids);
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        await channel.track({
                            user_id: user.id,
                            online_at: new Date().toISOString(),
                        });
                    }
                });

            return channel;
        };

        const channelPromise = setupPresence();

        return () => {
            channelPromise.then(channel => {
                if (channel) supabase.removeChannel(channel);
            });
        };
    }, [supabase]);

    return (
        <PresenceContext.Provider value={{ onlineUsers }}>
            {children}
        </PresenceContext.Provider>
    );
}
