"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Reactions } from "./reactions";
import { CommentSection } from "./comment-section";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { UserInfo } from "@/components/user-info";
import { Rocket, Calendar, MapPin, ExternalLink, Award, Globe } from "lucide-react";

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
            // Award reputation (10 pts)
            await supabase.rpc('increment_reputation', { 
                profile_id: user.id, 
                amount: 10,
                reason: 'for reacting to a post! ✨'
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
                <UserInfo 
                    userId={post.user_id}
                    avatarUrl={post.profiles?.avatar_url}
                    displayName={post.profiles?.display_name}
                    startDate={post.profiles?.start_date}
                    timestamp={post.created_at}
                    size="md"
                />
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
            ) : post.type === 'project_milestone' ? (
                <div className="mb-4 mt-2">
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-accent/20 rounded-xl overflow-hidden shadow-2xl group/card">
                        <div className="p-1">
                            {post.metadata?.project_image && (
                                <div className="h-40 w-full overflow-hidden relative rounded-t-lg">
                                    <img 
                                        src={post.metadata.project_image} 
                                        alt={post.metadata.project_name}
                                        className="w-full h-full object-cover transition-transform group-hover/card:scale-105 duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                        <div className="p-1.5 bg-accent rounded-lg shadow-lg">
                                            <Rocket size={16} className="text-accent-fg" />
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">New Project Shipped</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-5 pt-4">
                            {!post.metadata?.project_image && (
                                <div className="flex items-center gap-2 mb-3">
                                    <Rocket size={18} className="text-accent" />
                                    <span className="text-xs font-bold text-accent uppercase tracking-widest">New Project Shipped</span>
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover/card:text-accent transition-colors">
                                {post.metadata?.project_name}
                            </h3>
                            {(post.metadata?.project_description || post.metadata?.description) && (
                                <div className="text-sm text-[#aaaaa5] mb-4 whitespace-pre-wrap leading-relaxed">
                                    {post.metadata.project_description || post.metadata.description}
                                </div>
                            )}
                            {post.metadata?.project_url && (
                                <a 
                                    href={post.metadata.project_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm font-medium hover:bg-accent/20 transition-all"
                                >
                                    <Globe size={16} />
                                    View Project
                                    <ExternalLink size={14} className="opacity-50" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ) : post.type === 'event_milestone' ? (
                <div className="mb-4 mt-2">
                    <div className="bg-[#1a1a1a] border border-blue-500/20 rounded-xl p-5 shadow-xl border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={16} className="text-blue-400" />
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Upcoming Event</span>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">
                                    {post.metadata?.event_title}
                                </h3>
                            </div>
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                                <Award size={24} className="text-blue-500" />
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-5">
                            <div className="flex items-center gap-3 text-sm text-muted">
                                <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center text-blue-400">
                                    <Calendar size={14} />
                                </div>
                                <span>{post.metadata?.event_date} at {post.metadata?.event_time}</span>
                            </div>
                            {post.metadata?.event_location && (
                                <div className="flex items-center gap-3 text-sm text-muted">
                                    <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center text-blue-400">
                                        <MapPin size={14} />
                                    </div>
                                    <span>{post.metadata.event_location}</span>
                                </div>
                            )}
                        </div>

                        {post.metadata?.event_description && (
                            <div className="text-xs text-[#aaaaa5] mb-5 bg-black/20 p-3 rounded-lg italic border-l-2 border-blue-500/30">
                                {post.metadata.event_description}
                            </div>
                        )}

                        <Link 
                            href="/events"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
                        >
                            <Calendar size={16} />
                            View Schedule
                        </Link>
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
