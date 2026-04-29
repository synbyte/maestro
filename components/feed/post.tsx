"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Reactions } from "./reactions";
import { CommentSection } from "./comment-section";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { UserInfo } from "@/components/user-info";
import { 
    Rocket, 
    Calendar, 
    MapPin, 
    ExternalLink, 
    Award, 
    Globe, 
    MessageSquare, 
    Smile, 
    MoreHorizontal, 
    Trash2, 
    Pencil,
    Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReputation } from "@/components/reputation-provider";
import { useEffect, useRef } from "react";

const REACTION_TYPES = [
    { emoji: "🔥", label: "Brilliant", value: "brilliant" },
    { emoji: "❤️", label: "Heart", value: "heart" },
    { emoji: "💡", label: "Insightful", value: "insightful" },
    { emoji: "🤝", label: "Helpful", value: "helpful" },
    { emoji: "👏", label: "Congrats", value: "congrats" },
    { emoji: "😂", label: "Haha", value: "haha" },
    { emoji: "😮", label: "Wow", value: "wow" },
    { emoji: "👍", label: "Like", value: "like" }
];

export function Post({ post, user, onRefresh }: { post: any, user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [expandedComments, setExpandedComments] = useState(false);
    const [reactionPicker, setReactionPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!reactionPicker) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setReactionPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [reactionPicker]);

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

    const handleReact = async (reactionType: string, e?: React.MouseEvent) => {
        if (!user) return;
        setReactionPicker(false);

        const existing = post?.reactions?.find((r: any) => r.user_id === user.id && r.reaction_type === reactionType);

        if (existing) {
            await supabase.from("reactions").delete().eq("id", existing.id);
            if (onRefresh) onRefresh();
        } else {
            // Trigger visual feedback if we have event data
            if (e) {
                triggerRepPop(e.clientX, e.clientY, 10);
            }

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
        <div className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 p-6 rounded-2xl group/post relative transition-all duration-300 hover:bg-[#1a1a1a]/60 hover:border-white/10 hover:shadow-2xl hover:shadow-black/20">
            <div className="flex justify-between items-start mb-5">
                <UserInfo
                    userId={post.user_id}
                    avatarUrl={post.profiles?.avatar_url}
                    displayName={post.profiles?.display_name}
                    startDate={post.profiles?.start_date}
                    timestamp={post.created_at}
                    size="md"
                />
                
                <div className="flex items-center gap-1 opacity-0 group-hover/post:opacity-100 transition-all duration-200">
                    {user?.id === post.user_id && (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(!isEditing);
                                    setEditContent(post.content);
                                }}
                                className="p-2 text-muted hover:text-foreground hover:bg-white/5 rounded-full transition-all"
                                title="Edit Post"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={handleDeletePost}
                                className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                title="Delete Post"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
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
            ) : post.type === 'onboarding_milestone' ? (
                <div className="mb-4 mt-2">
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-emerald-500/20 rounded-xl p-6 shadow-2xl relative overflow-hidden group/onboarding">
                        {/* Background Decoration */}
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover/onboarding:bg-emerald-500/20 transition-colors duration-500" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Globe size={18} className="text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">New Member Joined</span>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-3">
                                Say hello to {post.profiles?.display_name || "a new member"}! 👋
                            </h3>
                            
                            <div className="text-sm text-[#aaaaa5] mb-5 leading-relaxed">
                                <ReactMarkdown>{post.content}</ReactMarkdown>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-muted-foreground">
                                    <Rocket size={12} className="text-emerald-400" />
                                    <span>{post.metadata?.course_name}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-muted-foreground">
                                    <Calendar size={12} className="text-emerald-400" />
                                    <span>Week {post.metadata?.week_number}</span>
                                </div>
                            </div>
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
                <div className="text-[#ecebe4] text-[15px] leading-relaxed mb-6 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed markdown-body">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>
            )}

            <div className="mb-4">
                <Reactions reactions={post.reactions} currentUser={user} onToggleReaction={handleReact} />
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setReactionPicker(!reactionPicker);
                        }}
                        className={`flex items-center gap-2 text-xs font-medium transition-all ${reactionPicker ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                    >
                        <Smile size={16} />
                        <span>React</span>
                    </button>

                    <AnimatePresence>
                        {reactionPicker && (
                            <motion.div 
                                ref={pickerRef}
                                initial={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute bottom-full left-0 mb-3 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex gap-1 z-[100] shadow-2xl backdrop-blur-xl"
                            >
                                {REACTION_TYPES.map(rt => (
                                    <button
                                        key={rt.value}
                                        onClick={(e) => handleReact(rt.value, e)}
                                        className="hover:bg-white/5 p-2 rounded-xl transition-all flex flex-col items-center gap-1 group/btn"
                                        title={rt.label}
                                    >
                                        <span className="text-lg group-hover/btn:scale-125 transition-transform duration-200">{rt.emoji}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => setExpandedComments(!expandedComments)}
                    className={`flex items-center gap-2 text-xs font-medium transition-all ${expandedComments ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                >
                    <MessageSquare size={16} />
                    <span>{post.comments?.length || 0} Comments</span>
                </button>

                <button className="flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-all ml-auto">
                    <Share2 size={16} />
                    <span>Share</span>
                </button>
            </div>

            <AnimatePresence>
                {expandedComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                        animate={{ 
                            height: expandedComments ? "auto" : 0, 
                            opacity: expandedComments ? 1 : 0,
                            overflow: expandedComments ? "visible" : "hidden",
                            transition: {
                                height: {
                                    duration: 0.4,
                                    ease: [0.04, 0.62, 0.23, 0.98]
                                },
                                opacity: {
                                    duration: 0.25,
                                    delay: 0.05
                                }
                            }
                        }}
                        exit={{ 
                            height: 0, 
                            opacity: 0,
                            overflow: "hidden",
                            transition: {
                                height: {
                                    duration: 0.3
                                },
                                opacity: {
                                    duration: 0.2
                                }
                            }
                        }}
                        style={{ transformOrigin: "top" }}
                    >
                        <div className="overflow-visible">
                            <CommentSection postId={post.id} comments={post.comments} user={user} onRefresh={onRefresh} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
