"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/header";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
            });

            if (error) throw error;
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset link");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col mx-auto w-full max-w-sm justify-center px-6 pt-16">
                <div className="mb-8 text-center mt-[-10vh]">
                    <h1 className="text-3xl font-medium tracking-tight mb-2">Reset password</h1>
                    <p className="text-muted text-sm">We'll send you a link to reset your password.</p>
                </div>

                {isSuccess ? (
                    <div className="text-center">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                            <p className="text-sm text-emerald-400">
                                Reset link sent! Please check your email.
                            </p>
                        </div>
                        <Link href="/auth/login" className="btn btn-primary w-full">
                            Return to login
                        </Link>
                    </div>
                ) : (
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
                                placeholder="name@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending link..." : "Send reset link"}
                        </button>

                        <div className="text-center mt-6">
                            <Link href="/auth/login" className="text-sm text-muted hover:text-foreground">
                                Back to login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
