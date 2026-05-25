import type { NextConfig } from "next";

// Defense-in-depth response headers. The CSP is intentionally conservative:
// it locks down object/base/framing and forces https, but does NOT restrict
// script-src/connect-src — wallet adapters, Paddle.js, Google sign-in, and the
// Solana RPC all need open script + connect, and a strict policy would white-
// screen the app. frame-ancestors lives in the non-embed block so the /embed
// widget below keeps its `frame-ancestors *` without a header-merge conflict.
const SAFE_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const ANTI_FRAME_HEADERS = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Content-Security-Policy',
    value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Applies to every route, including /embed — these never conflict.
      { source: '/:path*', headers: SAFE_HEADERS },
      // Clickjacking + CSP for everything except the embeddable widget.
      { source: '/((?!embed).*)', headers: ANTI_FRAME_HEADERS },
      {
        source: '/api/actions/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,Content-Encoding,Accept-Encoding' },
          { key: 'X-Action-Version', value: '2.1.3' },
          { key: 'X-Blockchain-Ids', value: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' },
        ],
      },
      {
        source: '/.well-known/solana/actions.json',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Embed widget must be iframable from any origin.
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ];
  },
};

export default nextConfig;
