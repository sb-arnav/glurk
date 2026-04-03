import { PublicKey } from '@solana/web3.js';

const GLURK_PROGRAM_ID = new PublicKey(
  process.env.GLURK_PROGRAM_ID || '5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ'
);

// Anchor account discriminators (first 8 bytes of sha256("account:TypeName"))
const DISCRIMINATORS = {
  CredentialAccount: Buffer.from([163, 33, 82, 244, 191, 35, 220, 78]),
  IssuerAccount: Buffer.from([126, 234, 14, 239, 71, 204, 88, 61]),
  ConsentAccount: Buffer.from([129, 26, 32, 122, 68, 134, 146, 154]),
};

/**
 * Glurk — SDK for the Glurk Identity Protocol on Solana.
 *
 * Apps trade data. Users own everything.
 *
 * Quick start:
 *   const glurk = new Glurk(connection);
 *   const cred = await glurk.verify(issuer, userWallet, "credit-score");
 *   if (cred) console.log(`Tier: ${cred.tier}, Score: ${cred.score}`);
 *   const score = await glurk.getScore(userWallet);
 */
export class Glurk {
  constructor(connection, programId = GLURK_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  findCredentialAddress(issuer, user, slug) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), issuer.toBuffer(), user.toBuffer(), Buffer.from(slug)],
      this.programId,
    );
  }

  findIssuerAddress(issuer) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), issuer.toBuffer()],
      this.programId,
    );
  }

  findConsentAddress(user, requester) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), user.toBuffer(), requester.toBuffer()],
      this.programId,
    );
  }

  async verify(issuer, user, slug) {
    const [pda] = this.findCredentialAddress(issuer, user, slug);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseCredential(account.data);
  }

  async checkIssuer(issuer) {
    const [pda] = this.findIssuerAddress(issuer);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseIssuer(account.data);
  }

  async checkConsent(user, requester) {
    const [pda] = this.findConsentAddress(user, requester);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseConsent(account.data);
  }

  async getAllCredentials(user) {
    // Filter by discriminator (CredentialAccount) + user pubkey at offset 40
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: DISCRIMINATORS.CredentialAccount.toString('base64'),
            encoding: 'base64',
          },
        },
        {
          memcmp: {
            offset: 40,
            bytes: user.toBase58(),
          },
        },
      ],
    });
    return accounts
      .map((a) => ({ pubkey: a.pubkey, ...this._parseCredential(a.account.data) }))
      .filter(Boolean);
  }

  async getScore(user) {
    const creds = await this.getAllCredentials(user);
    return calcScore(creds);
  }

  // ─── Parsers (proper Borsh deserialization matching Anchor layout) ───

  _parseCredential(data) {
    try {
      const buf = Buffer.from(data);
      // Verify discriminator
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.CredentialAccount)) return null;

      let offset = 8;
      const issuer = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const user = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;

      const slugLen = buf.readUInt32LE(offset); offset += 4;
      const slug = buf.slice(offset, offset + slugLen).toString('utf8'); offset += slugLen;

      const tierLen = buf.readUInt32LE(offset); offset += 4;
      const tier = buf.slice(offset, offset + tierLen).toString('utf8'); offset += tierLen;

      const score = buf.readUInt8(offset); offset += 1;
      const mintAddress = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const timestamp = Number(buf.readBigInt64LE(offset)); offset += 8;
      const bump = buf.readUInt8(offset);

      return { issuer, user, slug, tier, score, mintAddress, timestamp, bump };
    } catch { return null; }
  }

  _parseIssuer(data) {
    try {
      const buf = Buffer.from(data);
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

      return { authority, name, trustScore, credentialsIssued, active, registeredAt, bump };
    } catch { return null; }
  }

  _parseConsent(data) {
    try {
      const buf = Buffer.from(data);
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.ConsentAccount)) return null;

      let offset = 8;
      const user = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const requester = new PublicKey(buf.slice(offset, offset + 32)); offset += 32;
      const grantedAt = Number(buf.readBigInt64LE(offset)); offset += 8;
      const active = buf.readUInt8(offset) === 1; offset += 1;
      const bump = buf.readUInt8(offset);

      return { user, requester, grantedAt, active, bump };
    } catch { return null; }
  }
}

// ─── Score calculation ───

const TIER_WEIGHTS = { platinum: 100, gold: 75, silver: 50, bronze: 25 };

export function calcScore(credentials) {
  if (!credentials || credentials.length === 0) return 0;
  let total = 0;
  for (const cred of credentials) {
    const tierWeight = TIER_WEIGHTS[cred.tier] ?? 25;
    const scoreWeight = (cred.score ?? 0) / 100;
    total += tierWeight * scoreWeight;
  }
  return Math.min(1000, Math.round(total));
}

// ─── Known addresses ───

export const KNOWN_ISSUERS = {
  STAQ: new PublicKey('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT'),
};

export const TIERS = { PLATINUM: 'platinum', GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze' };

export const DISCRIMINATOR = DISCRIMINATORS;

/** Quick helper — verify a credential from any known issuer */
export async function verifyCredential(connection, issuer, user, slug) {
  return new Glurk(connection).verify(issuer, user, slug);
}

/** Quick helper — get a user's Glurk Score */
export async function getGlurkScore(connection, user) {
  return new Glurk(connection).getScore(user);
}
