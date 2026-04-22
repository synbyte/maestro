"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/avatar-upload";

export default function Onboarding() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bio, setBio] = useState("");
    const [startDate, setStartDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }
            setUser(user);

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) {
                if (data.is_onboarded) {
                    router.push("/dashboard");
                }
                if (data.display_name) setDisplayName(data.display_name);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
                if (data.bio) setBio(data.bio);
                if (data.start_date) setStartDate(data.start_date);
            }
        };
        fetchUser();
    }, [router, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        setError(null);

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                avatar_url: avatarUrl,
                bio,
                start_date: startDate,
                is_onboarded: true,
            })
            .eq("id", user.id);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-md justify-center px-6 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-medium tracking-tight mb-2">Set up your profile</h1>
                <p className="text-muted text-sm">Tell your cohort a bit about yourself.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-sm rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5 border border-border p-4 rounded">
                    <label className="text-sm font-medium text-muted block mb-3">
                        Profile Picture
                    </label>
                    <AvatarUpload
                        userId={user.id}
                        url={avatarUrl}
                        onUpload={(url) => setAvatarUrl(url)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block" htmlFor="displayName">
                        Full Name
                    </label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="input-field"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block" htmlFor="startDate">
                        Start Date
                    </label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-field"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted block" htmlFor="bio">
                        About Me
                    </label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input-field min-h-[100px] resize-none"
                        placeholder="What are you hoping to learn?"
                        required
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full mt-4"
                    disabled={isLoading || !displayName || !startDate}
                >
                    {isLoading ? "Saving..." : "Complete Setup"}
                </button>
            </form>
        </div>
    );
}
