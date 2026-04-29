import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#121212]/60 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
                    <img src="/logo.png" alt="Maestro Mix" className="w-9 h-9 object-contain drop-shadow-2xl" />
                    <span className="text-lg font-bold tracking-tight text-foreground">Maestro Mix</span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/auth/login" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                        Login
                    </Link>
                    <Link href="/auth/register" className="px-5 py-2 rounded-xl bg-accent text-accent-fg text-sm font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                        Start Now
                    </Link>
                </div>
            </div>
        </header>
    );
}
