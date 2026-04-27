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
            
            if (lastLogin === today) {
                // Already logged in today, do nothing
                return;
            }

            let newStreak = profile.current_streak || 0;

            if (lastLogin) {
                const todayDate = new Date(today);
                const lastDate = new Date(lastLogin);
                const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Logged in yesterday, increment streak
                    newStreak += 1;
                } else {
                    // Missed a day, reset streak
                    newStreak = 1;
                }
            } else {
                // First login
                newStreak = 1;
            }

            await supabase
                .from("profiles")
                .update({ 
                    last_login_date: today,
                    current_streak: newStreak
                })
                .eq("id", user.id);
        };

        updateStreak();
    }, []);

    return null;
}
