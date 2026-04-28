"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "./user-avatar";
import { Award, Flame, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface UserTooltipProps {
    userId: string;
    children: React.ReactNode;
    className?: string;
}

export function UserTooltip({ userId, children, className = "" }: UserTooltipProps) {
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom">("top");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (show && !profile) {
            fetchData();
        }
    }, [show]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Smart positioning
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // If the top of the element is less than 300px from the top of the viewport,
            // show the tooltip below the element instead of above it.
            if (rect.top < 300) {
                setTooltipPosition("bottom");
            } else {
                setTooltipPosition("top");
            }
        }

        setShow(true);
    };

    const handleMouseLeave = () => {
        timerRef.current = setTimeout(() => {
            setShow(false);
        }, 100);
    };

    const fetchData = async () => {
        setLoading(true);

        // Fetch profile
        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileData) setProfile(profileData);

        // Fetch current course/lesson
        const { data: courseData } = await supabase
            .from("user_courses")
            .select("*")
            .eq("user_id", userId)
            .eq("is_completed", false)
            .order("created_at", { ascending: false })
            .limit(1);

        if (courseData && courseData.length > 0) {
            setCurrentCourse(courseData[0]);
        }

        setLoading(false);
    };

    return (
        <div
            ref={containerRef}
            className={`relative block w-fit ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: tooltipPosition === "top" ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
                        exit={{
                            opacity: 0,
                            scale: 0.95,
                            x: "-50%",
                            y: tooltipPosition === "top" ? 5 : -5,
                            pointerEvents: "none"
                        }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 300,
                            opacity: { duration: 0.15 }
                        }}
                        className={`
                            absolute left-1/2 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-[100]
                            ${tooltipPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"}
                        `}
                    >
                        {loading && !profile ? (
                            <div className="p-4 text-center text-xs text-muted">Loading...</div>
                        ) : profile ? (
                            <div className="flex flex-col">
                                {/* Banner area */}
                                <div className="h-12 w-full bg-gradient-to-r from-primary/20 to-[#121212]" />

                                <div className="px-4 pb-4 -mt-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="p-0.5 bg-[#1a1a1a] rounded-full inline-block">
                                            <UserAvatar userId={profile.id} src={profile.avatar_url} name={profile.display_name} size="lg" />
                                        </div>
                                        <Link href={`/profile/${profile.id}`} className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-medium hover:opacity-90">
                                            View Profile
                                        </Link>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-sm font-semibold text-foreground truncate">{profile.display_name}</div>
                                        <div className="text-[11px] text-muted truncate">{profile.headline || "Maestro Mix Student"}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-[#121212] p-2 rounded border border-[#333] flex flex-col">
                                            <div className="flex items-center gap-1 text-[9px] text-muted uppercase tracking-wider mb-0.5">
                                                <Flame size={10} className="text-orange-500" /> Streak
                                            </div>
                                            <div className="text-xs font-bold text-foreground">{profile.current_streak || 0} Days</div>
                                        </div>
                                        <div className="bg-[#121212] p-2 rounded border border-[#333] flex flex-col">
                                            <div className="flex items-center gap-1 text-[9px] text-muted uppercase tracking-wider mb-0.5">
                                                <Award size={10} className="text-yellow-500" /> Rep
                                            </div>
                                            <div className="text-xs font-bold text-foreground">{(profile.reputation || 0).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {currentCourse && (
                                        <div className="bg-[#121212] p-2 rounded border border-[#333]">
                                            <div className="flex items-center gap-1 text-[9px] text-muted uppercase tracking-wider mb-1">
                                                <BookOpen size={10} className="text-blue-500" /> Currently Learning
                                            </div>
                                            <div className="text-[10px] font-medium text-foreground truncate uppercase">{currentCourse.course_name}</div>
                                            <div className="text-[10px] text-muted">
                                                Week {currentCourse.week_number} · Lesson {currentCourse.lesson_number}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Tooltip arrow */}
                        {tooltipPosition === "top" ? (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-8 border-transparent border-t-[#333]" />
                        ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-0.5 border-8 border-transparent border-b-[#333]" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
