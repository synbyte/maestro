"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';

interface RepPop {
    id: number;
    x: number;
    y: number;
    amount: number;
}

interface ReputationContextType {
    triggerRepPop: (x: number, y: number, amount: number) => void;
}

const ReputationContext = createContext<ReputationContextType | undefined>(undefined);

export function useReputation() {
    const context = useContext(ReputationContext);
    if (!context) {
        throw new Error('useReputation must be used within a ReputationProvider');
    }
    return context;
}

export function ReputationProvider({ children }: { children: React.ReactNode }) {
    const [pops, setPops] = useState<RepPop[]>([]);

    const triggerRepPop = useCallback((x: number, y: number, amount: number) => {
        const id = Date.now() + Math.random();
        setPops(prev => [...prev, { id, x, y, amount }]);
        
        // Remove after animation completes
        setTimeout(() => {
            setPops(prev => prev.filter(p => p.id !== id));
        }, 1000);
    }, []);

    return (
        <ReputationContext.Provider value={{ triggerRepPop }}>
            {children}
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                <AnimatePresence>
                    {pops.map(pop => (
                        <motion.div
                            key={pop.id}
                            initial={{ opacity: 0, scale: 0.5, x: pop.x - 20, y: pop.y - 20 }}
                            animate={{ 
                                opacity: [0, 1, 1, 0], 
                                scale: [0.5, 1.2, 1, 0.8],
                                y: pop.y - 80,
                                x: pop.x - 20 + (Math.random() * 40 - 20)
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute flex items-center gap-1.5"
                        >
                            <div className="bg-yellow-500 rounded-full p-1 shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-400">
                                <Award size={14} className="text-black fill-black" />
                            </div>
                            <span className="text-yellow-500 font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                +{pop.amount}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ReputationContext.Provider>
    );
}
