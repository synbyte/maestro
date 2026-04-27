import Sidebar from "@/components/sidebar";
import { StreakTracker } from "@/components/streak-tracker";
import { PresenceProvider } from "@/components/presence-context";
import { DailyCheckIn } from "@/components/daily-checkin";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PresenceProvider>
            <DailyCheckIn />
            <StreakTracker />
            <Sidebar />
            {/* md:ml-64 offsets for the fixed desktop sidebar; pt-[57px] offsets for the sticky mobile header */}
            <div className="md:ml-64 flex flex-col min-h-screen pt-[57px] md:pt-0 w-full">
                {children}
            </div>
        </PresenceProvider>
    );
}
