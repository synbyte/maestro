"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { COURSES } from "@/lib/constants";
import { Dropdown } from "@/components/ui/dropdown";

interface Course {
    id: string;
    user_id?: string;
    course_name: string;
    week_number: number;
    lesson_number: number;
    is_completed: boolean;
    isNew?: boolean;
}

async function postMilestone(supabase: any, userId: string, message: string) {
    await supabase.from("posts").insert({
        user_id: userId,
        content: message,
    });
}

export function CourseEditor({ userId }: { userId: string }) {
    const supabase = createClient();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingIndex, setIsSavingIndex] = useState<number | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    // Store a snapshot of the original db values so we can detect progress changes
    const originalRef = useRef<Record<string, { week_number: number; lesson_number: number; is_completed: boolean }>>({});

    const WEEKS = Array.from({ length: 30 }, (_, i) => i + 1);
    const LESSONS = Array.from({ length: 15 }, (_, i) => i + 1);

    useEffect(() => {
        fetchCourses();
    }, [userId]);

    const fetchCourses = async () => {
        const { data } = await supabase
            .from("user_courses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        if (data) {
            setCourses(data);
            // Store originals for comparison
            const snapshot: typeof originalRef.current = {};
            data.forEach((c: Course) => {
                snapshot[c.id] = {
                    week_number: c.week_number,
                    lesson_number: c.lesson_number,
                    is_completed: c.is_completed,
                };
            });
            originalRef.current = snapshot;
        }
        setLoading(false);
    };

    const addCourse = () => {
        setCourses(prev => [...prev, {
            id: `temp-${Date.now()}`,
            course_name: "",
            week_number: 1,
            lesson_number: 1,
            is_completed: false,
            isNew: true
        }]);
    };

    const updateCourse = (index: number, field: string, value: any) => {
        setCourses(prev => {
            const next = [...prev];
            let finalValue = value;
            if (field === "course_name" && typeof value === "string") {
                finalValue = value.toUpperCase().replace(/\s/g, "");
            }
            next[index] = { ...next[index], [field]: finalValue };
            return next;
        });
    };

    const saveCourse = async (index: number) => {
        const course = courses[index];
        if (!course.course_name.trim() || isSavingIndex === index) return;

        setIsSavingIndex(index);
        try {
            const payload = {
                course_name: course.course_name,
                week_number: course.week_number,
                lesson_number: course.lesson_number,
                is_completed: course.is_completed,
            };

            if (course.isNew) {
                const { data } = await supabase
                    .from("user_courses")
                    .insert({ user_id: userId, ...payload })
                    .select()
                    .single();

                if (data) {
                    setCourses(prev => {
                        const next = [...prev];
                        if (next[index]) next[index] = data;
                        return next;
                    });
                    // Record as original
                    originalRef.current[data.id] = {
                        week_number: data.week_number,
                        lesson_number: data.lesson_number,
                        is_completed: data.is_completed,
                    };
                }
            } else {
                await supabase
                    .from("user_courses")
                    .update(payload)
                    .eq("id", course.id);

                // Check if progress advanced — fire milestone post if so
                const orig = originalRef.current[course.id];
                if (orig) {
                    const weekAdvanced = course.week_number > orig.week_number;
                    const lessonAdvanced = course.week_number === orig.week_number && course.lesson_number > orig.lesson_number;
                    const justCompleted = course.is_completed && !orig.is_completed;

                    if (justCompleted) {
                        await postMilestone(supabase, userId,
                            `🎓 I just completed **${course.course_name.toUpperCase()}**! Huge milestone reached. Onwards! 🚀`
                        );
                    } else if (weekAdvanced) {
                        await postMilestone(supabase, userId,
                            `📅 Making progress on **${course.course_name.toUpperCase()}** — just moved to Week ${course.week_number}, Lesson ${course.lesson_number}! 💪`
                        );
                    } else if (lessonAdvanced) {
                        await postMilestone(supabase, userId,
                            `📖 Crushed another lesson in **${course.course_name.toUpperCase()}**! Now on Week ${course.week_number}, Lesson ${course.lesson_number}. Keep going! 🔥`
                        );
                    }

                    // Update snapshot
                    originalRef.current[course.id] = {
                        week_number: course.week_number,
                        lesson_number: course.lesson_number,
                        is_completed: course.is_completed,
                    };
                }
            }
        } catch (err) {
            console.error("Error saving course:", err);
        } finally {
            setIsSavingIndex(null);
        }
    };

    const deleteCourse = async (index: number) => {
        const course = courses[index];
        if (!course.isNew) {
            await supabase.from("user_courses").delete().eq("id", course.id);
            delete originalRef.current[course.id];
        }
        setCourses(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return <div className="text-sm text-muted">Loading courses...</div>;

    return (
        <div className="space-y-4">
            {validationError && (
                <div className="p-2 text-xs bg-red-900/20 border border-red-900/50 text-red-500 rounded">
                    {validationError}
                </div>
            )}

            {courses.length === 0 && (
                <div className="text-sm text-muted py-4 border border-dashed border-border rounded text-center">
                    No courses added yet.
                </div>
            )}

            {courses.map((course, index) => (
                <div key={course.id} className="p-4 border border-border rounded bg-[#1a1a1a] space-y-4">
                    {/* Course Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted block">Course Name</label>
                        <Dropdown
                            value={course.course_name}
                            options={COURSES}
                            onChange={(val) => {
                                updateCourse(index, "course_name", val);
                                setTimeout(() => saveCourse(index), 0);
                            }}
                            placeholder="Select a course..."
                            disabled={isSavingIndex === index}
                        />
                    </div>

                    {/* Week & Lesson Selectors */}
                    {!course.is_completed && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted block">Current Week</label>
                                <Dropdown
                                    value={course.week_number?.toString() || "1"}
                                    options={WEEKS.map(w => w.toString())}
                                    onChange={(val) => {
                                        updateCourse(index, "week_number", parseInt(val));
                                        setTimeout(() => saveCourse(index), 0);
                                    }}
                                    placeholder="Week"
                                    disabled={isSavingIndex === index}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted block">Current Lesson</label>
                                <Dropdown
                                    value={course.lesson_number?.toString() || "1"}
                                    options={LESSONS.map(l => l.toString())}
                                    onChange={(val) => {
                                        updateCourse(index, "lesson_number", parseInt(val));
                                        setTimeout(() => saveCourse(index), 0);
                                    }}
                                    placeholder="Lesson"
                                    disabled={isSavingIndex === index}
                                />
                            </div>
                        </div>
                    )}

                    {/* Completed Toggle & Delete */}
                    <div className="flex justify-between items-center pt-1 border-t border-border">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                            <input
                                type="checkbox"
                                checked={course.is_completed}
                                disabled={isSavingIndex === index}
                                onChange={(e) => {
                                    updateCourse(index, "is_completed", e.target.checked);
                                    setTimeout(() => saveCourse(index), 0);
                                }}
                                className="w-4 h-4 rounded bg-[#222] border-border"
                            />
                            Mark as Completed
                        </label>

                        <button
                            type="button"
                            onClick={() => deleteCourse(index)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addCourse}
                className="btn btn-secondary text-sm px-4 py-2 mt-2"
            >
                + Add Course
            </button>
        </div>
    );
}
