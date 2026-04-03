import { PublicKey } from '@solana/web3.js';

const GLURK_PROGRAM_ID = new PublicKey(
  process.env.GLURK_PROGRAM_ID || '5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ'
);

/**
 * Glurk — SDK for the Glurk Identity Protocol on Solana.
 *
 * Apps trade data. Users own everything.
 *
 * Quick start:
 *   const glurk = new Glurk(connection);
 *   const cred = await glurk.verify(issuer, userWallet, "credit-score");
 *   if (cred) console.log(`Tier: ${cred.tier}, Score: ${cred.score}`);
 *   const score = await glurk.getScore(issuer, userWallet);
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

  async getAllCredentials(issuer, user) {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { memcmp: { offset: 8, bytes: issuer.toBase58() } },
        { memcmp: { offset: 40, bytes: user.toBase58() } },
      ],
    });
    return accounts.map((a) => this._parseCredential(a.account.data)).filter(Boolean);
  }

  async getScore(issuer, user) {
    const creds = await this.getAllCredentials(issuer, user);
    if (creds.length === 0) return 0;
    const tierWeights = { platinum: 100, gold: 75, silver: 50, bronze: 25 };
    let total = 0;
    for (const cred of creds) {
      const tierWeight = tierWeights[cred.tier] || 25;
      const scoreWeight = (cred.score || 0) / 100;
      total += tierWeight * scoreWeight;
    }
    return Math.min(1000, Math.round(total));
  }

  // Parsers — updated when IDL is available
  _parseCredential(data) {
    try {
      const buf = Buffer.from(data);
      return {
        issuer: new PublicKey(buf.slice(8, 40)),
        user: new PublicKey(buf.slice(40, 72)),
        slug: buf.slice(76, 76 + buf.readUInt32LE(72)).toString('utf8'),
        tier: 'unknown',
        score: 0,
        timestamp: 0,
        raw: buf,
      };
    } catch { return null; }
  }

  _parseIssuer(data) {
    try {
      const buf = Buffer.from(data);
      return { issuer: new PublicKey(buf.slice(8, 40)), active: buf[72] === 1, raw: buf };
    } catch { return null; }
  }

  _parseConsent(data) {
    try {
      const buf = Buffer.from(data);
      return {
        user: new PublicKey(buf.slice(8, 40)),
        requester: new PublicKey(buf.slice(40, 72)),
        active: buf[80] === 1,
        raw: buf,
      };
    } catch { return null; }
  }
}

export const KNOWN_ISSUERS = {
  STAQ: new PublicKey('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT'),
};

export const TIERS = { PLATINUM: 'platinum', GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze' };

/** Quick helper — verify a credential from any known issuer */
export async function verifyCredential(connection, issuer, user, slug) {
  return new Glurk(connection).verify(issuer, user, slug);
}

/** Quick helper — get a user's Glurk Score */
export async function getGlurkScore(connection, issuer, user) {
  return new Glurk(connection).getScore(issuer, user);
}
