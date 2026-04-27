"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/components/feed/post";
import Link from "next/link";
import { MapPin, Link as LinkIcon, GitBranch, Calendar, GraduationCap, Award, Flame, BookOpen, Briefcase } from "lucide-react";

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [userCourses, setUserCourses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("activity");
    const [loading, setLoading] = useState(true);

    const profileId = params.id as string;

    useEffect(() => {
        const fetchProfileData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", profileId)
                .single();

            if (profileError || !profileData) {
                router.push("/dashboard");
                return;
            }

            setProfile(profileData);

            const { data: postsData } = await supabase
                .from("posts")
                .select(`
                    id, content, created_at, user_id,
                    profiles ( display_name, start_date, avatar_url ),
                    comments ( id, content, created_at, user_id, profiles(display_name, start_date, avatar_url) ),
                    reactions ( id, reaction_type, user_id )
                `)
                .eq("user_id", profileId)
                .order("created_at", { ascending: false });

            if (postsData) {
                setPosts(postsData);
            }

            const { data: coursesData } = await supabase
                .from("user_courses")
                .select("*")
                .eq("user_id", profileId)
                .order("created_at", { ascending: true });
            
            if (coursesData) {
                setUserCourses(coursesData);
            }

            setLoading(false);
        };

        fetchProfileData();
    }, [profileId, supabase, router]);

    const handleRefresh = async () => {
        const { data: postsData } = await supabase
            .from("posts")
            .select(`
                id, content, created_at, user_id,
                profiles ( display_name, start_date, avatar_url ),
                comments ( id, content, created_at, user_id, profiles(display_name, start_date, avatar_url) ),
                reactions ( id, reaction_type, user_id )
            `)
            .eq("user_id", profileId)
            .order("created_at", { ascending: false });
        
        if (postsData) {
            setPosts(postsData);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><span className="text-muted">Loading profile...</span></div>;
    if (!profile) return null;

    const isOwnProfile = currentUser?.id === profile.id;
    const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const cohortStr = profile.start_date ? `${new Date(profile.start_date + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Cohort";

    // Real Stats
    const completedCoursesCount = userCourses.filter(c => c.is_completed).length;
    const stats = [
        { label: "Courses", value: completedCoursesCount.toString(), icon: <BookOpen size={16} className="text-blue-500" /> },
        { label: "Projects", value: "12", icon: <Briefcase size={16} className="text-purple-500" /> },
        { label: "Streak", value: `${profile.current_streak || 0} Days`, icon: <Flame size={16} className="text-orange-500" /> },
        { label: "Reputation", value: "1,250", icon: <Award size={16} className="text-yellow-500" /> }
    ];

    return (
        <div className="flex flex-1 flex-col items-center py-6 px-4 md:px-6 w-full max-w-5xl mx-auto">
            {/* Profile Header */}
            <div className="w-full bg-[#121212] border border-border rounded-xl overflow-hidden mb-6">
                {/* Banner */}
                <div className="h-48 w-full bg-[#1a1a1a] relative">
                    {profile.banner_url ? (
                        <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#222] to-[#111]" />
                    )}
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar & Edit Button */}
                    <div className="flex justify-between items-end -mt-16 mb-4">
                        <div className="p-1 bg-[#121212] rounded-full z-10">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full object-cover bg-[#222]" />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-[#222] flex items-center justify-center text-4xl font-semibold text-muted">
                                    {profile.display_name?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                        {isOwnProfile ? (
                            <Link href="/profile/edit" className="btn btn-secondary px-4 py-2 text-sm font-medium">
                                Edit Profile
                            </Link>
                        ) : (
                            <button className="btn btn-primary px-6 py-2 text-sm font-medium">Follow</button>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{profile.display_name}</h1>
                        <p className="text-foreground text-lg mb-2">{profile.headline || `${profile.role || "Student"} · ${cohortStr}`}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                            {profile.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} /> {profile.location}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <GraduationCap size={16} /> {cohortStr}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={16} /> Joined {joinDate}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted">
                            <span className="text-foreground font-medium">124 <span className="text-muted font-normal">Following</span></span>
                            <span className="text-foreground font-medium">89 <span className="text-muted font-normal">Followers</span></span>
                            
                            {profile.website_url && (
                                <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:underline ml-4">
                                    <LinkIcon size={16} /> {profile.website_url.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                            {profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                                    <GitBranch size={16} /> GitHub
                                </a>
                            )}
                            {profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                                    <Briefcase size={16} /> LinkedIn
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-6">
                {/* Left Sidebar (Bio & Stats) */}
                <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-transparent border border-border rounded-xl p-5">
                        <h2 className="text-lg font-medium mb-3">About</h2>
                        <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                            {profile.bio || "No bio provided."}
                        </div>
                    </div>

                    <div className="bg-transparent border border-border rounded-xl p-5">
                        <h2 className="text-lg font-medium mb-4">Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-[#1a1a1a] p-3 rounded-lg border border-border flex flex-col">
                                    <div className="flex items-center gap-2 text-muted text-xs mb-1">
                                        {stat.icon} {stat.label}
                                    </div>
                                    <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {profile.tech_stack && (
                        <div className="bg-transparent border border-border rounded-xl p-5">
                            <h2 className="text-lg font-medium mb-3">Tech Stack</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.tech_stack.split(",").map((tech: string, i: number) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#222] border border-[#333] rounded text-xs text-foreground">
                                        {tech.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content (Tabs) */}
                <div className="flex-1">
                    <div className="border-b border-border flex gap-6 mb-6 px-2">
                        {["Activity", "Portfolio", "Courses", "Connections"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.toLowerCase() ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {activeTab === "activity" && (
                            <>
                                {posts.length === 0 ? (
                                    <div className="text-center py-12 text-muted text-sm border border-border rounded-xl">
                                        No recent activity.
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <Post key={post.id} post={post} user={currentUser} onRefresh={handleRefresh} />
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === "portfolio" && (
                            <div className="bg-transparent border border-border rounded-xl p-6">
                                <h2 className="text-lg font-medium mb-4">Current Projects</h2>
                                <div className="text-sm text-muted whitespace-pre-wrap leading-relaxed">
                                    {profile.current_projects || "No projects showcased yet."}
                                </div>
                            </div>
                        )}

                        {activeTab === "courses" && (
                            <div className="space-y-4">
                                {userCourses.length === 0 ? (
                                    <div className="text-center py-12 text-muted text-sm border border-border rounded-xl">
                                        Not enrolled in any courses yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userCourses.map(course => (
                                            <div key={course.id} className="bg-transparent border border-border rounded-xl p-5 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-semibold text-foreground">{course.course_name}</h3>
                                                        {course.is_completed && (
                                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider border border-green-500/20">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted mb-4">
                                                        {course.is_completed ? "Finished all lessons" : `Currently on: ${course.current_lesson || "Starting soon"}`}
                                                    </p>
                                                </div>
                                                <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${course.is_completed ? "bg-green-500 w-full" : "bg-primary w-1/3"}`} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "connections" && (
                            <div className="text-center py-12 text-muted text-sm border border-border rounded-xl">
                                Feature coming soon.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
