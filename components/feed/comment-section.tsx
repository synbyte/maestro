"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Comment } from "./comment";

export function CommentSection({ postId, comments, user, onRefresh }: { postId: string, comments: any[], user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const [commentInput, setCommentInput] = useState("");

    const handleCommentSubmit = async () => {
        if (!user || !commentInput.trim()) return;

        const { error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                user_id: user.id,
                content: commentInput
            });

        if (!error) {
            setCommentInput("");
        } else {
            alert("Error posting comment: " + error.message);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
            {comments?.map((comment: any) => (
                <Comment key={comment.id} comment={comment} user={user} onRefresh={onRefresh} />
            ))}

            <div className="flex gap-2">
                <input
                    className="input-field text-sm py-1.5 px-3 w-full"
                    placeholder="Write a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                />
                <button
                    onClick={handleCommentSubmit}
                    className="btn btn-secondary text-xs px-3 py-1.5"
                >
                    Reply
                </button>
            </div>
        </div>
    );
}
