"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
    userId: string;
    url: string | null;
    onUpload: (url: string) => void;
}

export default function AvatarUpload({ userId, url, onUpload }: AvatarUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${userId}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
            onUpload(data.publicUrl);
        } catch (error: any) {
            alert("Error uploading avatar: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {url ? (
                <img
                    src={url}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover bg-[#333]"
                />
            ) : (
                <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center text-xs text-muted">
                    No pic
                </div>
            )}
            <div>
                <label className="btn btn-secondary text-sm px-4 py-2 cursor-pointer inline-block">
                    {uploading ? "Uploading..." : "Upload from Device / Camera"}
                    <input
                        type="file"
                        id="single"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
                <p className="text-xs text-muted mt-2">Takes a picture or uploads an image</p>
            </div>
        </div>
    );
}
