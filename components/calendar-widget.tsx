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
            className="bg-[#1a1a1a] border border-border rounded-xl overflow-hidden shadow-lg group hover:border-accent/30 transition-all"
        >
            <div className="bg-gradient-to-r from-accent/20 to-transparent p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-accent" />
                    <h2 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Upcoming Event</h2>
                </div>
            </div>

            <div className="p-5">
                <div className="flex gap-4">
                    {/* Calendar Leaf Icon */}
                    <div className="flex-shrink-0 w-12 h-14 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center overflow-hidden">
                        <div className="w-full bg-red-500/80 text-[8px] font-bold text-center py-0.5 uppercase tracking-tighter text-white">
                            {month}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-xl font-bold text-foreground">
                            {day}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                            {nextEvent.title}
                        </h3>
                        <div className="space-y-1 mt-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Clock size={12} className="text-muted-foreground/50" />
                                <span>{time}</span>
                            </div>
                            {nextEvent.location && (
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                                    <MapPin size={12} className="text-muted-foreground/50" />
                                    <span>{nextEvent.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Link 
                    href="/events" 
                    className="mt-4 flex items-center justify-between w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all group/link"
                >
                    <span>View Calendar</span>
                    <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
}
