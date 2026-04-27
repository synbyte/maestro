"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BannerUploadProps {
    userId: string;
    url: string | null;
    onUpload: (url: string) => void;
}

export default function BannerUpload({ userId, url, onUpload }: BannerUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);

    const uploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `banner-${userId}-${Math.random()}.${fileExt}`;

            // We reuse the "avatars" bucket since it is already configured for public access
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
            onUpload(data.publicUrl);
        } catch (error: any) {
            alert("Error uploading banner: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="w-full h-32 bg-[#1a1a1a] rounded overflow-hidden relative border border-border">
                {url ? (
                    <img
                        src={url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                        No banner uploaded
                    </div>
                )}
            </div>
            <div>
                <label className="btn btn-secondary text-sm px-4 py-2 cursor-pointer inline-block">
                    {uploading ? "Uploading..." : "Upload Banner Image"}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={uploadBanner}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
                <p className="text-xs text-muted mt-2">Recommended size: 1500x500px</p>
            </div>
        </div>
    );
}
