"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface DropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function Dropdown({
    value,
    onChange,
    options,
    placeholder = "Select an option...",
    disabled = false,
    className = ""
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt === value);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-200 bg-[#1a1a1a] border rounded cursor-pointer focus:outline-none ${
                    isOpen ? "border-muted ring-1 ring-white/5" : "border-border hover:border-muted/50"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <span className={`block truncate ${!selectedOption ? "text-muted" : "text-foreground"}`}>
                    {selectedOption || placeholder}
                </span>
                <ChevronDown 
                    size={16} 
                    className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full bg-[#1a1a1a] border border-border rounded shadow-2xl overflow-hidden max-h-64 flex flex-col"
                    >
                        <div className="overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#333] ${
                                        option === value ? "bg-[#2a2a2a] text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <span>{option}</span>
                                    {option === value && (
                                        <Check size={14} className="text-accent" />
                                    )}
                                </button>
                            ))}
                            {options.length === 0 && (
                                <div className="px-4 py-2.5 text-sm text-muted">No options found</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
