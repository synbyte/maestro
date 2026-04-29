"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Event {
    id: string;
    title: string;
    start_time: string;
    location: string | null;
}

export function CalendarWidget() {
    const supabase = createClient();
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNextEvent = async () => {
            const { data, error } = await supabase
                .from("events")
                .select("id, title, start_time, location")
                .gte("start_time", new Date().toISOString())
                .order("start_time", { ascending: true })
                .limit(1)
                .single();

            if (!error && data) {
                setNextEvent(data);
            }
            setLoading(false);
        };

        fetchNextEvent();
    }, [supabase]);

    if (loading) return (
        <div className="bg-[#1a1a1a] border border-border rounded-xl p-5 animate-pulse">
            <div className="h-4 w-24 bg-white/5 rounded mb-4" />
            <div className="h-20 bg-white/5 rounded" />
        </div>
    );

    if (!nextEvent) return null;

    const startDate = new Date(nextEvent.start_time);
    const month = startDate.toLocaleString('default', { month: 'short' });
    const day = startDate.getDate();
    const time = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300 hover:bg-[#1a1a1a]/60 hover:border-white/10"
        >
            <div className="bg-white/[0.03] p-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-accent" />
                    <h2 className="text-[10px] font-bold tracking-[0.25em] text-muted uppercase">Upcoming Event</h2>
                </div>
            </div>

            <div className="p-6">
                <div className="flex gap-5">
                    {/* Modern Calendar Leaf Icon */}
                    <div className="flex-shrink-0 w-14 h-16 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center overflow-hidden shadow-inner group-hover:border-accent/30 transition-colors">
                        <div className="w-full bg-accent text-[9px] font-bold text-center py-1 uppercase tracking-tighter text-accent-fg">
                            {month}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-2xl font-bold text-foreground">
                            {day}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                        <h3 className="text-[15px] font-bold text-foreground truncate group-hover:text-accent transition-colors leading-tight mb-2">
                            {nextEvent.title}
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] text-muted/70">
                                <Clock size={12} className="text-accent/60" />
                                <span>{time}</span>
                            </div>
                            {nextEvent.location && (
                                <div className="flex items-center gap-2 text-[11px] text-muted/70 truncate">
                                    <MapPin size={12} className="text-accent/60" />
                                    <span>{nextEvent.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Link 
                    href="/events" 
                    className="mt-6 flex items-center justify-between w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-bold text-muted hover:text-foreground transition-all group/link border border-white/5"
                >
                    <span className="tracking-wide">View Full Calendar</span>
                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform text-accent" />
                </Link>
            </div>
        </motion.div>
    );
}
