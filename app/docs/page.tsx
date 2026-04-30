import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import ApiPlayground from "@/app/components/ApiPlayground";

export const metadata: Metadata = {
  title: "Glurk Docs · Build with the protocol",
  description:
    "Read credentials, verify wallets, and integrate Glurk in any language. Live API playground and zero-install integration paths.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Docs
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-12">
        <section>
          <div className="inline-flex rounded-full border border-[#5B4FE8]/20 bg-[#5B4FE8]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A79EFF] mb-5">
            For developers
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            Build on Glurk in <span className="text-[#5B4FE8]">five minutes.</span>
          </h1>
          <p className="text-white/55 text-[15px] leading-relaxed max-w-2xl">
            Three integration paths depending on what you&apos;re building. The chain
            is the source of truth — every path below reads the same on-chain state
            and returns the same identity.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
            01 · Verify a wallet
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-3">
            <code className="font-mono text-[20px] text-[#A79EFF]">GET /api/v1/check</code>
          </h2>
          <p className="text-white/55 text-[15px] leading-relaxed mb-4">
            Public REST endpoint. Returns Glurk Score, credential count, issuer count,
            and the full credential list for any wallet. No auth, no SDK install, no
            language binding required.
          </p>

          <ApiPlayground />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                cURL
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`curl 'https://glurk.slayerblade.site/api/v1/check?wallet=test:approve'

# Returns a synthetic profile with score 600 + finlit credentials.
# Swap the wallet for any real Solana address in production.`}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                JavaScript / TypeScript
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`// In tests, point at any test:<scenario> for deterministic data.
const wallet = process.env.NODE_ENV === 'test'
  ? 'test:approve'
  : walletAddress;

const res = await fetch(
  \`https://glurk.slayerblade.site/api/v1/check?wallet=\${wallet}\`,
);
const { glurkScore, credentials } = await res.json();`}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                Python
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`import requests

r = requests.get(
    "https://glurk.slayerblade.site/api/v1/check",
    params={"wallet": wallet_address},
)
data = r.json()
print(data["glurkScore"], data["credentialCount"])`}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                Go
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`url := "https://glurk.slayerblade.site/api/v1/check"
resp, _ := http.Get(url + "?wallet=" + wallet)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)`}
              </pre>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.04] p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#A79EFF]/80">
                Test mode · deterministic fixtures
              </p>
              <span className="text-[10px] font-mono text-white/30">
                no auth · no chain read · part of /api/v1 contract
              </span>
            </div>
            <p className="text-[13px] text-white/65 leading-relaxed mb-4">
              Pass <code className="font-mono text-[#A79EFF]">test:&lt;scenario&gt;</code>{" "}
              as the wallet to skip the chain read and get a synthetic-but-shape-identical
              profile. Built so you can write CI tests for high-score / low-score / no-profile
              cases without hunting for real wallets in those exact states. Responses include
              <code className="font-mono text-white/55">{" \"test\": true "}</code>
              so your code can branch if needed.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40">
                    <th className="text-left px-3 py-2">Wallet</th>
                    <th className="text-right px-3 py-2">Score</th>
                    <th className="text-right px-3 py-2">Creds</th>
                    <th className="text-left px-3 py-2 hidden sm:table-cell">Use it for</th>
                  </tr>
                </thead>
                <tbody className="text-white/75">
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">test:empty</td>
                    <td className="px-3 py-2 text-right">0</td>
                    <td className="px-3 py-2 text-right">0</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">cold-start / no-profile UX</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">test:reject</td>
                    <td className="px-3 py-2 text-right">120</td>
                    <td className="px-3 py-2 text-right">1</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">below-threshold reject path</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">test:edge</td>
                    <td className="px-3 py-2 text-right">300</td>
                    <td className="px-3 py-2 text-right">2</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">exact threshold boundary</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">test:approve</td>
                    <td className="px-3 py-2 text-right">600</td>
                    <td className="px-3 py-2 text-right">3</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">typical approve / dynamic-collateral</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">test:elite</td>
                    <td className="px-3 py-2 text-right">1000</td>
                    <td className="px-3 py-2 text-right">5</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">max-benefit / VIP code paths</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#A79EFF]">test:hire-ready</td>
                    <td className="px-3 py-2 text-right">175</td>
                    <td className="px-3 py-2 text-right">2</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">GitHub-only filter (talent flows)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
              Scenario names and their numeric outputs are stable within v1. Responses also
              set the <code className="font-mono text-white/55">X-Glurk-Test-Mode</code> header.
              Try them in the playground above.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
              Errors & response headers
            </p>
            <p className="text-[12px] text-white/55 leading-relaxed mb-3">
              All errors return <code className="font-mono text-white/75">{`{ "ok": false, "error": "<message>" }`}</code>{" "}
              with the appropriate HTTP status. Handle these in your integration:
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 mb-4">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40">
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">When</th>
                    <th className="text-left px-3 py-2 hidden sm:table-cell">What to do</th>
                  </tr>
                </thead>
                <tbody className="text-white/75">
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-yellow-300">400</td>
                    <td className="px-3 py-2">missing or malformed wallet/email</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">validate before calling — don&apos;t retry</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-red-300">401</td>
                    <td className="px-3 py-2">invalid / deactivated API key</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">check <Link href="/dashboard/keys" className="underline decoration-dotted hover:text-white/80">/dashboard/keys</Link> — don&apos;t retry</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-yellow-300">404</td>
                    <td className="px-3 py-2">no wallet linked to that email</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">treat as &quot;no profile&quot; — fall back gracefully</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-orange-300">429</td>
                    <td className="px-3 py-2">monthly quota exceeded</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">back off until reset, or upgrade tier</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-red-400">500</td>
                    <td className="px-3 py-2">RPC or backend issue</td>
                    <td className="px-3 py-2 text-white/45 hidden sm:table-cell">retry with backoff (rare — chain reads sometimes blip)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-white/55 leading-relaxed mb-3">
              Every response (success and error) sets these headers — read them
              client-side to pace requests and show usage in your own UI:
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/40">
                    <th className="text-left px-3 py-2">Header</th>
                    <th className="text-left px-3 py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-white/75">
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">X-Glurk-Tier</td>
                    <td className="px-3 py-2 text-white/55">anonymous · free · pro · enterprise</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">X-Glurk-Quota-Total</td>
                    <td className="px-3 py-2 text-white/55">monthly call cap for this tier</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-[#A79EFF]">X-Glurk-Quota-Remaining</td>
                    <td className="px-3 py-2 text-white/55">calls left this month (or <code className="text-white/40">unlimited</code> for anonymous)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#A79EFF]">X-Glurk-Test-Mode</td>
                    <td className="px-3 py-2 text-white/55">set to <code className="text-white/40">true</code> on <code className="text-white/40">test:*</code> sentinel responses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
              Response shape
            </p>
            <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`{
  "ok": true,
  "wallet": "BqHe...gagT",
  "glurkScore": 425,        // 0-1000
  "credentialCount": 5,
  "issuerCount": 2,
  "credentials": [{
    "issuer": "BqHe...gagT",
    "slug": "credit-score",
    "tier": "gold",
    "score": 90,
    "timestamp": 1714123456,
    "pda": "..."
  }],
  "network": "devnet",
  "generatedAt": 1714134567
}`}
            </pre>
            <p className="text-[12px] text-white/35 mt-3 leading-relaxed">
              Cached <code className="font-mono">s-maxage=30</code>,{" "}
              <code className="font-mono">stale-while-revalidate=120</code>. CORS open.
              Versioned under <code className="font-mono">/api/v1</code>; existing
              fields are stable within v1.
            </p>
          </div>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
            02 · Embed a verification badge
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-3">
            One iframe. Zero JS deps.
          </h2>
          <p className="text-white/55 text-[15px] leading-relaxed mb-4">
            For sites that want to surface a wallet&apos;s Glurk identity without doing
            their own rendering. Drop the iframe in, point at any wallet, done.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`<iframe src="https://glurk.slayerblade.site/embed/<wallet>"
        width="360" height="180"
        frameborder="0"
        style="border-radius:16px"></iframe>`}
          </pre>
          <p className="text-[12px] text-white/35 mt-3 leading-relaxed">
            Renders a card with the Glurk Score, credential count, and three most
            recent credentials. Background is transparent so it inherits the host
            page color. Updates live from chain on every request.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
            03 · TypeScript SDK
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-3">
            <code className="font-mono text-[20px] text-[#A79EFF]">
              @glurk-protocol/sdk
            </code>
          </h2>
          <p className="text-white/55 text-[15px] leading-relaxed mb-4">
            For TypeScript apps that want typed access to the chain. Skips the REST
            layer and reads program accounts directly. Lower latency, no protocol
            cache.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-white/75 leading-relaxed font-mono">
{`npm i @glurk-protocol/sdk

import { GlurkClient, calcGlurkScore } from '@glurk-protocol/sdk';

const client = new GlurkClient('https://api.devnet.solana.com');
const profile = await client.getProfile(userWallet);

console.log(profile.glurkScore, profile.credentials.length);`}
          </pre>
          <p className="text-[12px] text-white/35 mt-3 leading-relaxed">
            Also exports{" "}
            <code className="font-mono text-white/55">calculateDynamicCollateral</code>{" "}
            for lending integrations and{" "}
            <code className="font-mono text-white/55">calcGlurkScore</code> for
            client-side score computation. Same formula as the on-chain consumers.
          </p>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
            04 · Issue credentials (you become an issuer)
          </p>
          <h2 className="text-2xl font-black tracking-tight mb-3">
            Permissionless registration.
          </h2>
          <p className="text-white/55 text-[15px] leading-relaxed mb-4">
            The on-chain{" "}
            <code className="font-mono text-white/55">register_issuer</code>{" "}
            instruction has no protocol-admin gate. Any wallet can pay rent and become
            an issuer authority. Two paths:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/issuers/register"
              className="rounded-2xl border border-[#5B4FE8]/[0.18] bg-[#5B4FE8]/[0.06] p-5 hover:border-[#5B4FE8]/[0.4] transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8]/70 mb-2">
                Browser flow
              </p>
              <p className="text-[15px] font-bold mb-1">
                /issuers/register →
              </p>
              <p className="text-[12px] text-white/45">
                Connect Phantom, name your issuer, sign once. Done in 60 seconds, no
                code required.
              </p>
            </Link>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
                Programmatic
              </p>
              <p className="text-[15px] font-bold mb-3">SDK + Anchor</p>
              <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40 p-3 text-[10px] text-white/75 leading-relaxed font-mono">
{`await program.methods
  .registerIssuer("Your Name")
  .accounts({
    admin: wallet.publicKey,
    issuerAuthority: wallet.publicKey,
  })
  .rpc();`}
              </pre>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            Protocol reference
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="font-mono text-white/30 uppercase tracking-wider text-[10px]">
                Program ID
              </p>
              <p className="font-mono text-[#A79EFF] break-all">
                5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ
              </p>
            </div>
            <div>
              <p className="font-mono text-white/30 uppercase tracking-wider text-[10px]">
                Network
              </p>
              <p className="text-white/70">Solana Devnet</p>
            </div>
            <div>
              <p className="font-mono text-white/30 uppercase tracking-wider text-[10px]">
                RPC
              </p>
              <p className="text-white/70 break-all">https://api.devnet.solana.com</p>
            </div>
            <div>
              <p className="font-mono text-white/30 uppercase tracking-wider text-[10px]">
                Source
              </p>
              <a
                href="https://github.com/sb-arnav/glurk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7B6FF8] hover:text-white transition-colors"
              >
                github.com/sb-arnav/glurk ↗
              </a>
            </div>
          </div>
        </section>

        <section className="text-center pt-2">
          <p className="text-white/45 text-[14px] mb-4">
            Building something on Glurk? Open an issue on GitHub or DM the founder.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/keys"
              className="text-[12px] font-mono text-[#A79EFF] hover:text-white transition-colors"
            >
              your key usage →
            </Link>
            <Link
              href="/manifesto"
              className="text-[12px] font-mono text-[#7B6FF8] hover:text-white transition-colors"
            >
              read the manifesto →
            </Link>
            <Link
              href="/issuers"
              className="text-[12px] font-mono text-white/40 hover:text-white transition-colors"
            >
              browse issuers →
            </Link>
            <Link
              href="/score"
              className="text-[12px] font-mono text-white/40 hover:text-white transition-colors"
            >
              how the score works →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <span className="font-mono">/api/v1 · stable contract</span>
        </div>
      </footer>
    </div>
  );
}
