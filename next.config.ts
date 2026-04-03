import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
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
    ];
  },
};

export default nextConfig;
