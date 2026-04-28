"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Comment } from "./comment";
import { useReputation } from "@/components/reputation-provider";
import { RichEditor } from "@/components/rich-editor";

export function CommentSection({ postId, comments, user, onRefresh }: { postId: string, comments: any[], user: any, onRefresh?: () => void }) {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [commentInput, setCommentInput] = useState("");

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

            <div className="flex flex-col gap-2 mt-4">
                <RichEditor 
                    content={commentInput}
                    onChange={setCommentInput}
                    placeholder="Write a reply..."
                    disabled={!user}
                />
                <div className="flex justify-end">
                    <button
                        onClick={(e) => handleCommentSubmit(e)}
                        className="btn btn-secondary text-xs px-4 py-2"
                        disabled={!user || !commentInput.trim()}
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );
}
