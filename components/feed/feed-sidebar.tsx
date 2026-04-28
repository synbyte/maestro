"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { UserTooltip } from "@/components/user-tooltip";

interface StudyBuddy {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    course_name: string;
    week_number: number;
    lesson_number: number;
}

export function FeedSidebar() {
    const supabase = createClient();
    const [cohortMembers, setCohortMembers] = useState<any[]>([]);
    const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingBuddies, setLoadingBuddies] = useState(true);

    useEffect(() => {
        const fetchSidebarData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch cohort members
            const { data: profile } = await supabase
                .from("profiles")
                .select("cohort, start_date")
                .eq("id", user.id)
                .single();

            if (profile?.start_date) {
                // Extract month and year to define the cohort
                const userStartDate = new Date(profile.start_date + "T12:00:00");
                const year = userStartDate.getFullYear();
                const month = userStartDate.getMonth();

                // Get range for that month
                const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
                const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

                const { data: otherMembers } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_url, headline, start_date")
                    .gte("start_date", firstDay)
                    .lte("start_date", lastDay)
                    .neq("id", user.id)
                    .limit(5);

                if (otherMembers) setCohortMembers(otherMembers);
            } else if (profile?.cohort) {
                // Fallback to the cohort column if start_date is missing
                const { data: otherMembers } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_url, headline, start_date")
                    .eq("cohort", profile.cohort)
                    .neq("id", user.id)
                    .limit(5);

                if (otherMembers) setCohortMembers(otherMembers);
            }
            setLoadingMembers(false);

            // 2. Fetch current user's active (non-completed) courses
            const { data: myCourses } = await supabase
                .from("user_courses")
                .select("course_name, week_number, lesson_number")
                .eq("user_id", user.id)
                .eq("is_completed", false);

            if (!myCourses || myCourses.length === 0) {
                setLoadingBuddies(false);
                return;
            }

            // 3. For each of my courses, find others ±1 lesson on the same week
            const allBuddies: StudyBuddy[] = [];

            for (const course of myCourses) {
                const minLesson = Math.max(1, course.lesson_number - 1);
                const maxLesson = Math.min(15, course.lesson_number + 1);

                const { data: matches } = await supabase
                    .from("user_courses")
                    .select("user_id, course_name, week_number, lesson_number, profiles(display_name, avatar_url)")
                    .ilike("course_name", course.course_name)
                    .eq("week_number", course.week_number)
                    .gte("lesson_number", minLesson)
                    .lte("lesson_number", maxLesson)
                    .eq("is_completed", false)
                    .neq("user_id", user.id)
                    .limit(5);

                if (matches) {
                    matches.forEach((m: any) => {
                        // Avoid duplicates
                        if (!allBuddies.find(b => b.user_id === m.user_id && b.course_name === m.course_name)) {
                            allBuddies.push({
                                user_id: m.user_id,
                                display_name: m.profiles?.display_name || "Unknown",
                                avatar_url: m.profiles?.avatar_url || null,
                                course_name: m.course_name,
                                week_number: m.week_number,
                                lesson_number: m.lesson_number,
                            });
                        }
                    });
                }
            }

            setStudyBuddies(allBuddies);
            setLoadingBuddies(false);
        };

        fetchSidebarData();
    }, [supabase]);

    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
            {/* Study Buddies */}
            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-1">Study Buddies</h2>
                <p className="text-[11px] text-muted mb-4">Others near you in the same course</p>
                <div className="space-y-4">
                    {loadingBuddies ? (
                        <div className="text-xs text-muted">Loading...</div>
                    ) : studyBuddies.length === 0 ? (
                        <div className="text-xs text-muted">No nearby study buddies yet. Keep going! 🔥</div>
                    ) : (
                        studyBuddies.map((buddy, idx) => (
                            <UserTooltip key={`${buddy.user_id}-${idx}`} userId={buddy.user_id} className="w-full">
                                <Link
                                    href={`/profile/${buddy.user_id}`}
                                    className="flex items-center gap-3 group cursor-pointer"
                                >
                                    <UserAvatar
                                        userId={buddy.user_id}
                                        src={buddy.avatar_url}
                                        name={buddy.display_name}
                                        size="md"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground group-hover:underline truncate">{buddy.display_name}</div>
                                        <div className="text-[11px] text-muted truncate uppercase tracking-tight">
                                            {buddy.course_name} · W{buddy.week_number} L{buddy.lesson_number}
                                        </div>
                                    </div>
                                </Link>
                            </UserTooltip>
                        ))
                    )}
                </div>
            </div>

            {/* Cohort Members */}
            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-1">Cohort Members</h2>
                <p className="text-[11px] text-muted mb-4">Students who started with you</p>
                <div className="space-y-4">
                    {loadingMembers ? (
                        <div className="text-xs text-muted">Loading...</div>
                    ) : cohortMembers.length === 0 ? (
                        <div className="text-xs text-muted">No other members in your cohort yet.</div>
                    ) : (
                        cohortMembers.map(member => {
                            const cohortStr = member.start_date
                                ? `${new Date(member.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort`
                                : "Cohort";
                            return (
                                <CohortMember
                                    key={member.id}
                                    id={member.id}
                                    name={member.display_name || "Unknown"}
                                    focus={member.headline || cohortStr}
                                    avatar={member.avatar_url}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function CohortMember({ id, name, focus, avatar }: { id: string; name: string; focus: string; avatar?: string }) {
    return (
        <UserTooltip userId={id} className="w-full">
            <Link href={`/profile/${id}`} className="flex items-center gap-3 group cursor-pointer">
                <UserAvatar userId={id} src={avatar} name={name} size="md" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:underline truncate">{name}</div>
                    <div className="text-[11px] text-muted truncate">{focus}</div>
                </div>
            </Link>
        </UserTooltip>
    );
}
