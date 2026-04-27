import Sidebar from "@/components/sidebar";
import { StreakTracker } from "@/components/streak-tracker";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            <StreakTracker />
            {/* Sidebar is hidden on mobile, 64px width on desktop */}
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {children}
            </div>
        </div>
    );
}
