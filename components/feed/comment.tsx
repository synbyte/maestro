"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";

export function Comment({ comment, user, onRefresh }: { comment: any, user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    
    // Check if text is long enough to warrant a show more button
    const isLongText = comment.content?.length > 150;

    const handleEditSave = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }
        await supabase.from("comments").update({ content: editContent }).eq("id", comment.id);
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

    const handleDeleteComment = async () => {
        if (!user || user.id !== comment.user_id) return;
        if (confirm("Are you sure you want to delete this comment?")) {
            await supabase.from("comments").delete().eq("id", comment.id);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <div className="flex gap-2 items-start text-sm bg-[#1a1a1a] p-3 rounded group/comment">
            <Link href={`/profile/${comment.user_id}`} className="shrink-0 block">
                <UserAvatar 
                    userId={comment.user_id} 
                    src={comment.profiles?.avatar_url} 
                    name={comment.profiles?.display_name}
                    size="sm"
                />
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <Link href={`/profile/${comment.user_id}`} className="font-semibold text-foreground text-xs block mb-0.5 hover:underline">
                        {comment.profiles?.display_name || "Unknown"}
                    </Link>
                    {user?.id === comment.user_id && (
                        <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                            <button 
                                onClick={() => {
                                    setIsEditing(!isEditing);
                                    setEditContent(comment.content);
                                }} 
                                className="text-xs text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                                title="Edit Comment"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={handleDeleteComment} 
                                className="text-sm text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                                title="Delete Comment"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
                {isEditing ? (
                    <div className="mt-1">
                        <textarea
                            className="w-full bg-[#121212] border border-[#333] rounded p-2 text-xs focus:outline-none placeholder:text-muted min-h-[60px]"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex justify-end gap-2 mt-1">
                            <button onClick={() => setIsEditing(false)} className="text-[10px] text-muted hover:text-foreground">Cancel</button>
                            <button onClick={handleEditSave} className="btn btn-primary text-[10px] px-2 py-1">Save</button>
                        </div>
                    </div>
                ) : (
                    <div className={`text-muted leading-relaxed prose prose-invert prose-sm max-w-none prose-p:leading-relaxed markdown-body ${!isExpanded ? "line-clamp-4" : ""}`}>
                        <ReactMarkdown>{comment.content}</ReactMarkdown>
                    </div>
                )}
                {isLongText && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="text-xs font-semibold mt-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isExpanded ? "Show less" : "... show more"}
                    </button>
                )}
            </div>
        </div>
    );
}
