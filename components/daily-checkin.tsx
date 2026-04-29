"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReputation } from "@/components/reputation-provider";
import { Dropdown } from "@/components/ui/dropdown";

const STORAGE_KEY = "maestro_checkin_date";

interface CourseCheckIn {
    id: string;
    course_name: string;
    week_number: number;
    lesson_number: number;
    new_week: number;
    new_lesson: number;
    is_completed: boolean;
}

export function DailyCheckIn() {
    const supabase = createClient();
    const { triggerRepPop } = useReputation();
    const [show, setShow] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [courses, setCourses] = useState<CourseCheckIn[]>([]);
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);

    const WEEKS = Array.from({ length: 30 }, (_, i) => i + 1);
    const LESSONS = Array.from({ length: 15 }, (_, i) => i + 1);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUser(user);

            // Only show once per day
            const today = new Date().toLocaleDateString("en-CA");
            const lastCheckin = localStorage.getItem(STORAGE_KEY);
            if (lastCheckin === today) return;

            // Fetch courses
            const { data } = await supabase
                .from("user_courses")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_completed", false)
                .order("created_at", { ascending: true });

            if (!data || data.length === 0) {
                // No in-progress courses, mark done for today
                localStorage.setItem(STORAGE_KEY, today);
                return;
            }

            setCourses(data.map((c: any) => ({
                id: c.id,
                course_name: c.course_name,
                week_number: c.week_number,
                lesson_number: c.lesson_number,
                new_week: c.week_number,
                new_lesson: c.lesson_number,
                is_completed: false,
            })));

            // Show prompt after a brief delay so the page loads first
            setTimeout(() => setShow(true), 1500);
        };

        init();
    }, []);

    const updateCourse = (index: number, field: string, value: any) => {
        setCourses(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleKeepAsIs = () => {
        const today = new Date().toLocaleDateString("en-CA");
        localStorage.setItem(STORAGE_KEY, today);
        setDone(true);
        setTimeout(() => setShow(false), 500);
    };

    const handleUpdate = async (e: React.MouseEvent) => {
        if (!user) return;
        setSaving(true);
        const today = new Date().toLocaleDateString("en-CA");

        // Trigger visual feedback
        triggerRepPop(e.clientX, e.clientY, 10);

        for (const course of courses) {
            const weekAdvanced = course.new_week > course.week_number;
            const lessonAdvanced = course.new_week === course.week_number && course.new_lesson > course.lesson_number;
            const justCompleted = course.is_completed;

            // Save to db
            await supabase.from("user_courses").update({
                week_number: course.new_week,
                lesson_number: course.new_lesson,
                is_completed: course.is_completed,
            }).eq("id", course.id);

            // Fire milestone posts
            if (justCompleted) {
                await supabase.from("posts").insert({
                    user_id: user.id,
                    content: `🎓 I just completed **${course.course_name.toUpperCase()}**! Huge milestone reached. Onwards! 🚀`,
                });
            } else if (weekAdvanced) {
                await supabase.from("posts").insert({
                    user_id: user.id,
                    content: `📅 Daily check-in: Making progress on **${course.course_name.toUpperCase()}** — just hit Week ${course.new_week}, Lesson ${course.new_lesson}! 💪`,
                });
            } else if (lessonAdvanced) {
                await supabase.from("posts").insert({
                    user_id: user.id,
                    content: `📖 Daily check-in: Knocked out another lesson in **${course.course_name.toUpperCase()}**! Now on Week ${course.new_week}, Lesson ${course.new_lesson}. 🔥`,
                });
            }
        }

        localStorage.setItem(STORAGE_KEY, today);
        setSaving(false);
        setDone(true);
        setTimeout(() => setShow(false), 600);
    };

    if (!show) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />

            {/* Slide-down Banner */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ${done ? "-translate-y-full" : "translate-y-0"}`}
            >
                <div className="bg-[#1a1a1a] border-b border-border shadow-2xl p-6 md:p-8 max-w-2xl mx-auto mt-0 md:mt-4 md:rounded-xl">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-foreground mb-1">📚 Daily Check-in</h2>
                        <p className="text-sm text-muted">Where are you in your courses today? Update your progress to track your journey.</p>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {courses.map((course, index) => (
                            <div key={course.id} className="p-4 border border-border rounded-lg bg-[#121212]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold text-foreground uppercase tracking-wide text-sm">{course.course_name}</span>
                                    <span className="text-xs text-muted">Currently: Week {course.week_number} · Lesson {course.lesson_number}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-xs text-muted block mb-1">Week</label>
                                        <Dropdown
                                            value={course.new_week.toString()}
                                            onChange={(val) => updateCourse(index, "new_week", parseInt(val))}
                                            options={WEEKS.map(w => w.toString())}
                                            disabled={course.is_completed}
                                            placeholder="Week"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted block mb-1">Lesson</label>
                                        <Dropdown
                                            value={course.new_lesson.toString()}
                                            onChange={(val) => updateCourse(index, "new_lesson", parseInt(val))}
                                            options={LESSONS.map(l => l.toString())}
                                            disabled={course.is_completed}
                                            placeholder="Lesson"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={course.is_completed}
                                        onChange={(e) => updateCourse(index, "is_completed", e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    I completed this course!
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                        <button
                            onClick={handleKeepAsIs}
                            disabled={saving}
                            className="btn btn-secondary flex-1 py-2.5 text-sm"
                        >
                            Keep As Is
                        </button>
                        <button
                            onClick={(e) => handleUpdate(e)}
                            disabled={saving}
                            className="btn btn-primary flex-1 py-2.5 text-sm"
                        >
                            {saving ? "Saving..." : "Update Progress"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
