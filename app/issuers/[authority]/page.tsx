import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";

import { getIssuer } from "@/lib/issuers";
import { GLURK_PROGRAM_ID, GLURK_RPC_URL } from "@/lib/glurk-program";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CREDENTIAL_DISCRIMINATOR = Buffer.from([
  163, 33, 82, 244, 191, 35, 220, 78,
]);

const EXPLORER_BASE = "https://explorer.solana.com";

type RouteProps = {
  params: Promise<{ authority: string }>;
};

interface IssuedCredential {
  pda: string;
  user: string;
  slug: string;
  tier: string;
  score: number;
  timestamp: number;
}

async function getCredentialsByIssuer(authority: PublicKey): Promise<IssuedCredential[]> {
  const connection = new Connection(GLURK_RPC_URL, "confirmed");
  const accounts = await connection.getProgramAccounts(GLURK_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: CREDENTIAL_DISCRIMINATOR.toString("base64"),
          encoding: "base64" as const,
        },
      },
      {
        memcmp: {
          offset: 8,
          bytes: authority.toBase58(),
        },
      },
    ],
  });

  const out: IssuedCredential[] = [];
  for (const { pubkey, account } of accounts) {
    const buf = Buffer.from(account.data);
    if (!buf.slice(0, 8).equals(CREDENTIAL_DISCRIMINATOR)) continue;

    let offset = 8 + 32; // discriminator + issuer
    const user = new PublicKey(buf.slice(offset, offset + 32));
    offset += 32;

    const slugLen = buf.readUInt32LE(offset);
    offset += 4;
    const slug = buf.slice(offset, offset + slugLen).toString("utf8");
    offset += slugLen;

    const tierLen = buf.readUInt32LE(offset);
    offset += 4;
    const tier = buf.slice(offset, offset + tierLen).toString("utf8");
    offset += tierLen;

    const score = buf.readUInt8(offset);
    offset += 1;
    offset += 32; // mint
    const timestamp = Number(buf.readBigInt64LE(offset));

    out.push({ pda: pubkey.toBase58(), user: user.toBase58(), slug, tier, score, timestamp });
  }

  out.sort((a, b) => b.timestamp - a.timestamp);
  return out;
}

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function shortenAddr(addr: string, head = 4, tail = 4) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { authority } = await params;
  if (!isValidPubkey(authority)) return { title: "Glurk · Issuer not found" };

  const issuer = await getIssuer(authority);
  if (!issuer) return { title: "Glurk · Unknown issuer" };

  return {
    title: `${issuer.name} · Glurk Issuer`,
    description: `${issuer.name} has issued ${issuer.credentialsIssued.toLocaleString()} verifiable credentials on Glurk Protocol.`,
    openGraph: {
      title: `${issuer.name} · Glurk Issuer`,
      description: `${issuer.credentialsIssued.toLocaleString()} credentials issued. Verifiable on Solana.`,
    },
  };
}

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  founding: "#5B4FE8",
};

