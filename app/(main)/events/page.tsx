"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/components/events/calendar";
import { AddEventModal } from "@/components/events/add-event-modal";
import { UserAvatar } from "@/components/user-avatar";
import { Calendar as CalendarIcon, MapPin, Link as LinkIcon, Clock } from "lucide-react";

export default function EventsPage() {
    const supabase = createClient();
    const [events, setEvents] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from("events")
            .select(`
                *,
                profiles ( id, display_name, avatar_url )
            `)
            .order("start_time", { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        
        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) {
            alert(error.message);
        } else {
            fetchEvents();
        }
    };

    useEffect(() => {
        fetchUser();
        fetchEvents();

        const channel = supabase
            .channel("events_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
                fetchEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const selectedDayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear();
    });

    const upcomingEvent = events.find(event => new Date(event.start_time) > new Date());

    return (
        <div className="flex flex-1 flex-col py-10 px-6 max-w-7xl mx-auto w-full animate-fade-in">
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-[#ecebe4] mb-2">Community Events</h1>
                <p className="text-[#aaaaa5] text-lg">Join study sessions, workshops, and cohort meetups.</p>
            </div>

            {upcomingEvent && (
                <div className="mb-10 bg-gradient-to-r from-accent/20 to-transparent border-l-4 border-accent p-6 rounded-r-xl">
                    <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest mb-2">
                        <Clock size={14} />
                        Next Event
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-[#ecebe4] mb-1">{upcomingEvent.title}</h2>
                            <p className="text-[#aaaaa5] max-w-2xl">{upcomingEvent.description}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
                            <div className="text-center px-4 border-r border-[#333]">
                                <div className="text-xs font-bold uppercase text-[#666]">{new Date(upcomingEvent.start_time).toLocaleString('default', { month: 'short' })}</div>
                                <div className="text-2xl font-bold text-accent">{new Date(upcomingEvent.start_time).getDate()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-[#ecebe4]">{new Date(upcomingEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-xs text-[#666]">{upcomingEvent.location || "Online"}</div>
                            </div>
                            <button 
                                onClick={() => setSelectedDate(new Date(upcomingEvent.start_time))}
                                className="ml-4 px-4 py-2 bg-[#333] hover:bg-[#444] rounded-lg text-xs font-bold transition-colors"
                            >
                                VIEW
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Calendar View */}
                <div className="lg:col-span-2">
                    <Calendar 
                        events={events} 
                        selectedDate={selectedDate} 
                        onDateSelect={setSelectedDate}
                        onAddEvent={(date) => {
                            setSelectedDate(date);
                            setIsModalOpen(true);
                        }}
                    />
                </div>

                {/* Sidebar: Selected Day Events */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-xl sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-[#ecebe4]">
                                {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2 bg-accent text-accent-fg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                            >
                                Add Event
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-10 text-[#666] animate-pulse">Loading events...</div>
                        ) : selectedDayEvents.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-[#333] rounded-xl">
                                <CalendarIcon className="w-10 h-10 text-[#333] mx-auto mb-3" />
                                <p className="text-[#aaaaa5] text-sm">No events scheduled for this day.</p>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-accent text-xs font-medium mt-2 hover:underline"
                                >
                                    Be the first to add one!
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedDayEvents.map(event => (
                                    <div key={event.id} className="group p-4 bg-[#222] border border-[#333] rounded-xl hover:border-accent/50 transition-all cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-[#ecebe4] group-hover:text-accent transition-colors">{event.title}</h3>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                                                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {user?.id === event.creator_id && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                                        className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#aaaaa5] mb-4 line-clamp-2">{event.description}</p>
                                        
                                        <div className="space-y-2 mb-4">
                                            {event.location && (
                                                <div className="flex items-center gap-2 text-[11px] text-[#666]">
                                                    <MapPin size={12} className="text-accent" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            {event.link && (
                                                <a 
                                                    href={event.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[11px] text-accent hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LinkIcon size={12} />
                                                    <span>Join Meeting</span>
                                                </a>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-[#333] flex items-center gap-2">
                                            <UserAvatar 
                                                userId={event.creator_id} 
                                                src={event.profiles?.avatar_url} 
                                                name={event.profiles?.display_name} 
                                                size="sm" 
                                            />
                                            <span className="text-[10px] text-[#666]">Organized by <span className="text-[#aaaaa5]">{event.profiles?.display_name}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddEventModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                selectedDate={selectedDate}
                onEventAdded={fetchEvents}
            />
        </div>
    );
}
