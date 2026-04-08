import { Connection, PublicKey } from '@solana/web3.js';

// ─── Constants ───────────────────────────────────────────────────────────────

export const GLURK_PROGRAM_ID = new PublicKey(
  '5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ',
);

export const KNOWN_ISSUERS = {
  STAQ: new PublicKey('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT'),
  GITHUB: new PublicKey('JCpNV2vFguuNvQKcpK1Yp8xCmiyhDH7fmc5Noi25Ut4k'),
};

const DISCRIMINATORS = {
  CredentialAccount: Buffer.from([163, 33, 82, 244, 191, 35, 220, 78]),
  IssuerAccount: Buffer.from([126, 234, 14, 239, 71, 204, 88, 61]),
  ConsentAccount: Buffer.from([129, 26, 32, 122, 68, 134, 146, 154]),
};

const TIER_WEIGHTS: Record<string, number> = {
  platinum: 100,
  gold: 75,
  silver: 50,
  bronze: 25,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface Credential {
  pubkey: PublicKey;
  issuer: PublicKey;
  user: PublicKey;
  slug: string;
  tier: Tier;
  /** Module score 0–100 */
  score: number;
  mintAddress: PublicKey;
  timestamp: number;
  bump: number;
}

export interface IssuerAccount {
  pubkey: PublicKey;
  authority: PublicKey;
  name: string;
  trustScore: number;
  credentialsIssued: bigint;
  active: boolean;
  registeredAt: number;
  bump: number;
}

export interface ConsentAccount {
  pubkey: PublicKey;
  user: PublicKey;
  requester: PublicKey;
  grantedAt: number;
  active: boolean;
  bump: number;
}

export interface GlurkProfile {
  wallet: PublicKey;
  credentials: Credential[];
  consents: ConsentAccount[];
  /** 0–1000 reputation score weighted by tier and module score */
  glurkScore: number;
}

// ─── Score calculation ────────────────────────────────────────────────────────

/**
 * Calculate a Glurk Score (0–1000) from a set of credentials.
 * Weighted by tier (platinum=100, gold=75, silver=50, bronze=25) × score/100.
 */
export function calcGlurkScore(credentials: Pick<Credential, 'tier' | 'score'>[]): number {
  if (!credentials || credentials.length === 0) return 0;
  let total = 0;
  for (const cred of credentials) {
    const tierWeight = TIER_WEIGHTS[cred.tier] ?? 25;
    const scoreWeight = (cred.score ?? 0) / 100;
    total += tierWeight * scoreWeight;
  }
  return Math.min(1000, Math.round(total));
}

// ─── GlurkClient ─────────────────────────────────────────────────────────────

export class GlurkClient {
  readonly connection: Connection;
  readonly programId: PublicKey;

  constructor(connection: Connection | string, programId = GLURK_PROGRAM_ID) {
    this.connection =
      typeof connection === 'string' ? new Connection(connection, 'confirmed') : connection;
    this.programId = programId;
  }

  // ── PDA derivation ──

  findCredentialAddress(issuer: PublicKey, user: PublicKey, slug: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), issuer.toBuffer(), user.toBuffer(), Buffer.from(slug)],
      this.programId,
    );
  }

  findIssuerAddress(issuer: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), issuer.toBuffer()],
      this.programId,
    );
  }

  findConsentAddress(user: PublicKey, requester: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), user.toBuffer(), requester.toBuffer()],
      this.programId,
    );
  }

  // ── Read ──

  /**
   * Verify a specific credential issued by a known issuer.
   * Returns null if the credential does not exist on-chain.
   */
  async verifyCredential(
    issuer: PublicKey,
    user: PublicKey,
    slug: string,
  ): Promise<Credential | null> {
    const [pda] = this.findCredentialAddress(issuer, user, slug);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    const parsed = this._parseCredential(pda, Buffer.from(account.data));
    return parsed;
  }

  /**
   * Get all credentials for a user across all issuers.
   */
  async getCredentials(user: PublicKey | string): Promise<Credential[]> {
    const userPk = typeof user === 'string' ? new PublicKey(user) : user;
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: DISCRIMINATORS.CredentialAccount.toString('base64'),
            encoding: 'base64' as const,
          },
        },
        {
          memcmp: {
            offset: 40, // 8 discriminator + 32 issuer
            bytes: userPk.toBase58(),
          },
        },
      ],
    });
    return accounts
      .map((a) => this._parseCredential(a.pubkey, Buffer.from(a.account.data)))
      .filter((c): c is Credential => c !== null);
  }

  /**
   * Get all consent grants for a user.
   */
  async getConsents(user: PublicKey | string): Promise<ConsentAccount[]> {
    const userPk = typeof user === 'string' ? new PublicKey(user) : user;
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: DISCRIMINATORS.ConsentAccount.toString('base64'),
            encoding: 'base64' as const,
          },
        },
        {
          memcmp: {
            offset: 8,
            bytes: userPk.toBase58(),
          },
        },
      ],
    });
    return accounts
      .map((a) => this._parseConsent(a.pubkey, Buffer.from(a.account.data)))
      .filter((c): c is ConsentAccount => c !== null);
  }

  /**
   * Get a user's complete Glurk profile: credentials, consents, and score.
   */
  async getProfile(user: PublicKey | string): Promise<GlurkProfile> {
    const userPk = typeof user === 'string' ? new PublicKey(user) : user;
    const [credentials, consents] = await Promise.all([
      this.getCredentials(userPk),
      this.getConsents(userPk),
    ]);
    return {
      wallet: userPk,
      credentials,
      consents,
      glurkScore: calcGlurkScore(credentials),
    };
  }

  /**
   * Get a user's Glurk Score without fetching the full profile.
   */
  async getScore(user: PublicKey | string): Promise<number> {
    const credentials = await this.getCredentials(user);
    return calcGlurkScore(credentials);
  }

  /**
   * Check if an issuer is registered on-chain.
   */
  async checkIssuer(issuer: PublicKey): Promise<IssuerAccount | null> {
    const [pda] = this.findIssuerAddress(issuer);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseIssuer(pda, Buffer.from(account.data));
  }

  /**
   * Check if a consent grant exists between a user and an app.
   */
  async checkConsent(user: PublicKey, requester: PublicKey): Promise<ConsentAccount | null> {
    const [pda] = this.findConsentAddress(user, requester);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseConsent(pda, Buffer.from(account.data));
  }

  // ── Parsers ──

  private _parseCredential(pubkey: PublicKey, buf: Buffer): Credential | null {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.CredentialAccount)) return null;

      let offset = 8;
      const issuer = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const user = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;

      const slugLen = buf.readUInt32LE(offset); offset += 4;
      const slug = buf.slice(offset, offset + slugLen).toString('utf8'); offset += slugLen;

      const tierLen = buf.readUInt32LE(offset); offset += 4;
      const tier = buf.slice(offset, offset + tierLen).toString('utf8') as Tier; offset += tierLen;

      const score = buf.readUInt8(offset); offset += 1;
      const mintAddress = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const timestamp = Number(buf.readBigInt64LE(offset)); offset += 8;
      const bump = buf.readUInt8(offset);

      return { pubkey, issuer, user, slug, tier, score, mintAddress, timestamp, bump };
    } catch {
      return null;
    }
  }

  private _parseIssuer(pubkey: PublicKey, buf: Buffer): IssuerAccount | null {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.IssuerAccount)) return null;

      let offset = 8;
      const authority = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;

      const nameLen = buf.readUInt32LE(offset); offset += 4;
      const name = buf.slice(offset, offset + nameLen).toString('utf8'); offset += nameLen;

      const trustScore = buf.readUInt8(offset); offset += 1;
      const credentialsIssued = buf.readBigUInt64LE(offset); offset += 8;
      const active = buf.readUInt8(offset) === 1; offset += 1;
      const registeredAt = Number(buf.readBigInt64LE(offset)); offset += 8;
      const bump = buf.readUInt8(offset);

      return { pubkey, authority, name, trustScore, credentialsIssued, active, registeredAt, bump };
    } catch {
      return null;
    }
  }

  private _parseConsent(pubkey: PublicKey, buf: Buffer): ConsentAccount | null {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.ConsentAccount)) return null;

      let offset = 8;
      const user = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const requester = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const grantedAt = Number(buf.readBigInt64LE(offset)); offset += 8;
      const active = buf.readUInt8(offset) === 1; offset += 1;
      const bump = buf.readUInt8(offset);

      return { pubkey, user, requester, grantedAt, active, bump };
    } catch {
      return null;
    }
  }
}

