import { ImageResponse } from "next/og";
import { PublicKey } from "@solana/web3.js";
import { getSerializedGlurkProfile } from "@/lib/glurk-profile";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Glurk identity card";

const ISSUER_NAMES: Record<string, string> = {
  BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT: "Staq",
  JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k: "GitHub",
};

const SLUG_LABELS: Record<string, string> = {
  "credit-score": "Credit Score Basics",
  stocks: "Stock Market Basics",
  upi: "UPI Payments",
  "sell-rules": "Sell Rules",
  "github-reputation": "Developer Reputation",
  "solana-activity": "On-Chain Activity",
  "early-adopter": "Early Adopter",
};

const TIER_COLORS: Record<string, string> = {
  platinum: "#E5E4E2",
  gold: "#FFD700",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  founding: "#5B4FE8",
};

function shortenAddr(addr: string, head = 6, tail = 6) {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function isValidPubkey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;

  let score = 0;
  let credCount = 0;
  let issuerCount = 0;
  let topCreds: Array<{ slug: string; tier: string }> = [];

  if (isValidPubkey(wallet)) {
    try {
      const profile = await getSerializedGlurkProfile(wallet);
      score = profile.glurkScore;
      credCount = profile.credentials.length;
      issuerCount = new Set(profile.credentials.map((c) => c.issuer)).size;
      topCreds = [...profile.credentials]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map((c) => ({ slug: c.slug, tier: c.tier }));
    } catch {
      // unreachable wallet — render an empty card
    }
  }

  const scorePct = Math.min(score, 1000) / 1000;
  const ringR = 96;
  const ringCirc = 2 * Math.PI * ringR;
  const ringDash = ringCirc * 0.75;
  const ringFilled = ringDash * scorePct;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(circle at 20% 10%, #1a1340 0%, #0A0818 55%)",
          color: "#fff",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: brand + label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#5B4FE8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 24,
                color: "#fff",
              }}
            >
              G
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Glurk
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Public Identity · Solana
          </span>
        </div>

        {/* Body: score arc + stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 80,
            marginTop: 60,
            flexGrow: 1,
          }}
        >
          {/* Score arc */}
          <div
            style={{
              position: "relative",
              width: 240,
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={240}
              height={240}
              viewBox="0 0 240 240"
              style={{ transform: "rotate(-135deg)" }}
            >
              <circle
                cx={120}
                cy={120}
                r={ringR}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={14}
                fill="none"
                strokeDasharray={`${ringDash} ${ringCirc - ringDash}`}
                strokeLinecap="round"
              />
              <circle
                cx={120}
                cy={120}
                r={ringR}
                stroke="#5B4FE8"
                strokeWidth={14}
                fill="none"
                strokeDasharray={`${ringFilled} ${ringCirc - ringFilled}`}
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 88, fontWeight: 900, color: "#A79EFF", lineHeight: 1 }}>
                {score}
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: 4,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  marginTop: 4,
                }}
              >
                Glurk · /1000
              </span>
            </div>
          </div>

          {/* Right side: wallet + stats + creds */}
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: 3,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                Verified Identity
              </span>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {shortenAddr(wallet, 8, 8)}
              </span>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px 24px",
                  background: "rgba(91,79,232,0.10)",
                  border: "1px solid rgba(91,79,232,0.25)",
                  borderRadius: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: 3,
                    color: "rgba(167,158,255,0.7)",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                  }}
                >
                  Credentials
                </span>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
                  {credCount}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px 24px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: 3,
                    color: "rgba(255,255,255,0.45)",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                  }}
                >
                  Issuers
                </span>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
                  {issuerCount}
                </span>
              </div>
            </div>

            {topCreds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topCreds.map((c) => (
                  <div
                    key={c.slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: TIER_COLORS[c.tier] || TIER_COLORS.bronze,
                      }}
                    />
                    <span style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                      {SLUG_LABELS[c.slug] || c.slug}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        letterSpacing: 2,
                        color: TIER_COLORS[c.tier] || TIER_COLORS.bronze,
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {c.tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            The credit bureau for skills, on Solana.
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 3,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            glurk.slayerblade.site
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
