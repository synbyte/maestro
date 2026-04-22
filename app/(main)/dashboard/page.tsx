"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REACTION_TYPES = [
    { emoji: "🔥", label: "Brilliant", value: "brilliant" },
    { emoji: "💡", label: "Insightful", value: "insightful" },
    { emoji: "🤝", label: "Helpful", value: "helpful" },
    { emoji: "👏", label: "Congrats", value: "congrats" }
];

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [postText, setPostText] = useState("");
    const [posts, setPosts] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [reactionPickers, setReactionPickers] = useState<Record<string, boolean>>({});

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
          profiles ( display_name, cohort, avatar_url ),
          comments ( id, content, created_at, profiles(display_name, avatar_url) ),
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
                    verifyAndPrependPost(payload.new.id || payload.old.id);
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "comments" },
                (payload) => {
                    if (payload.new?.post_id) verifyAndPrependPost(payload.new.post_id);
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "reactions" },
                (payload) => {
                    if (payload.new?.post_id) verifyAndPrependPost(payload.new.post_id);
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
        profiles ( display_name, cohort, avatar_url ),
        comments ( id, content, created_at, profiles(display_name, avatar_url) ),
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
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postText.trim() || !user) return;

        const { error } = await supabase
            .from("posts")
            .insert({
                user_id: user.id,
                content: postText,
            });

        if (error) {
            alert("Error creating post: " + error.message);
        } else {
            setPostText("");
        }
    };

    const handleReact = async (postId: string, reactionType: string) => {
        if (!user) return;
        setReactionPickers(prev => ({ ...prev, [postId]: false }));

        // Check if user already reacted with this type
        const post = posts.find(p => p.id === postId);
        const existing = post?.reactions?.find((r: any) => r.user_id === user.id && r.reaction_type === reactionType);

        if (existing) {
            // Remove reaction
            await supabase.from("reactions").delete().eq("id", existing.id);
        } else {
            // Add reaction
            await supabase.from("reactions").insert({
                post_id: postId,
                user_id: user.id,
                reaction_type: reactionType
            });
        }
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!user) return;
        const content = commentInputs[postId];
        if (!content?.trim()) return;

        const { error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                user_id: user.id,
                content
            });

        if (!error) {
            setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        } else {
            alert("Error posting comment: " + error.message);
        }
    };

    const renderReactions = (reactions: any[]) => {
        if (!reactions || reactions.length === 0) return null;

        // Group reactions by type
        const grouped = reactions.reduce((acc: any, r: any) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
            return acc;
        }, {});

        return (
            <div className="flex gap-2">
                {Object.entries(grouped).map(([type, count]) => {
                    const emoji = REACTION_TYPES.find(t => t.value === type)?.emoji;
                    return emoji ? (
                        <span key={type} className="bg-[#222] px-2 py-0.5 rounded text-xs">
                            {emoji} {count as number}
                        </span>
                    ) : null;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-1 flex-col items-center py-10 px-6">
            <div className="w-full max-w-3xl flex flex-col md:flex-row gap-8">

                {/* Main Feed Column */}
                <div className="flex-1 space-y-6">
                    <div className="border-b border-border pb-4 mb-6">
                        <h1 className="text-3xl font-medium tracking-tight">The Quad</h1>
                        <p className="text-muted text-sm mt-1">Share updates, ask for reviews, and celebrate wins.</p>
                    </div>

                    {/* Create Post Box */}
                    <div className="bg-[#1a1a1a] border border-border p-4 rounded text-foreground mb-8">
                        <form onSubmit={handlePost}>
                            <textarea
                                className="w-full bg-transparent border-none resize-none focus:outline-none placeholder:text-muted min-h-[80px] text-sm"
                                placeholder="What are you building today?"
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                disabled={!user}
                            />
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                <div className="text-muted text-xs">
                                    {user ? "Supports markdown" : "Log in to post"}
                                </div>
                                <button type="submit" className="btn btn-primary px-4 py-1.5 text-sm" disabled={!postText.trim() || !user}>
                                    Post
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-muted text-sm text-center py-10">Loading posts...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-muted text-sm text-center py-10 border border-border rounded">No posts yet. Be the first!</div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="bg-transparent border border-border p-5 rounded">
                                    <div className="flex justify-between mb-3">
                                        <div className="flex gap-3 items-center">
                                            {post.profiles?.avatar_url ? (
                                                <img src={post.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#333] flex-shrink-0" />
                                            )}
                                            <div>
                                                <div className="font-medium text-sm text-foreground">{post.profiles?.display_name || "Unknown"}</div>
                                                <div className="text-xs text-muted block md:inline">{post.profiles?.cohort || "Cohort"} • {new Date(post.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-foreground text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                                        {post.content}
                                    </p>

                                    {/* Reaction Bar display */}
                                    <div className="mb-3">
                                        {renderReactions(post.reactions)}
                                    </div>

                                    <div className="flex gap-4 text-xs text-muted border-t border-border pt-3 relative">
                                        <button
                                            onClick={() => setReactionPickers(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                            className="font-medium hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                                        >
                                            React
                                        </button>

                                        {/* Reaction Picker Popover */}
                                        {reactionPickers[post.id] && (
                                            <div className="absolute top-10 left-0 bg-[#222] border border-[#444] rounded p-2 flex gap-2 z-10 shadow-lg animate-fade-in">
                                                {REACTION_TYPES.map(rt => (
                                                    <button
                                                        key={rt.value}
                                                        onClick={() => handleReact(post.id, rt.value)}
                                                        className="hover:bg-[#333] p-1.5 rounded transition-colors text-base"
                                                        title={rt.label}
                                                    >
                                                        {rt.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                            className="font-medium hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                                        >
                                            Comment ({post.comments?.length || 0})
                                        </button>
                                    </div>

                                    {expandedComments[post.id] && (
                                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                                            {/* Comments list */}
                                            {post.comments?.map((comment: any) => (
                                                <div key={comment.id} className="flex gap-2 items-start text-sm bg-[#1a1a1a] p-3 rounded">
                                                    {comment.profiles?.avatar_url ? (
                                                        <img src={comment.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-[#333] flex-shrink-0" />
                                                    )}
                                                    <div>
                                                        <span className="font-semibold text-foreground text-xs block mb-0.5">{comment.profiles?.display_name || "Unknown"}</span>
                                                        <span className="text-muted leading-relaxed">{comment.content}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Comment Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    className="input-field text-sm py-1.5 px-3"
                                                    placeholder="Write a comment..."
                                                    value={commentInputs[post.id] || ""}
                                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                />
                                                <button
                                                    onClick={() => handleCommentSubmit(post.id)}
                                                    className="btn btn-secondary text-xs px-3 py-1.5"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar */}
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
                        <div className="space-y-3">
                            <CohortMember name="Alex Rivera" focus="AI Research" />
                            <CohortMember name="Emma Watson" focus="Frontend" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function TrendingTopic({ tag, posts }: any) {
    return (
        <div className="flex justify-between items-center cursor-pointer group">
            <span className="text-sm text-muted group-hover:text-foreground transition-colors">{tag}</span>
            <span className="text-xs text-[#555]">{posts}</span>
        </div>
    );
}

function CohortMember({ name, focus }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded bg-[#333]" />
                <div>
                    <div className="text-sm text-foreground">{name}</div>
                    <div className="text-xs text-muted">{focus}</div>
                </div>
            </div>
        </div>
    );
}
