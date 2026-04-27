"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function FeedSidebar() {
    const supabase = createClient();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCohortMembers = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get current user's cohort
            const { data: profile } = await supabase
                .from("profiles")
                .select("cohort")
                .eq("id", user.id)
                .single();
            
            if (profile) {
                // Get other members in the same cohort
                const { data: otherMembers } = await supabase
                    .from("profiles")
                    .select("id, display_name, avatar_url, headline, role, start_date")
                    .eq("cohort", profile.cohort)
                    .neq("id", user.id)
                    .limit(5);
                
                if (otherMembers) setMembers(otherMembers);
            }
            setLoading(false);
        };

        fetchCohortMembers();
    }, [supabase]);

    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-4">Trending</h2>
                <div className="space-y-3">
                    <TrendingTopic tag="#NextJS" posts="120" />
                    <TrendingTopic tag="#Supabase" posts="89" />
                    <TrendingTopic tag="#Cohort8" posts="45" />
                </div>
            </div>

            <div>
                <h2 className="text-sm font-medium tracking-wide text-foreground uppercase mb-4">Cohort Members</h2>
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-xs text-muted">Loading...</div>
                    ) : members.length === 0 ? (
                        <div className="text-xs text-muted">No other members in your cohort yet.</div>
                    ) : (
                        members.map(member => {
                            const cohortStr = member.start_date ? `${new Date(member.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Cohort";
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

function TrendingTopic({ tag, posts }: { tag: string; posts: string | number }) {
    return (
        <div className="flex justify-between items-center cursor-pointer group">
            <span className="text-sm text-muted group-hover:text-foreground transition-colors">{tag}</span>
            <span className="text-xs text-[#555]">{posts}</span>
        </div>
    );
}

function CohortMember({ id, name, focus, avatar }: { id: string, name: string; focus: string, avatar?: string }) {
    return (
        <Link href={`/profile/${id}`} className="flex items-center justify-between group cursor-pointer">
            <div className="flex gap-3 items-center">
                {avatar ? (
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-[#333]" />
                ) : (
                    <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-[10px] font-bold">
                        {name.charAt(0)}
                    </div>
                )}
                <div>
                    <div className="text-sm font-medium text-foreground group-hover:underline">{name}</div>
                    <div className="text-[11px] text-muted line-clamp-1">{focus}</div>
                </div>
            </div>
        </Link>
    );
}
