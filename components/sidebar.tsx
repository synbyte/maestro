"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [sidebarUserId, setSidebarUserId] = useState<string | null>(null);

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

            const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("recipient_id", user.id)
                .eq("is_read", false);
            setUnreadCount(count ?? 0);
            setSidebarUserId(user.id);
        };
        run();
    }, []);

    // Effect 2: Realtime channel — synchronous pattern
    useEffect(() => {
        if (!sidebarUserId) return;

        const channel = supabase.channel(`sidebar_inbox_${sidebarUserId}`);

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
        <>
            <div className="p-6">
                <Link href="/dashboard" className="text-xl font-medium tracking-tight mb-10 block" onClick={() => setMobileMenuOpen(false)}>
                    Maestro Mix
                </Link>
                <nav className="space-y-2">
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2 rounded text-sm transition-colors ${pathname === '/dashboard' ? 'bg-[#333] text-[#ecebe4]' : 'text-[#aaaaa5] hover:text-[#ecebe4] hover:bg-[#222]'}`}
                    >
                        The Quad
                    </Link>
                    <Link
                        href="/inbox"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-2 rounded text-sm transition-colors ${pathname.startsWith('/inbox') ? 'bg-[#333] text-[#ecebe4]' : 'text-[#aaaaa5] hover:text-[#ecebe4] hover:bg-[#222]'}`}
                    >
                        <span>Inbox</span>
                        {unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* Coming Soon Skeletons */}
                    <div className="space-y-1">
                        <div className="px-4 py-2 flex items-center justify-between text-sm text-[#aaaaa5] opacity-30 cursor-not-allowed">
                            <span>Events</span>
                            <span className="text-[8px] border border-[#444] px-1 rounded uppercase font-bold tracking-widest">Soon</span>
                        </div>
                        <div className="px-4 py-2 flex items-center justify-between text-sm text-[#aaaaa5] opacity-30 cursor-not-allowed">
                            <span>Study</span>
                            <span className="text-[8px] border border-[#444] px-1 rounded uppercase font-bold tracking-widest">Soon</span>
                        </div>
                        <div className="px-4 py-2 flex items-center justify-between text-sm text-[#aaaaa5] opacity-30 cursor-not-allowed">
                            <span>Showcase</span>
                            <span className="text-[8px] border border-[#444] px-1 rounded uppercase font-bold tracking-widest">Soon</span>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="p-4 border-t border-[#333] relative">
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute bottom-full left-4 mb-2 w-56 bg-[#1a1a1a] border border-[#333] rounded shadow-lg overflow-hidden animate-fade-in z-50">
                        <Link
                            href="/profile/edit"
                            className="block w-full text-left px-4 py-3 text-sm hover:bg-[#333] transition-colors text-[#ecebe4]"
                            onClick={() => { setMenuOpen(false); setMobileMenuOpen(false); }}
                        >
                            Edit Profile
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-3 text-sm hover:bg-[#333] transition-colors text-red-500"
                        >
                            Sign out
                        </button>
                    </div>
                    </>
                )}

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#222] transition-colors text-left"
                >
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover bg-[#333]" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-[#333] flex-shrink-0" />
                    )}
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-[#ecebe4] truncate">
                            {profile?.display_name || "New User"}
                        </div>
                        <div className="text-xs text-[#aaaaa5] truncate">
                            {profile?.start_date ? `${new Date(profile.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Set up profile"}
                        </div>
                    </div>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[#333] bg-[#121212] flex-col justify-between hidden md:flex z-40">
                {sidebarContent}
            </aside>

            {/* Mobile Header & Hamburger */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-[#333] bg-[#121212] sticky top-0 z-40">
                <Link href="/dashboard" className="text-lg font-medium tracking-tight">
                    Maestro Mix
                </Link>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#ecebe4]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Slide-over Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="relative flex flex-col w-64 max-w-sm h-full bg-[#121212] border-r border-[#333] shadow-xl justify-between">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