export default async function IssuerDashboardPage({ params }: RouteProps) {
  const { authority } = await params;
  if (!isValidPubkey(authority)) notFound();

  const issuer = await getIssuer(authority);
  if (!issuer) notFound();

  let credentials: IssuedCredential[] = [];
  try {
    credentials = await getCredentialsByIssuer(new PublicKey(authority));
  } catch {
    credentials = [];
  }

  const uniqueUsers = new Set(credentials.map((c) => c.user)).size;
  const oldestClaim = credentials.at(-1)?.timestamp ?? issuer.registeredAt;
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() / 1000 - issuer.registeredAt) / 86400),
  );

  return (
    <div className="min-h-screen bg-[#0A0818] text-white">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/glurk.png" alt="Glurk" width={20} height={20} />
            <span className="font-bold text-sm">Glurk</span>
          </Link>
          <Link
            href="/issuers"
            className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            ← all issuers
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-8 shadow-[0_24px_80px_rgba(5,4,18,0.32)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#7B6FF8] mb-2">
                Glurk Issuer · {issuer.active ? "Active" : "Inactive"}
              </p>
              <h1 className="text-3xl font-black tracking-tight truncate">{issuer.name}</h1>
              <a
                href={`${EXPLORER_BASE}/address/${issuer.pda}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors break-all"
              >
                pda · {shortenAddr(issuer.pda, 8, 8)} ↗
              </a>
            </div>
            <span
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md ${
                issuer.active
                  ? "bg-[#5B4FE8]/10 text-[#7B6FF8] border border-[#5B4FE8]/20"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.08]"
              }`}
            >
              trust {issuer.trustScore}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Credentials
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {credentials.length.toLocaleString()}
              </p>
              {issuer.credentialsIssued !== credentials.length && (
                <p className="text-[10px] font-mono text-white/30 mt-0.5">
                  on-chain counter: {issuer.credentialsIssued}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Unique Users
              </p>
              <p className="mt-1 text-2xl font-black text-white">{uniqueUsers}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                Active Days
              </p>
              <p className="mt-1 text-2xl font-black text-white">{ageDays}</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
                First Mint
              </p>
              <p className="mt-1 text-[12px] text-white/60">
                {credentials.length > 0
                  ? new Date(oldestClaim * 1000).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/25 mb-3">
            Issued credentials · newest first
          </p>
          {credentials.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/55 mb-4">
                {issuer.name} hasn&apos;t issued any credentials yet.
              </p>
              <p className="text-[12px] text-white/30 leading-relaxed max-w-md mx-auto">
                Issuers write credentials by signing a{" "}
                <code className="font-mono text-white/50">register_credential</code>{" "}
                transaction with the SDK or directly via Anchor.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {credentials.slice(0, 100).map((cred) => (
                <div
                  key={cred.pda}
                  className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] last:border-b-0 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: TIER_COLORS[cred.tier] || TIER_COLORS.bronze }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {cred.slug.replace(/-/g, " ")}
                      </p>
                      <Link
                        href={`/p/${cred.user}`}
                        className="text-[11px] font-mono text-white/30 hover:text-[#7B6FF8] transition-colors truncate block"
                      >
                        → {shortenAddr(cred.user, 6, 6)}
                      </Link>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: TIER_COLORS[cred.tier] || TIER_COLORS.bronze,
                      }}
                    >
                      {cred.tier}
                    </span>
                    <span className="text-[11px] text-white/30 hidden sm:inline">
                      {new Date(cred.timestamp * 1000).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <a
                      href={`${EXPLORER_BASE}/address/${cred.pda}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-white/25 hover:text-white/60 transition-colors"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              ))}
              {credentials.length > 100 && (
                <p className="text-center text-[11px] font-mono text-white/30 py-4">
                  showing 100 of {credentials.length}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
            Issue credentials with the SDK
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 text-[12px] text-white/75 leading-relaxed font-mono">
{`import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

// Sign as the issuer authority — same wallet you registered with
await program.methods
  .registerCredential('module-slug', 'gold', 90, mintPubkey)
  .accounts({
    issuerAuthority: issuerWallet.publicKey,
    user: targetUser,
    issuerAccount: issuerPda,
    credentialAccount: credentialPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();`}
          </pre>
          <p className="text-[12px] text-white/35 mt-3 leading-relaxed">
            The credential PDA is deterministic:{" "}
            <code className="font-mono text-white/50">
              [&quot;credential&quot;, issuerAuthority, user, slug]
            </code>
            . Same wallet + same slug + same user = idempotent. Re-issuing the same
            credential to the same user fails — by design.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-white/20">
          <span>Glurk Protocol</span>
          <Link href="/issuers" className="font-mono hover:text-white/50 transition-colors">
            all issuers →
          </Link>
        </div>
      </footer>
    </div>
  );
}
