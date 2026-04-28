"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Event {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time?: string;
    location?: string;
    link?: string;
}

interface CalendarProps {
    events: Event[];
    onDateSelect: (date: Date) => void;
    onAddEvent: (date: Date) => void;
    selectedDate: Date;
}

export function Calendar({ events, onDateSelect, onAddEvent, selectedDate }: CalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        
        // Offset for the first day of the month
        const firstDay = date.getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [viewDate]);

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const hasEvents = (date: Date) => {
        return events.some(event => {
            const eventDate = new Date(event.start_time);
            return eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    return (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-2xl">
            {/* Calendar Header */}
            <div className="p-6 border-b border-[#333] flex items-center justify-between bg-gradient-to-r from-[#1a1a1a] to-[#222]">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#ecebe4]">{monthName}</h2>
                    <p className="text-sm text-[#aaaaa5]">{year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-[#333] rounded-lg transition-colors text-[#aaaaa5] hover:text-[#ecebe4]"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setViewDate(new Date())}
                        className="px-3 py-1 text-xs font-medium hover:bg-[#333] rounded-lg transition-colors text-[#aaaaa5] hover:text-[#ecebe4]"
                    >
                        Today
                    </button>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-[#333] rounded-lg transition-colors text-[#aaaaa5] hover:text-[#ecebe4]"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b border-[#333] bg-[#121212]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#666]">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 bg-[#121212] gap-[1px] p-[1px]">
                {daysInMonth.map((date, i) => (
                    <div 
                        key={i} 
                        className={`min-h-[100px] p-2 transition-all relative group ${date ? 'bg-[#1a1a1a] cursor-pointer hover:bg-[#222]' : 'bg-[#121212]'} ${date && isSelected(date) ? 'ring-1 ring-primary inset-0 z-10 bg-[#222]' : ''}`}
                        onClick={() => date && onDateSelect(date)}
                    >
                        {date && (
                            <>
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${isToday(date) ? 'bg-accent text-accent-fg w-6 h-6 flex items-center justify-center rounded-full' : 'text-[#aaaaa5]'}`}>
                                        {date.getDate()}
                                    </span>
                                    {hasEvents(date) && (
                                        <div className="flex gap-0.5">
                                            {events.filter(e => {
                                                const d = new Date(e.start_time);
                                                return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                                            }).slice(0, 3).map((_, idx) => (
                                                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {events.filter(e => {
                                        const d = new Date(e.start_time);
                                        return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                                    }).slice(0, 2).map((event) => (
                                        <div key={event.id} className="text-[10px] bg-accent/10 border border-accent/20 text-accent-fg px-1.5 py-0.5 rounded truncate">
                                            {event.title}
                                        </div>
                                    ))}
                                    {events.filter(e => {
                                        const d = new Date(e.start_time);
                                        return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                                    }).length > 2 && (
                                        <div className="text-[9px] text-[#666] pl-1">
                                            + {events.filter(e => {
                                                const d = new Date(e.start_time);
                                                return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                                            }).length - 2} more
                                        </div>
                                    )}
                                </div>
                                
                                {/* Add Button on Hover */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAddEvent(date); }}
                                    className="absolute bottom-2 right-2 p-1 bg-accent text-accent-fg rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100"
                                >
                                    <Plus size={14} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
