import { PublicKey } from '@solana/web3.js';
import { GlurkClient } from '@glurk-protocol/sdk';

const RPC_URL = 'https://api.devnet.solana.com';

export interface SerializedCredential {
  pubkey: string;
  issuer: string;
  user: string;
  slug: string;
  tier: string;
  score: number;
  mintAddress: string;
  timestamp: number;
  bump: number;
}

export interface SerializedConsent {
  pubkey: string;
  user: string;
  requester: string;
  grantedAt: number;
  active: boolean;
  bump: number;
}

export interface SerializedGlurkProfile {
  credentials: SerializedCredential[];
  consents: SerializedConsent[];
  glurkScore: number;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getSerializedGlurkProfile(
  wallet: PublicKey | string,
): Promise<SerializedGlurkProfile> {
  const client = new GlurkClient(RPC_URL);
  const profile = await client.getProfile(wallet);

  return {
    credentials: profile.credentials.map((credential) => ({
      pubkey: credential.pubkey.toBase58(),
      issuer: credential.issuer.toBase58(),
      user: credential.user.toBase58(),
      slug: credential.slug,
      tier: credential.tier,
      score: credential.score,
      mintAddress: credential.mintAddress.toBase58(),
      timestamp: credential.timestamp,
      bump: credential.bump,
    })),
    consents: profile.consents.map((consent) => ({
      pubkey: consent.pubkey.toBase58(),
      user: consent.user.toBase58(),
      requester: consent.requester.toBase58(),
      grantedAt: consent.grantedAt,
      active: consent.active,
      bump: consent.bump,
    })),
    glurkScore: profile.glurkScore,
  };
}
