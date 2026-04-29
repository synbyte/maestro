"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, Award, Flame, BookOpen, Rocket } from "lucide-react";
import { CalendarWidget } from "@/components/calendar-widget";

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    const [sidebarUserId, setSidebarUserId] = useState<string | null>(null);
    const [stats, setStats] = useState({ reputation: 0, streak: 0, courses: 0, projects: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Global click-outside for user menu
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    // Effect 1: Fetch user + data
    useEffect(() => {
        const run = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setProfile(data);

            // Fetch unread messages count
            const { count: msgCount } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("recipient_id", user.id)
                .eq("is_read", false);
            setUnreadCount(msgCount ?? 0);

            // Fetch unread notifications count
            const { count: notifCount } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("is_read", false);
            setUnreadNotifCount(notifCount ?? 0);

            // Fetch counts
            const { count: courseCount } = await supabase.from("user_courses").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("is_completed", true);
            const { count: projectCount } = await supabase.from("user_projects").select("*", { count: 'exact', head: true }).eq("user_id", user.id);

            setStats({
                reputation: data?.reputation || 0,
                streak: data?.current_streak || 0,
                courses: courseCount || 0,
                projects: projectCount || 0
            });
            setLoadingStats(false);
            setSidebarUserId(user.id);
        };
        run();
    }, []);

    // Effect 2: Realtime channel — synchronous pattern
    useEffect(() => {
        if (!sidebarUserId) return;

        const channel = supabase.channel(`sidebar_data_${sidebarUserId}`);

        channel
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `recipient_id=eq.${sidebarUserId}`,
            }, () => setUnreadCount(prev => prev + 1))
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `recipient_id=eq.${sidebarUserId}`,
            }, async () => {
                const { count } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("recipient_id", sidebarUserId)
                    .eq("is_read", false);
                setUnreadCount(count ?? 0);
            })
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${sidebarUserId}`,
            }, () => setUnreadNotifCount(prev => prev + 1))
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${sidebarUserId}`,
            }, async () => {
                const { count } = await supabase
                    .from("notifications")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", sidebarUserId)
                    .eq("is_read", false);
                setUnreadNotifCount(count ?? 0);
            });

        channel.subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [sidebarUserId]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    if (!user) return null;

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
                <Link href="/dashboard" className="flex items-center gap-3 mb-12 group transition-transform hover:scale-[1.02]" onClick={() => setMobileMenuOpen(false)}>
                    <img src="/logo.png" alt="Maestro Mix" className="w-10 h-10 object-contain drop-shadow-2xl" />
                    <span className="text-xl font-bold tracking-tight text-foreground">Maestro Mix</span>
                </Link>
                <nav className="space-y-1.5">
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === '/dashboard' ? 'bg-white/10 text-foreground shadow-lg' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                    >
                        <div className={`w-1 h-4 rounded-full transition-all ${pathname === '/dashboard' ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />
                        Home
                    </Link>

                    <Link
                        href="/inbox"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${pathname.startsWith('/inbox') ? 'bg-white/10 text-foreground shadow-lg' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-1 h-4 rounded-full transition-all ${pathname.startsWith('/inbox') ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />
                            Inbox
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-accent text-accent-fg text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Link>

                    <Link
                        href="/events"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${pathname.startsWith('/events') ? 'bg-white/10 text-foreground shadow-lg' : 'text-muted hover:text-foreground hover:bg-white/5'}`}
                    >
                        <div className={`w-1 h-4 rounded-full transition-all ${pathname.startsWith('/events') ? 'bg-accent opacity-100' : 'bg-transparent opacity-0'}`} />
                        Events
                    </Link>

                    {/* Soon Sections */}
                    <div className="pt-6 pb-2 px-4">
                        <span className="text-[10px] font-bold text-muted/40 uppercase tracking-[0.2em]">Coming Soon</span>
                    </div>
                    <div className="space-y-1 opacity-40">
                        <div className="px-4 py-3 flex items-center justify-between text-sm text-muted/60 font-medium">
                            <span>Study Space</span>
                        </div>
                        <div className="px-4 py-3 flex items-center justify-between text-sm text-muted/60 font-medium">
                            <span>Project Showcase</span>
                        </div>
                    </div>
                </nav>

                {/* Mobile-only Widgets */}
                <div className="mt-12 md:hidden space-y-10 pb-10">
                    <div>
                        <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase mb-5 px-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Your Progress
                        </h2>
                        <div className="grid grid-cols-2 gap-3 px-2">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-[0.1em] mb-2">
                                    <BookOpen size={18} className="text-blue-400 shrink-0" /> Courses
                                </div>
                                <div className="text-lg font-bold text-foreground">{stats.courses}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-[0.1em] mb-2">
                                    <Rocket size={18} className="text-purple-400 shrink-0" /> Projects
                                </div>
                                <div className="text-lg font-bold text-foreground">{stats.projects}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-[0.1em] mb-2">
                                    <Award size={18} className="text-yellow-400 shrink-0" /> Rep
                                </div>
                                <div className="text-lg font-bold text-foreground">{(stats.reputation || 0).toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                                <div className="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-[0.1em] mb-2">
                                    <Flame size={18} className="text-orange-500 shrink-0" /> Streak
                                </div>
                                <div className="text-lg font-bold text-foreground">{stats.streak}d</div>
                            </div>
                        </div>
                    </div>

                    <div className="px-2">
                        <CalendarWidget />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/10 backdrop-blur-md relative flex items-center gap-2" ref={userMenuRef}>
                {menuOpen && (
                    <div className="absolute bottom-[calc(100%+12px)] left-6 right-6 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 p-1.5 backdrop-blur-xl">
                        <Link
                            href="/profile/edit"
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-white/5 rounded-xl transition-all text-foreground font-medium"
                            onClick={() => { setMenuOpen(false); setMobileMenuOpen(false); }}
                        >
                            Edit Profile
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 rounded-xl transition-all text-red-500 font-medium"
                        >
                            Sign out
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex-1 flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all duration-300 text-left overflow-hidden group/profile"
                >
                    <div className="relative shrink-0">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0" />
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#121212] rounded-full" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-foreground truncate group-hover/profile:text-accent transition-colors">
                            {profile?.display_name?.split(' ')[0] || "New User"}
                        </div>
                        <div className="text-[10px] text-muted truncate uppercase tracking-tight font-medium">
                            {profile?.start_date ? `${new Date(profile.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Set up profile"}
                        </div>
                    </div>
                </button>

                <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-3 rounded-2xl hover:bg-white/5 transition-all relative ${pathname === '/notifications' ? 'text-accent bg-white/10' : 'text-muted hover:text-foreground'}`}
                    title="Notifications"
                >
                    <Bell size={20} />
                    {unreadNotifCount > 0 && (
                        <span className="absolute top-2 right-2 bg-accent text-accent-fg text-[9px] font-bold px-1 rounded-full min-w-[15px] h-[15px] flex items-center justify-center border border-[#121212] shadow-lg">
                            {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                        </span>
                    )}
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-[#121212]/80 backdrop-blur-xl flex-col justify-between hidden md:flex z-40">
                {sidebarContent}
            </aside>

            {/* Mobile Header & Hamburger */}
            <div className="md:hidden flex items-center justify-between px-6 h-16 border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl sticky top-0 z-40">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <img src="/logo.png" alt="Maestro Mix" className="w-8 h-8 object-contain" />
                    <span className="text-lg font-bold tracking-tight text-foreground">Maestro Mix</span>
                </Link>
                <div className="flex items-center gap-3">
                    {unreadNotifCount > 0 && (
                        <Link
                            href="/notifications"
                            className="p-2 text-muted relative hover:text-foreground transition-colors"
                        >
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 bg-accent text-accent-fg text-[8px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-[#121212]">
                                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-foreground hover:bg-white/5 rounded-lg transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Slide-over Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-[#121212] border-r border-white/10 shadow-2xl justify-between animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
