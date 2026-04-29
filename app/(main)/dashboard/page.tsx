"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CreatePost } from "@/components/feed/create-post";
import { Post } from "@/components/feed/post";
import { FeedSidebar } from "@/components/feed/feed-sidebar";

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [posts, setPosts] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndCheckOnboarding = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("is_onboarded")
                    .eq("id", user.id)
                    .single();

                if (!profile?.is_onboarded) {
                    router.push("/onboarding");
                }
            }
        };

        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from("posts")
                .select(`
          id,
          content,
          created_at,
          user_id,
          type,
          metadata,
          profiles ( display_name, start_date, avatar_url ),
          comments ( id, content, created_at, user_id, profiles(display_name, start_date, avatar_url) ),
          reactions ( id, reaction_type, user_id )
        `)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setPosts(data);
            }
            setLoading(false);
        };

        fetchUserAndCheckOnboarding();
        fetchPosts();

        const channel = supabase
            .channel("public_changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "posts" },
                (payload) => {
                    const newId = (payload.new as any)?.id;
                    const oldId = (payload.old as any)?.id;
                    if (newId || oldId) verifyAndPrependPost(newId || oldId);
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "comments" },
                (payload) => {
                    const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                    if (postId) verifyAndPrependPost(postId);
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "reactions" },
                (payload) => {
                    const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
                    if (postId) verifyAndPrependPost(postId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router]);

    const verifyAndPrependPost = async (postId: string) => {
        if (!postId) return;
        const { data } = await supabase
            .from("posts")
            .select(`
        id,
        content,
        created_at,
        user_id,
        type,
        metadata,
        profiles ( display_name, start_date, avatar_url ),
        comments ( id, content, created_at, user_id, profiles(display_name, start_date, avatar_url) ),
        reactions ( id, reaction_type, user_id )
      `)
            .eq("id", postId)
            .single();

        if (data) {
            setPosts((currentPosts) => {
                if (currentPosts.some(p => p.id === data.id)) {
                    return currentPosts.map(p => p.id === data.id ? data : p);
                }
                return [data, ...currentPosts];
            });
        } else {
            setPosts((currentPosts) => currentPosts.filter(p => p.id !== postId));
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-57px)] md:h-screen overflow-hidden">
            <div className="flex flex-1 flex-row justify-center w-full max-w-[1400px] mx-auto overflow-hidden">

                {/* Main Feed Column */}
                <div className="flex-1 h-full overflow-y-auto custom-scrollbar py-10 px-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="border-b border-border pb-4 mb-6">
                            <h1 className="text-3xl font-medium tracking-tight">The Mix</h1>
                            <p className="text-muted text-sm mt-1">Share updates, find support, and connect with peers.</p>
                        </div>

                        <CreatePost user={user} />

                        <div className="space-y-6 pb-20">
                            {loading ? (
                                <div className="space-y-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-2xl animate-pulse shadow-xl">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-white/5" />
                                                <div className="space-y-2.5">
                                                    <div className="h-3.5 w-32 bg-white/5 rounded-lg" />
                                                    <div className="h-2 w-24 bg-white/5 rounded-lg opacity-50" />
                                                </div>
                                            </div>
                                            <div className="space-y-3.5 mb-8">
                                                <div className="h-4 w-full bg-white/5 rounded-lg" />
                                                <div className="h-4 w-[92%] bg-white/5 rounded-lg" />
                                                <div className="h-4 w-[45%] bg-white/5 rounded-lg" />
                                            </div>
                                            <div className="pt-5 border-t border-white/5 flex gap-8">
                                                <div className="h-3.5 w-16 bg-white/5 rounded-lg" />
                                                <div className="h-3.5 w-20 bg-white/5 rounded-lg" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-muted text-sm text-center py-10 border border-border rounded">No posts yet. Be the first!</div>
                            ) : (
                                posts.map((post) => (
                                    <Post key={post.id} post={post} user={user} onRefresh={() => verifyAndPrependPost(post.id)} />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="hidden lg:block w-80 h-full overflow-y-auto custom-scrollbar py-10 px-6 border-l border-white/5">
                    <FeedSidebar />
                </div>

            </div>
        </div>
    );
}
