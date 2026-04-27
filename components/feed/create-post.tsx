"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Code } from "lucide-react";

export function CreatePost({ user }: { user: any }) {
    const supabase = createClient();
    const [postText, setPostText] = useState("");

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
            // Award reputation (50 pts)
            await supabase.rpc('increment_reputation', { 
                profile_id: user.id, 
                amount: 50 
            });
            setPostText("");
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-border p-4 rounded text-foreground mb-8">
            <form onSubmit={handlePost}>
                <textarea
                    className="w-full bg-transparent border-none resize-none focus:outline-none placeholder:text-muted min-h-[80px] text-sm"
                    placeholder="What are you building today?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!user}
                />
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-muted text-xs">
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
                    <button type="submit" className="btn btn-primary px-4 py-1.5 text-sm" disabled={!postText.trim() || !user}>
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
}
