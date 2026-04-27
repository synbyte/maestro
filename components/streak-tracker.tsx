"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function StreakTracker() {
    useEffect(() => {
        const updateStreak = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("last_login_date, current_streak")
                .eq("id", user.id)
                .single();

            if (!profile) return;

            // Get local date in YYYY-MM-DD format
            const today = new Date().toLocaleDateString("en-CA");
            const lastLogin = profile.last_login_date;
            let currentStreak = profile.current_streak || 0;
            
            if (lastLogin === today) {
                // If logged in today but streak is still 0, fix it to 1
                if (currentStreak === 0) {
                    await supabase
                        .from("profiles")
                        .update({ current_streak: 1 })
                        .eq("id", user.id);
                }
                return;
            }

            let newStreak = 1; // Default to 1 for a new or broken streak

            if (lastLogin) {
                const todayDate = new Date(today);
                const lastDate = new Date(lastLogin);
                
                // Calculate difference in days properly
                const diffTime = todayDate.getTime() - lastDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Logged in exactly yesterday
                    newStreak = currentStreak + 1;
                } else if (diffDays <= 0) {
                    // This handles weird timezone overlaps where today < lastLogin
                    newStreak = Math.max(currentStreak, 1);
                }
                // Otherwise it stays 1 (streak reset)
            }

            await supabase
                .from("profiles")
                .update({ 
                    last_login_date: today,
                    current_streak: newStreak
                })
                .eq("id", user.id);

            // Award daily login reputation (75 pts)
            await supabase.rpc('increment_reputation', { 
                profile_id: user.id, 
                amount: 75 
            });
        };

        updateStreak();
    }, []);

    return null;
}
