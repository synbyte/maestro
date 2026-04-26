"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CreatePost({ user }: { user: any }) {
    const supabase = createClient();
    const [postText, setPostText] = useState("");

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

    return (
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
    );
}
