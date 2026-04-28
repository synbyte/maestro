"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ExternalLink, Image as ImageIcon, Send } from "lucide-react";

interface Project {
    id: string;
    user_id?: string;
    name: string;
    description: string;
    url: string;
    image_url: string;
    completed_at: string;
    has_shipped?: boolean;
    isNew?: boolean;
}

export function ProjectEditor({ userId }: { userId: string }) {
    const supabase = createClient();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingIndex, setIsSavingIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchProjects();
    }, [userId]);

    const fetchProjects = async () => {
        const { data } = await supabase
            .from("user_projects")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (data) {
            setProjects(data);
        }
        setLoading(false);
    };

    const addProject = () => {
        setProjects(prev => [{
            id: `temp-${Date.now()}`,
            name: "",
            description: "",
            url: "",
            image_url: "",
            completed_at: new Date().toISOString().split('T')[0],
            has_shipped: false,
            isNew: true
        }, ...prev]);
    };

    const updateProject = (index: number, field: string, value: any) => {
        setProjects(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const saveProject = async (index: number, shouldShip: boolean = false) => {
        const project = projects[index];
        if (!project.name.trim() || isSavingIndex === index) return;

        setIsSavingIndex(index);
        try {
            const payload = {
                name: project.name,
                description: project.description,
                url: project.url,
                image_url: project.image_url,
                completed_at: project.completed_at,
                has_shipped: project.has_shipped || shouldShip
            };

            if (project.isNew) {
                const { data } = await supabase
                    .from("user_projects")
                    .insert({ user_id: userId, ...payload })
                    .select()
                    .single();

                if (data) {
                    setProjects(prev => {
                        const next = [...prev];
                        if (next[index]) next[index] = { ...data, isNew: false };
                        return next;
                    });
                    
                    if (shouldShip) {
                        await shipMilestone(data, project.description);
                    }
                }
            } else {
                await supabase
                    .from("user_projects")
                    .update(payload)
                    .eq("id", project.id);

                if (shouldShip && !project.has_shipped) {
                    await shipMilestone(project, project.description);
                    updateProject(index, "has_shipped", true);
                }
            }
        } catch (err) {
            console.error("Error saving project:", err);
        } finally {
            setIsSavingIndex(null);
        }
    };

    const shipMilestone = async (project: any, description: string) => {
        // Award reputation for shipping a project (100 pts)
        await supabase.rpc('increment_reputation', { 
            profile_id: userId, 
            amount: 100,
            reason: `for shipping a new project: ${project.name}! 🚀`
        });

        // Milestone post
        await supabase.from("posts").insert({
            user_id: userId,
            content: `🎉 I just shipped a new project: **${project.name}**!`,
            type: 'project_milestone',
            metadata: {
                project_id: project.id,
                project_name: project.name,
                project_description: description,
                project_url: project.url,
                project_image: project.image_url
            }
        });
    };

    const deleteProject = async (index: number) => {
        const project = projects[index];
        if (!project.isNew) {
            await supabase.from("user_projects").delete().eq("id", project.id);
        }
        setProjects(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) return <div className="text-sm text-muted">Loading projects...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted">Draft your work and ship milestones to your feed when ready.</p>
                <button
                    type="button"
                    onClick={addProject}
                    className="btn btn-primary text-sm px-4 py-2"
                >
                    + Add New Project
                </button>
            </div>

            {projects.length === 0 && (
                <div className="text-sm text-muted py-10 border border-dashed border-border rounded-xl text-center bg-[#111]">
                    No projects showcased yet. Time to build something!
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {projects.map((project, index) => (
                    <div key={project.id} className="p-6 border border-border rounded-xl bg-[#1a1a1a] space-y-6 animate-fade-in relative group">
                        <button
                            type="button"
                            onClick={() => deleteProject(index)}
                            className="absolute top-4 right-4 p-2 text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#666] block">Project Name</label>
                                    <input
                                        type="text"
                                        value={project.name}
                                        onChange={(e) => updateProject(index, "name", e.target.value)}
                                        onBlur={() => saveProject(index)}
                                        className="input-field py-2"
                                        placeholder="e.g. Maestro Mix Social"
                                        disabled={isSavingIndex === index}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#666] block">Description</label>
                                    <textarea
                                        value={project.description}
                                        onChange={(e) => updateProject(index, "description", e.target.value)}
                                        onBlur={() => saveProject(index)}
                                        className="input-field py-2 min-h-[100px] resize-none"
                                        placeholder="Describe what you built..."
                                        disabled={isSavingIndex === index}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#666] block">Live / GitHub URL</label>
                                    <input
                                        type="url"
                                        value={project.url}
                                        onChange={(e) => updateProject(index, "url", e.target.value)}
                                        onBlur={() => saveProject(index)}
                                        className="input-field py-2"
                                        placeholder="https://..."
                                        disabled={isSavingIndex === index}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#666] block">Thumbnail URL</label>
                                    <input
                                        type="text"
                                        value={project.image_url}
                                        onChange={(e) => updateProject(index, "image_url", e.target.value)}
                                        onBlur={() => saveProject(index)}
                                        className="input-field py-2"
                                        placeholder="https://image-url.com/..."
                                        disabled={isSavingIndex === index}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#666] block">Completion Date</label>
                                    <input
                                        type="date"
                                        value={project.completed_at}
                                        onChange={(e) => updateProject(index, "completed_at", e.target.value)}
                                        onBlur={() => saveProject(index)}
                                        className="input-field py-2"
                                        disabled={isSavingIndex === index}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-between items-center">
                            <div className="flex gap-4">
                                {project.image_url && (
                                    <img 
                                        src={project.image_url} 
                                        alt="Preview" 
                                        className="h-12 w-20 object-cover rounded border border-border" 
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                )}
                                <div className="text-[10px] font-bold uppercase text-[#444] self-center">
                                    {project.isNew ? "Draft" : (project.has_shipped ? "Shipped to Feed ✅" : "Ready to ship")}
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                disabled={isSavingIndex === index || project.has_shipped || !project.name || !project.description}
                                onClick={() => saveProject(index, true)}
                                className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-30"
                            >
                                <Send size={14} />
                                {project.has_shipped ? "Already Shipped" : "Save & Ship to Feed"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
