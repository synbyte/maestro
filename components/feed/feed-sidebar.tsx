"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { UserTooltip } from "@/components/user-tooltip";
import { Award, Flame, BookOpen, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarWidget } from "@/components/calendar-widget";

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
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [completedCourseCount, setCompletedCourseCount] = useState(0);
    const [projectCount, setProjectCount] = useState(0);
    const [cohortMembers, setCohortMembers] = useState<any[]>([]);
    const [newMembers, setNewMembers] = useState<any[]>([]);
    const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingNewMembers, setLoadingNewMembers] = useState(true);
    const [loadingBuddies, setLoadingBuddies] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchSidebarData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            // Fetch current user's profile for stats
            const { data: myProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (myProfile) setUserProfile(myProfile);

            // Fetch completed course count
            const { count: courseCount } = await supabase
                .from("user_courses")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .eq("is_completed", true);

            setCompletedCourseCount(courseCount || 0);

            // Fetch project count
            const { count: pCount } = await supabase
                .from("user_projects")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id);

            setProjectCount(pCount || 0);

            setLoadingProfile(false);

            // 1. Fetch cohort members
            const profile = myProfile;

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
                    .eq("is_onboarded", true)
                    .neq("id", user.id)
                    .limit(5);

                if (otherMembers) setCohortMembers(otherMembers);
            } else if (profile?.cohort) {
                // Fallback to the cohort column if start_date is missing
                const { data: otherMembers } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_url, headline, start_date")
                    .eq("cohort", profile.cohort)
                    .eq("is_onboarded", true)
                    .neq("id", user.id)
                    .limit(5);

                if (otherMembers) setCohortMembers(otherMembers);
            }
            setLoadingMembers(false);

            // 1.5 Fetch new members (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: newMembersData } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url, headline, created_at")
                .gte("created_at", sevenDaysAgo.toISOString())
                .eq("is_onboarded", true)
                .order("created_at", { ascending: false })
                .limit(5);

            if (newMembersData) setNewMembers(newMembersData);
            setLoadingNewMembers(false);

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
            {/* Calendar Widget */}
            <CalendarWidget />

            {/* Your Stats */}
            {loadingProfile ? (
                <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 animate-pulse shadow-lg">
                    <div className="h-3 w-24 bg-white/5 rounded mb-5" />
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5" />
                        ))}
                    </div>
                </div>
            ) : userProfile && (
                <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl transition-all hover:bg-[#1a1a1a]/60 hover:border-white/10 group/stats">
                    <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase mb-5 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        Your Progress
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <StatItem
                            href={`/profile/${user.id}`}
                            icon={<BookOpen size={18} className="text-blue-400" />}
                            label="Courses"
                            value={completedCourseCount}
                            tooltip="Total courses completed"
                        />
                        <StatItem
                            href={`/profile/${user.id}`}
                            icon={<Rocket size={15} className="text-purple-400" />}
                            label="Projects"
                            value={projectCount}
                            tooltip="Total projects shipped"
                        />
                        <StatItem
                            href={`/profile/${user.id}`}
                            icon={<Award size={18} className="text-yellow-400" />}
                            label="Rep"
                            value={(userProfile.reputation || 0).toLocaleString()}
                            tooltip="Earn reputation by interacting with the community"
                        />
                        <StatItem
                            href={`/profile/${user.id}`}
                            icon={<Flame size={18} className="text-orange-500" />}
                            label="Streak"
                            value={`${userProfile.current_streak || 0}d`}
                            tooltip="Consecutive active days"
                        />
                    </div>
                </div>
            )}

            {/* Study Buddies */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
                <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase mb-1">Study Buddies</h2>
                <p className="text-[10px] text-muted/60 mb-5">Learning near you</p>
                <div className="space-y-5">
                    {loadingBuddies ? (
                        [1, 2, 3].map(i => <SidebarSkeleton key={i} />)
                    ) : studyBuddies.length === 0 ? (
                        <div className="text-xs text-muted/50 italic py-2">No buddies nearby yet.</div>
                    ) : (
                        studyBuddies.map((buddy, idx) => (
                            <UserTooltip key={`${buddy.user_id}-${idx}`} userId={buddy.user_id} className="w-full">
                                <Link
                                    href={`/profile/${buddy.user_id}`}
                                    className="flex items-center gap-3 group/item cursor-pointer"
                                >
                                    <UserAvatar
                                        userId={buddy.user_id}
                                        src={buddy.avatar_url}
                                        name={buddy.display_name}
                                        size="md"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground group-hover/item:text-accent transition-colors truncate">{buddy.display_name}</div>
                                        <div className="text-[10px] text-muted/70 truncate uppercase tracking-tight">
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
            <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
                <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase mb-1">Cohort Members</h2>
                <p className="text-[10px] text-muted/60 mb-5">Started with you</p>
                <div className="space-y-5">
                    {loadingMembers ? (
                        [1, 2, 3].map(i => <SidebarSkeleton key={i} />)
                    ) : cohortMembers.length === 0 ? (
                        <div className="text-xs text-muted/50 italic py-2">Solo journey so far.</div>
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

            {/* New Members */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl">
                <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase mb-1">Fresh Faces</h2>
                <p className="text-[10px] text-muted/60 mb-5">New in the community</p>
                <div className="space-y-5">
                    {loadingNewMembers ? (
                        [1, 2, 3].map(i => <SidebarSkeleton key={i} />)
                    ) : newMembers.length === 0 ? (
                        <div className="text-xs text-muted/50 italic py-2">No new faces today.</div>
                    ) : (
                        newMembers.map(member => (
                            <CohortMember
                                key={member.id}
                                id={member.id}
                                name={member.display_name || "Unknown"}
                                focus={member.headline || "Just Joined"}
                                avatar={member.avatar_url}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SidebarSkeleton() {
    return (
        <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-2 w-28 bg-white/5 rounded opacity-50" />
            </div>
        </div>
    );
}

function CohortMember({ id, name, focus, avatar }: { id: string; name: string; focus: string; avatar?: string }) {
    return (
        <UserTooltip userId={id} className="w-full">
            <Link href={`/profile/${id}`} className="flex items-center gap-3 group/member cursor-pointer">
                <UserAvatar userId={id} src={avatar} name={name} size="md" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover/member:text-accent transition-colors truncate">{name}</div>
                    <div className="text-[10px] text-muted/70 truncate">{focus}</div>
                </div>
            </Link>
        </UserTooltip>
    );
}

function StatItem({ href, icon, label, value, tooltip }: { href: string; icon: React.ReactNode; label: string; value: string | number; tooltip: string }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <Link
                href={href}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="bg-white/[0.03] hover:bg-white/5 transition-all duration-300 p-3.5 rounded-xl border border-white/5 group block overflow-hidden"
            >
                <div className="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-[0.1em] mb-2 group-hover:text-accent transition-colors">
                    <div className="shrink-0">{icon}</div> {label}
                </div>
                <div className="text-xl font-bold text-foreground group-hover:scale-105 transition-transform origin-left">{value}</div>
            </Link>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-[#0a0a0a] border border-[#333] text-[10px] text-[#ecebe4] rounded shadow-xl whitespace-nowrap z-[100] pointer-events-none"
                    >
                        {tooltip}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#333]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
