"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReputation } from "@/components/reputation-provider";
import { RichEditor } from "@/components/rich-editor";

export function CreatePost({ user }: { user: any }) {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [postText, setPostText] = useState("");
    const [lastClick, setLastClick] = useState({ x: 0, y: 0 });

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
        <div className="mb-8">
            <form onSubmit={handlePost}>
                <RichEditor
                    content={postText}
                    onChange={setPostText}
                    placeholder="What's on your mind?"
                    disabled={!user}
                />

                <div className="flex justify-between items-center mt-3">
                    <div className="text-muted text-[10px] uppercase tracking-widest px-1">
                        {user ? "" : "Log in to post"}
                    </div>
                    <button
                        type="submit"
                        onClick={(e) => setLastClick({ x: e.clientX, y: e.clientY })}
                        className="btn btn-primary px-6 py-2 text-sm shadow-lg shadow-primary/20"
                        disabled={!postText.trim() || !user}
                    >
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
}
