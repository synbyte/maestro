import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-0 w-full z-50 bg-background border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-medium tracking-tight">
                    Maestro Mix
                </Link>
                <div className="flex items-center gap-6 text-sm">
                    <Link href="/auth/login" className="text-muted hover:text-foreground transition-colors">
                        Login
                    </Link>
                    <Link href="/auth/register" className="btn btn-primary py-2 px-4">
                        Start now
                    </Link>
                </div>
            </div>
        </header>
    );
}
