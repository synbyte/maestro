"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function Comment({ comment, user, onRefresh }: { comment: any, user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Check if text is long enough to warrant a show more button
    const isLongText = comment.content?.length > 150;

    const handleDeleteComment = async () => {
        if (!user || user.id !== comment.user_id) return;
        if (confirm("Are you sure you want to delete this comment?")) {
            await supabase.from("comments").delete().eq("id", comment.id);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <div className="flex gap-2 items-start text-sm bg-[#1a1a1a] p-3 rounded group/comment">
            {comment.profiles?.avatar_url ? (
                <img src={comment.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className="w-6 h-6 rounded-full bg-[#333] flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <span className="font-semibold text-foreground text-xs block mb-0.5">{comment.profiles?.display_name || "Unknown"}</span>
                    {user?.id === comment.user_id && (
                        <button 
                            onClick={handleDeleteComment} 
                            className="text-sm text-muted hover:text-foreground transition-colors opacity-0 group-hover/comment:opacity-100 bg-transparent border-none cursor-pointer"
                            title="Delete Comment"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <div className={`text-muted leading-relaxed ${!isExpanded ? "line-clamp-4" : ""}`}>
                    {comment.content}
                </div>
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
