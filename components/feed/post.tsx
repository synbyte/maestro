"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Reactions } from "./reactions";
import { CommentSection } from "./comment-section";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

const REACTION_TYPES = [
    { emoji: "🔥", label: "Brilliant", value: "brilliant" },
    { emoji: "💡", label: "Insightful", value: "insightful" },
    { emoji: "🤝", label: "Helpful", value: "helpful" },
    { emoji: "👏", label: "Congrats", value: "congrats" }
];

export function Post({ post, user, onRefresh }: { post: any, user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const [expandedComments, setExpandedComments] = useState(false);
    const [reactionPicker, setReactionPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    const handleEditSave = async () => {
        if (!editContent.trim() || editContent === post.content) {
            setIsEditing(false);
            return;
        }
        await supabase.from("posts").update({ content: editContent }).eq("id", post.id);
        setIsEditing(false);
        if (onRefresh) onRefresh();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            setEditContent(value.substring(0, start) + "\t" + value.substring(end));
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 1;
            }, 0);
        }
    };

    const handleReact = async (reactionType: string) => {
        if (!user) return;
        setReactionPicker(false);

        const existing = post?.reactions?.find((r: any) => r.user_id === user.id && r.reaction_type === reactionType);

        if (existing) {
            await supabase.from("reactions").delete().eq("id", existing.id);
            if (onRefresh) onRefresh();
        } else {
            await supabase.from("reactions").insert({
                post_id: post.id,
                user_id: user.id,
                reaction_type: reactionType
            });
            if (onRefresh) onRefresh();
        }
    };

    const handleDeletePost = async () => {
        if (!user || user.id !== post.user_id) return;
        if (confirm("Are you sure you want to delete this post?")) {
            await supabase.from("posts").delete().eq("id", post.id);
            // Deletion triggers realtime, but it might not have the id since it's deleted.
            // But we already updated verifyAndPrependPost to handle null data.
            // Also our dashboard/page.tsx listens for DELETE and tries to call verifyAndPrependPost,
            // but payload.new.id is missing. Let's just manually call onRefresh, which will delete it from state.
            if (onRefresh) onRefresh();
        }
    };

    return (
        <div className="bg-transparent border border-border p-5 rounded group/post relative">
            <div className="flex justify-between mb-3">
                <div className="flex gap-3 items-center">
                    <Link href={`/profile/${post.user_id}`} className="shrink-0 block">
                        {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#333] flex-shrink-0" />
                        )}
                    </Link>
                    <div>
                        <Link href={`/profile/${post.user_id}`} className="font-medium text-sm text-foreground hover:underline block">
                            {post.profiles?.display_name || "Unknown"}
                        </Link>
                        <div className="text-xs text-muted block md:inline">
                            {post.profiles?.start_date ? `${new Date(post.profiles.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Cohort"} • {new Date(post.created_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                    </div>
                </div>
                {user?.id === post.user_id && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/post:opacity-100 transition-opacity">
                        <button 
                            onClick={() => {
                                setIsEditing(!isEditing);
                                setEditContent(post.content);
                            }} 
                            className="text-sm text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                            title="Edit Post"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={handleDeletePost} 
                            className="text-lg text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                            title="Delete Post"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mb-3">
                    <textarea
                        className="w-full bg-[#1a1a1a] border border-border rounded p-3 text-sm focus:outline-none placeholder:text-muted min-h-[100px]"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-muted hover:text-foreground">Cancel</button>
                        <button onClick={handleEditSave} className="btn btn-primary text-xs px-3 py-1.5">Save</button>
                    </div>
                </div>
            ) : (
                <div className="text-foreground text-sm leading-relaxed mb-3 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed markdown-body">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
            )}

            <div className="mb-3">
                <Reactions reactions={post.reactions} currentUser={user} onToggleReaction={handleReact} />
            </div>

            <div className="flex gap-4 text-xs text-muted border-t border-border pt-3 relative">
                <button
                    onClick={() => setReactionPicker(!reactionPicker)}
                    className="font-medium hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                >
                    React
                </button>

                {reactionPicker && (
                    <>
                        <div 
                            className="fixed inset-0 z-0" 
                            onClick={() => setReactionPicker(false)} 
                        />
                        <div className="absolute top-10 left-0 bg-[#222] border border-[#444] rounded p-2 flex gap-2 z-10 shadow-lg animate-fade-in">
                            {REACTION_TYPES.map(rt => (
                                <button
                                    key={rt.value}
                                    onClick={() => handleReact(rt.value)}
                                    className="hover:bg-[#333] p-1.5 rounded transition-colors text-base relative z-10"
                                    title={rt.label}
                                >
                                    {rt.emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <button
                    onClick={() => setExpandedComments(!expandedComments)}
                    className="font-medium hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                >
                    Comment ({post.comments?.length || 0})
                </button>
            </div>

            <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    expandedComments ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <CommentSection postId={post.id} comments={post.comments} user={user} onRefresh={onRefresh} />
                </div>
            </div>
        </div>
    );
}
