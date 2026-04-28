"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Comment } from "./comment";
import { Code, Bold, Italic, Heading, List, Quote } from "lucide-react";
import { useReputation } from "@/components/reputation-provider";

export function CommentSection({ postId, comments, user, onRefresh }: { postId: string, comments: any[], user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [commentInput, setCommentInput] = useState("");

    const applyMarkdown = (prefix: string, suffix: string = "") => {
        setCommentInput(prev => {
            const hasNewline = prev.endsWith("\n") || !prev;
            const start = hasNewline ? "" : "\n";
            return prev + start + prefix + "Text" + suffix + "\n";
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            setCommentInput(value.substring(0, start) + "\t" + value.substring(end));
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 1;
            }, 0);
        }
    };

    const handleCommentSubmit = async (e: React.MouseEvent) => {
        if (!user || !commentInput.trim()) return;

        const { error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                user_id: user.id,
                content: commentInput
            });

        if (!error) {
            // Trigger visual feedback
            triggerRepPop(e.clientX, e.clientY, 5);

            // Award reputation (5 pts)
            await supabase.rpc('increment_reputation', { 
                profile_id: user.id, 
                amount: 5,
                reason: 'for sharing your thoughts! 💬'
            });
            setCommentInput("");
            if (onRefresh) onRefresh();
        } else {
            alert("Error posting comment: " + error.message);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
            {comments?.map((comment: any) => (
                <Comment key={comment.id} comment={comment} user={user} onRefresh={onRefresh} />
            ))}

            <div className="flex flex-col gap-2 bg-[#1a1a1a] p-3 rounded border border-border mt-3">
                <textarea
                    className="w-full bg-transparent border-none resize-none focus:outline-none placeholder:text-muted min-h-[60px] text-sm"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
                <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => applyMarkdown("### ")}
                            className="p-1 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Heading"
                            disabled={!user}
                        >
                            <Heading size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("**", "**")}
                            className="p-1 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Bold"
                            disabled={!user}
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("*", "*")}
                            className="p-1 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Italic"
                            disabled={!user}
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("- ")}
                            className="p-1 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="List"
                            disabled={!user}
                        >
                            <List size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("> ")}
                            className="p-1 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Quote"
                            disabled={!user}
                        >
                            <Quote size={16} />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setCommentInput(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + "```\n// Code here\n```\n")} 
                            className="p-1.5 text-muted hover:text-foreground transition-colors rounded hover:bg-[#333]" 
                            title="Format as Code Block"
                            disabled={!user}
                        >
                            <Code size={16} />
                        </button>
                    </div>
                    <button
                        onClick={(e) => handleCommentSubmit(e)}
                        className="btn btn-secondary text-xs px-3 py-1.5"
                        disabled={!user || !commentInput.trim()}
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
}
