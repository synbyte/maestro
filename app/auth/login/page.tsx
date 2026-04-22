"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/header";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col mx-auto w-full max-w-sm justify-center px-6 pt-16">
                <div className="mb-8 text-center mt-[-10vh]">
                    <h1 className="text-3xl font-medium tracking-tight mb-2">Welcome back</h1>
                    <p className="text-muted text-sm">Please enter your details to sign in.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-sm rounded">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted block" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-2"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                    <hr className="flex-1 border-[#333]" />
                    <span className="text-xs text-muted font-medium uppercase tracking-wider">or continue with</span>
                    <hr className="flex-1 border-[#333]" />
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={() => alert("GitHub OAuth integration pending Phase 1.5")} className="btn btn-secondary w-full text-sm">
                        GitHub
                    </button>
                    <button type="button" onClick={() => alert("Google OAuth integration pending Phase 1.5")} className="btn btn-secondary w-full text-sm">
                        Google
                    </button>
                </div>

                <div className="mt-8 text-center text-sm text-muted">
                    Don't have an account?{" "}
                    <Link href="/auth/register" className="text-foreground hover:underline">
                        Start now
                    </Link>
                </div>
            </div>
        </>
    );
}
