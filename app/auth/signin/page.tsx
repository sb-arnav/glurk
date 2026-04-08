"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/profile");
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[860px]">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.04] p-6 md:p-8 shadow-[0_24px_80px_rgba(5,4,18,0.4)] backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#5B4FE8]/10 border border-[#5B4FE8]/20">
                <Image src="/glurk.png" alt="Glurk" width={34} height={34} />
              </div>
              <div>
                <p className="text-xs text-white/30 font-mono tracking-widest uppercase">
                  Glurk Protocol
                </p>
                <p className="text-sm text-white/35">Identity that compounds across apps.</p>
              </div>
            </div>

            <span className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-4">
              Account Link
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-3">
              Sign in once.
              <br />
              <span className="text-[#7B6FF8]">Use Glurk everywhere.</span>
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-xl">
              Link your Google account to your Solana wallet so apps can find the right Glurk identity
              without making users copy, paste, or memorize wallet addresses.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">1</p>
                <p className="mt-1 text-xs text-white/50">Authenticate</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">2</p>
                <p className="mt-1 text-xs text-white/50">Link wallet</p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">3</p>
                <p className="mt-1 text-xs text-white/50">Unlock apps</p>
              </div>
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-[22px] bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/[0.15] shadow-[0_16px_40px_rgba(6,5,18,0.22)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-semibold text-sm">Continue with Google</span>
            </button>

            <div className="mt-5 rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-1">
                Why this exists
              </p>
              <p className="text-xs text-white/45 leading-relaxed">
                Email lookup is an onboarding bridge. It helps apps find the right wallet-backed identity without asking users to paste addresses into every flow.
              </p>
            </div>

            <p className="text-[11px] text-white/15 mt-5 text-center lg:text-left">
              Your email is only used to link to your wallet. Never shared with apps.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/[0.08] bg-[#0D0A1F]/80 p-6 md:p-8 shadow-[0_24px_80px_rgba(5,4,18,0.36)] backdrop-blur-xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/20 mb-4">
              What You Unlock
            </p>
            <div className="space-y-4 mb-6">
              {[
                {
                  title: "Email-based discovery",
                  body: "Apps can find a user&apos;s linked Glurk identity without asking for a wallet upfront.",
                  tone: "purple",
                },
                {
                  title: "Wallet-backed reputation",
                  body: "Credentials and Glurk Score stay anchored to the wallet, not to a fragile Web2 account.",
                  tone: "blue",
                },
                {
                  title: "Cross-app continuity",
                  body: "The same identity layer compounds across lending, hiring, and future Actions/Blinks flows.",
                  tone: "purple",
                },
              ].map(({ title, body, tone }) => (
                <div key={title} className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${tone === "blue" ? "bg-blue-400" : "bg-[#7B6FF8]"}`} />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#5B4FE8]/[0.12] bg-[#5B4FE8]/[0.05] p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-2">
                Identity Loop
              </p>
              <div className="space-y-2 text-sm text-white/50">
                <p><span className="text-white/70">1.</span> Sign in with Google</p>
                <p><span className="text-white/70">2.</span> Connect and link Phantom</p>
                <p><span className="text-white/70">3.</span> Let apps discover your Glurk profile</p>
                <p><span className="text-white/70">4.</span> Gain more data every time an app reads</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
