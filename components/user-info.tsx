"use client";

import { UserAvatar } from "./user-avatar";
import { UserTooltip } from "./user-tooltip";
import Link from "next/link";

interface UserInfoProps {
    userId: string;
    avatarUrl?: string;
    displayName?: string;
    startDate?: string;
    timestamp?: string | Date;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function UserInfo({ 
    userId, 
    avatarUrl, 
    displayName, 
    startDate, 
    timestamp, 
    size = "md" 
}: UserInfoProps) {
    const cohortStr = startDate ? `${new Date(startDate + "T12:00:00").toLocaleString('default', { month: 'short' })}. Cohort` : "Cohort";
    const timeStr = timestamp ? new Date(timestamp).toLocaleString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: '2-digit', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    }) : null;

    return (
        <UserTooltip userId={userId}>
            <div className="flex gap-3 items-center">
                <Link href={`/profile/${userId}`} className="shrink-0 block">
                    <UserAvatar 
                        userId={userId} 
                        src={avatarUrl} 
                        name={displayName}
                        size={size}
                    />
                </Link>
                <div className="min-w-0">
                    <Link href={`/profile/${userId}`} className="font-medium text-sm text-foreground hover:underline block leading-tight">
                        {displayName || "Unknown"}
                    </Link>
                    <div className="text-[11px] text-muted block truncate">
                        {cohortStr}{timeStr && ` • ${timeStr}`}
                    </div>
                </div>
            </div>
        </UserTooltip>
    );
}
