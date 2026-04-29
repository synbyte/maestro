"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/avatar-upload";
import { COURSES } from "@/lib/constants";

export default function Onboarding() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [step, setStep] = useState(1);

    // Step 1: Profile
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [startDate, setStartDate] = useState("");

    // Step 2: Course
    const [courseName, setCourseName] = useState("");
    const [weekNumber, setWeekNumber] = useState(1);
    const [lessonNumber, setLessonNumber] = useState(1);

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
                if (data.headline) setHeadline(data.headline);
                if (data.bio) setBio(data.bio);
                if (data.start_date) setStartDate(data.start_date);
            }
        };
        fetchUser();
    }, [router, supabase]);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError(null);

        // 1. Upsert Profile (create or update)
        const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                display_name: displayName,
                avatar_url: avatarUrl,
                headline,
                bio,
                start_date: startDate,
                is_onboarded: true,
            });

        if (profileError) {
            setError(profileError.message);
            setIsLoading(false);
            return;
        }

        // 2. Add Initial Course
        const { error: courseError } = await supabase
            .from("user_courses")
            .insert({
                user_id: user.id,
                course_name: courseName,
                week_number: weekNumber,
                lesson_number: lessonNumber,
                is_completed: false
            });

        if (courseError) {
            setError(courseError.message);
            setIsLoading(false);
            return;
        }

        // 3. Create Milestone Post
        const milestoneContent = `🚀 Just joined the cohort! I'm starting **${courseName}** at Week ${weekNumber}, Lesson ${lessonNumber}. Excited to learn with you all!`;
        await supabase
            .from("posts")
            .insert({
                user_id: user.id,
                content: milestoneContent,
                type: 'onboarding_milestone',
                metadata: {
                    course_name: courseName,
                    week_number: weekNumber,
                    lesson_number: lessonNumber
                }
            });

        router.push("/dashboard");
    };

    if (!user) return null;

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-md justify-center px-6 py-12">
            <div className="mb-8">
                <div className="flex gap-2 mb-4">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-[#333]'}`} />
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-[#333]'}`} />
                </div>
                <h1 className="text-3xl font-medium tracking-tight mb-2">
                    {step === 1 ? "Set up your profile" : "What are you studying?"}
                </h1>
                <p className="text-muted text-sm">
                    {step === 1 ? "Tell your cohort a bit about yourself." : "Enter the lesson you are currently working on. You can add more courses later from your profile settings."}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-sm rounded">
                    {error}
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleNext} className="space-y-6">
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
                            placeholder="e.g. Aspiring AI Engineer"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="startDate">
                            Cohort Start Date
                        </label>
                        <input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field"
                            required
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
                            placeholder="Tell you peers about yourself."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-4"
                        disabled={!displayName || !headline || !bio || !startDate}
                    >
                        Next Step
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="courseName">
                            Course Name
                        </label>
                        <select
                            id="courseName"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select a course...</option>
                            {COURSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="week">
                                Current Week
                            </label>
                            <input
                                id="week"
                                type="number"
                                min="1"
                                value={weekNumber}
                                onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="lesson">
                                Current Lesson
                            </label>
                            <input
                                id="lesson"
                                type="number"
                                min="1"
                                value={lessonNumber}
                                onChange={(e) => setLessonNumber(parseInt(e.target.value))}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading || !courseName}
                        >
                            {isLoading ? "Finalizing..." : "Complete Setup"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="btn btn-secondary w-full"
                            disabled={isLoading}
                        >
                            Back to Profile
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
