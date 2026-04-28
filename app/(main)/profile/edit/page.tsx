"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/avatar-upload";
import BannerUpload from "@/components/banner-upload";
import { CourseEditor } from "@/components/course-editor";
import { ProjectEditor } from "@/components/project-editor";

export default function EditProfile() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);

    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [bio, setBio] = useState("");
    const [startDate, setStartDate] = useState("");
    const [headline, setHeadline] = useState("");
    const [location, setLocation] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");

    // Phase 3 Portfolio fields
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [techStack, setTechStack] = useState("");
    const [currentProjects, setCurrentProjects] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
                if (data.display_name) setDisplayName(data.display_name);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
                if (data.banner_url) setBannerUrl(data.banner_url);
                if (data.bio) setBio(data.bio);
                if (data.start_date) setStartDate(data.start_date);
                if (data.headline) setHeadline(data.headline);
                if (data.location) setLocation(data.location);
                if (data.website_url) setWebsiteUrl(data.website_url);

                if (data.github_url) setGithubUrl(data.github_url);
                if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
                if (data.tech_stack) setTechStack(data.tech_stack);
                if (data.current_projects) setCurrentProjects(data.current_projects);
            }
        };
        fetchUser();
    }, [router, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: displayName,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                bio,
                start_date: startDate,
                headline,
                location,
                website_url: websiteUrl,
                github_url: githubUrl,
                linkedin_url: linkedinUrl,
                tech_stack: techStack,
                current_projects: currentProjects,
                is_onboarded: true,
            })
            .eq("id", user.id);

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push(`/profile/${user.id}`);
            }, 1500);
        }
        setIsLoading(false);
    };

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-2xl py-12 px-6">
            <div className="mb-8 border-b border-border pb-4">
                <h1 className="text-3xl font-medium tracking-tight mb-2">Edit Profile & Portfolio</h1>
                <p className="text-muted text-sm">Customize your public presence on Maestro.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-sm rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-900/20 border border-green-900/50 text-green-500 text-sm rounded transition-opacity">
                        Profile saved successfully!
                    </div>
                )}

                {/* Basic Info */}
                <section className="space-y-6">
                    <h2 className="text-lg font-medium text-foreground">Basic Info</h2>

                    <div className="space-y-1.5 p-4 border border-border rounded">
                        <label className="text-sm font-medium text-muted block mb-3">
                            Profile Banner
                        </label>
                        <BannerUpload
                            userId={user.id}
                            url={bannerUrl}
                            onUpload={(url) => setBannerUrl(url)}
                        />
                    </div>

                    <div className="space-y-1.5 p-4 border border-border rounded">
                        <label className="text-sm font-medium text-muted block mb-3">
                            Profile Picture
                        </label>
                        <AvatarUpload
                            userId={user.id}
                            url={avatarUrl}
                            onUpload={(url) => setAvatarUrl(url)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <label className="text-sm font-medium text-muted block" htmlFor="headline">
                                Headline
                            </label>
                            <input
                                id="headline"
                                type="text"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                className="input-field"
                                placeholder="e.g. AI Engineering Student · Cohort 8"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="location">
                                Location
                            </label>
                            <input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="input-field"
                                placeholder="e.g. San Francisco, CA"
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
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="bio">
                            About Me (Bio)
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
                </section>

                {/* Courses Section */}
                <section className="space-y-6 pt-6 border-t border-border">
                    <h2 className="text-lg font-medium text-foreground">Enrolled Courses</h2>
                    <p className="text-sm text-muted -mt-4 mb-4">Track your course progress and display completions on your profile.</p>
                    <CourseEditor userId={user.id} />
                </section>

                {/* Portfolio Section */}
                <section className="space-y-6 pt-6 border-t border-border">
                    <h2 className="text-lg font-medium text-foreground">Portfolio Projects</h2>
                    <ProjectEditor userId={user.id} />

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="techStack">
                            Tech Stack
                        </label>
                        <input
                            id="techStack"
                            type="text"
                            value={techStack}
                            onChange={(e) => setTechStack(e.target.value)}
                            className="input-field"
                            placeholder="E.g., Python, PyTorch, Next.js, Supabase"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted">Separate technologies with commas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="githubUrl">
                                GitHub URL
                            </label>
                            <input
                                id="githubUrl"
                                type="url"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="input-field"
                                placeholder="https://github.com/..."
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="websiteUrl">
                                Personal Website URL
                            </label>
                            <input
                                id="websiteUrl"
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                className="input-field"
                                placeholder="https://yourdomain.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="linkedinUrl">
                                LinkedIn URL
                            </label>
                            <input
                                id="linkedinUrl"
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                className="input-field"
                                placeholder="https://linkedin.com/in/..."
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </section>

                <div className="pt-6 border-t border-border flex justify-end">
                    <button
                        type="submit"
                        className="btn btn-primary px-8"
                        disabled={isLoading || !displayName || !startDate}
                    >
                        {isLoading ? "Saving..." : "Save Profile"}
                    </button>
                </div>
            </form>
        </div>
    );
}
