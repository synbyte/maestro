"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/header";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // We should check if we actually have a session
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Your reset link is invalid or has expired.");
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setIsSuccess(true);
            
            // Redirect after a short delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col mx-auto w-full max-w-sm justify-center px-6 pt-16">
                <div className="mb-8 text-center mt-[-10vh]">
                    <h1 className="text-3xl font-medium tracking-tight mb-2">Set new password</h1>
                    <p className="text-muted text-sm">Please choose a strong password you haven't used before.</p>
                </div>

                {isSuccess ? (
                    <div className="text-center">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                            <p className="text-sm text-emerald-400">
                                Password updated successfully! Redirecting to dashboard...
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-sm rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="password">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                required
                                minLength={8}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted block" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input-field"
                                required
                                minLength={8}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update password"}
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}
