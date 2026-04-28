"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onEventAdded: () => void;
}

export function AddEventModal({ isOpen, onClose, selectedDate, onEventAdded }: AddEventModalProps) {
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [time, setTime] = useState("12:00");
    const [location, setLocation] = useState("");
    const [link, setLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Combine date and time
        const startDateTime = new Date(selectedDate);
        const [hours, minutes] = time.split(":").map(Number);
        startDateTime.setHours(hours, minutes);

        const { error } = await supabase
            .from("events")
            .insert({
                title,
                description,
                start_time: startDateTime.toISOString(),
                location,
                link,
                creator_id: user.id
            });

        if (!error) {
            setTitle("");
            setDescription("");
            setTime("12:00");
            setLocation("");
            setLink("");
            onEventAdded();
            onClose();
        } else {
            alert(error.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-[#333] bg-gradient-to-r from-[#1a1a1a] to-[#222]">
                    <h3 className="text-xl font-semibold text-[#ecebe4]">Add New Event</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full transition-colors text-[#aaaaa5] hover:text-[#ecebe4]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Date</label>
                        <div className="px-4 py-3 bg-[#121212] border border-[#333] rounded-xl text-[#aaaaa5]">
                            {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Title</label>
                            <input 
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-[#ecebe4] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="Study Group, Workshop..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Time</label>
                            <input 
                                required
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-[#ecebe4] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-[#ecebe4] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[100px] resize-none"
                            placeholder="What's this event about?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Location</label>
                            <input 
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-[#ecebe4] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="Zoom, Discord, Library..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-[#666] mb-2 block">Link (Optional)</label>
                            <input 
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-[#ecebe4] focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-[#333] rounded-xl text-[#ecebe4] hover:bg-[#222] transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={isSubmitting}
                            type="submit"
                            className="flex-1 px-4 py-3 bg-accent text-accent-fg rounded-xl font-medium hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
