"use client";

import { usePresence } from "./presence-context";

interface UserAvatarProps {
    userId: string;
    src?: string | null;
    name?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export function UserAvatar({ userId, src, name, size = "md", className = "" }: UserAvatarProps) {
    const { onlineUsers } = usePresence();
    const isOnline = onlineUsers.has(userId);

    const sizeClasses = {
        sm: "w-6 h-6 text-[10px]",
        md: "w-8 h-8 text-xs",
        lg: "w-12 h-12 text-base",
        xl: "w-32 h-32 text-4xl"
    };

    const dotSizeClasses = {
        sm: "w-1.5 h-1.5 border",
        md: "w-2.5 h-2.5 border-2",
        lg: "w-3.5 h-3.5 border-2",
        xl: "w-6 h-6 border-4"
    };

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]} ${className}`}>
            {src ? (
                <img 
                    src={src} 
                    alt={name || "User"} 
                    className="w-full h-full rounded-full object-cover bg-[#222]" 
                />
            ) : (
                <div className="w-full h-full rounded-full bg-[#333] flex items-center justify-center font-semibold text-muted">
                    {name?.charAt(0) || "?"}
                </div>
            )}
            
            {isOnline && (
                <span 
                    className={`absolute bottom-0 right-0 rounded-full bg-green-500 border-[#121212] ${dotSizeClasses[size]}`}
                    title="Online"
                />
            )}
        </div>
    );
}