// ─── Convenience functions ───────────────────────────────────────────────────

/**
 * Verify a credential without instantiating a client.
 *
 * @example
 * const cred = await verifyCredential(connection, KNOWN_ISSUERS.STAQ, userWallet, 'credit-score');
 * if (cred) console.log(`${cred.tier} tier, score ${cred.score}/100`);
 */
export async function verifyCredential(
  connection: Connection | string,
  issuer: PublicKey,
  user: PublicKey,
  slug: string,
): Promise<Credential | null> {
  return new GlurkClient(connection).verifyCredential(issuer, user, slug);
}

/**
 * Get a user's Glurk Score (0–1000) without instantiating a client.
 *
 * @example
 * const score = await getGlurkScore(connection, userWallet);
 * if (score > 500) offerReducedCollateral();
 */
export async function getGlurkScore(
  connection: Connection | string,
  user: PublicKey | string,
): Promise<number> {
  return new GlurkClient(connection).getScore(user);
}

/**
 * Get a user's full Glurk profile without instantiating a client.
 *
 * @example
 * const { credentials, glurkScore } = await getProfile(connection, userWallet);
 */
export async function getProfile(
  connection: Connection | string,
  user: PublicKey | string,
): Promise<GlurkProfile> {
  return new GlurkClient(connection).getProfile(user);
}
