"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function CourseEditor({ userId }: { userId: string }) {
    const supabase = createClient();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingIndex, setIsSavingIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchCourses();
    }, [userId]);

    const fetchCourses = async () => {
        const { data } = await supabase
            .from("user_courses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        
        if (data) setCourses(data);
        setLoading(false);
    };

    const addCourse = () => {
        setCourses([...courses, { 
            id: `temp-${Date.now()}`, 
            course_name: "", 
            current_lesson: "", 
            is_completed: false,
            isNew: true
        }]);
    };

    const updateCourse = (index: number, field: string, value: any) => {
        const newCourses = [...courses];
        newCourses[index][field] = value;
        setCourses(newCourses);
    };

    const saveCourse = async (index: number) => {
        const course = courses[index];
        if (!course.course_name.trim() || isSavingIndex === index) return;

        setIsSavingIndex(index);
        try {
            if (course.isNew) {
                const { data, error } = await supabase.from("user_courses").insert({
                    user_id: userId,
                    course_name: course.course_name,
                    current_lesson: course.current_lesson,
                    is_completed: course.is_completed
                }).select().single();
                
                if (data) {
                    setCourses(prev => {
                        const next = [...prev];
                        if (next[index]) {
                            next[index] = data;
                        }
                        return next;
                    });
                }
            } else {
                await supabase.from("user_courses").update({
                    course_name: course.course_name,
                    current_lesson: course.current_lesson,
                    is_completed: course.is_completed
                }).eq("id", course.id);
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
        }
        const newCourses = [...courses];
        newCourses.splice(index, 1);
        setCourses(newCourses);
    };

    if (loading) return <div className="text-sm text-muted">Loading courses...</div>;

    return (
        <div className="space-y-4">
            {courses.length === 0 && (
                <div className="text-sm text-muted py-2 border border-dashed border-border rounded text-center">
                    No courses added yet.
                </div>
            )}
            
            {courses.map((course, index) => (
                <div key={course.id} className="p-4 border border-border rounded bg-[#1a1a1a] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted block">Course Name</label>
                            <input
                                type="text"
                                value={course.course_name}
                                onChange={(e) => updateCourse(index, "course_name", e.target.value)}
                                onBlur={() => saveCourse(index)}
                                className="input-field py-1.5 text-sm"
                                placeholder="e.g. py101"
                                disabled={isSavingIndex === index}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted block">Current Lesson</label>
                            <input
                                type="text"
                                value={course.current_lesson || ""}
                                onChange={(e) => updateCourse(index, "current_lesson", e.target.value)}
                                onBlur={() => saveCourse(index)}
                                className="input-field py-1.5 text-sm"
                                placeholder="e.g. Lesson 5: Loops"
                                disabled={isSavingIndex === index}
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                            <input
                                type="checkbox"
                                checked={course.is_completed}
                                disabled={isSavingIndex === index}
                                onChange={(e) => {
                                    updateCourse(index, "is_completed", e.target.checked);
                                    // Small delay to ensure state update propagates if needed, 
                                    // though React state is async we want to ensure the latest 
                                    // state is captured in the closure or use the target value.
                                    setTimeout(() => saveCourse(index), 0);
                                }}
                                className="w-4 h-4 rounded bg-[#222] border-border text-primary focus:ring-primary"
                            />
                            Course Completed
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
