import Link from "next/link";
import Header from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-16">
        <div className="max-w-3xl text-center space-y-8 mt-[-10vh]">
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight">
            Connect. Study. <br />
            Learn & Grow Together.
          </h1>
          <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto leading-relaxed">
            Don't study in a silo. Sync up with peers on the same lessons, troubleshoot challenges together, and showcase your latest projects in a community built for your success.</p>
          <div className="pt-8">
            <Link href="/auth/register" className="btn btn-primary text-lg px-8 py-4">
              Start now
            </Link>
          </div>
          <p className="text-xs text-muted pt-4">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}
