"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Code, Bold, Italic, Heading, List, Quote } from "lucide-react";
import { useReputation } from "@/components/reputation-provider";

export function CreatePost({ user }: { user: any }) {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [postText, setPostText] = useState("");
    const [lastClick, setLastClick] = useState({ x: 0, y: 0 });

    const applyMarkdown = (prefix: string, suffix: string = "") => {
        setPostText(prev => {
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
            setPostText(value.substring(0, start) + "\t" + value.substring(end));
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 1;
            }, 0);
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
            // Trigger visual feedback
            if (lastClick.x !== 0) {
                triggerRepPop(lastClick.x, lastClick.y, 10);
            }

            // Award reputation (10 pts)
            await supabase.rpc('increment_reputation', {
                profile_id: user.id,
                amount: 10,
                reason: 'for sharing a new post in the Quad! 🚀'
            });
            setPostText("");
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-border p-4 rounded text-foreground mb-8">
            <form onSubmit={handlePost}>
                <textarea
                    className="w-full bg-transparent border-none resize-none focus:outline-none placeholder:text-muted min-h-[80px] text-sm"
                    placeholder="What's on your mind?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-muted text-xs">
                        <button
                            type="button"
                            onClick={() => applyMarkdown("### ")}
                            className="p-1 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Heading"
                            disabled={!user}
                        >
                            <Heading size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("**", "**")}
                            className="p-1 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Bold"
                            disabled={!user}
                        >
                            <Bold size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("*", "*")}
                            className="p-1 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Italic"
                            disabled={!user}
                        >
                            <Italic size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("- ")}
                            className="p-1 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="List"
                            disabled={!user}
                        >
                            <List size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMarkdown("> ")}
                            className="p-1 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Quote"
                            disabled={!user}
                        >
                            <Quote size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPostText(prev => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + "```\n// Code here\n```\n")}
                            className="p-1.5 hover:text-foreground transition-colors rounded hover:bg-[#333]"
                            title="Format as Code Block"
                            disabled={!user}
                        >
                            <Code size={16} />
                        </button>
                        <span>
                            {user ? "Supports markdown" : "Log in to post"}
                        </span>
                    </div>
                    <button 
                        type="submit" 
                        onClick={(e) => setLastClick({ x: e.clientX, y: e.clientY })}
                        className="btn btn-primary px-4 py-1.5 text-sm" 
                        disabled={!postText.trim() || !user}
                    >
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
}
