// src/index.ts
import { Connection, PublicKey } from "@solana/web3.js";
var GLURK_PROGRAM_ID = new PublicKey(
  "5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ"
);
var KNOWN_ISSUERS = {
  STAQ: new PublicKey("BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT")
};
var DISCRIMINATORS = {
  CredentialAccount: Buffer.from([163, 33, 82, 244, 191, 35, 220, 78]),
  IssuerAccount: Buffer.from([126, 234, 14, 239, 71, 204, 88, 61]),
  ConsentAccount: Buffer.from([129, 26, 32, 122, 68, 134, 146, 154])
};
var TIER_WEIGHTS = {
  platinum: 100,
  gold: 75,
  silver: 50,
  bronze: 25
};
function calcGlurkScore(credentials) {
  if (!credentials || credentials.length === 0) return 0;
  let total = 0;
  for (const cred of credentials) {
    const tierWeight = TIER_WEIGHTS[cred.tier] ?? 25;
    const scoreWeight = (cred.score ?? 0) / 100;
    total += tierWeight * scoreWeight;
  }
  return Math.min(1e3, Math.round(total));
}
var GlurkClient = class {
  constructor(connection, programId = GLURK_PROGRAM_ID) {
    this.connection = typeof connection === "string" ? new Connection(connection, "confirmed") : connection;
    this.programId = programId;
  }
  // ── PDA derivation ──
  findCredentialAddress(issuer, user, slug) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), issuer.toBuffer(), user.toBuffer(), Buffer.from(slug)],
      this.programId
    );
  }
  findIssuerAddress(issuer) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("issuer"), issuer.toBuffer()],
      this.programId
    );
  }
  findConsentAddress(user, requester) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("consent"), user.toBuffer(), requester.toBuffer()],
      this.programId
    );
  }
  // ── Read ──
  /**
   * Verify a specific credential issued by a known issuer.
   * Returns null if the credential does not exist on-chain.
   */
  async verifyCredential(issuer, user, slug) {
    const [pda] = this.findCredentialAddress(issuer, user, slug);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    const parsed = this._parseCredential(pda, Buffer.from(account.data));
    return parsed;
  }
  /**
   * Get all credentials for a user across all issuers.
   */
  async getCredentials(user) {
    const userPk = typeof user === "string" ? new PublicKey(user) : user;
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: DISCRIMINATORS.CredentialAccount.toString("base64"),
            encoding: "base64"
          }
        },
        {
          memcmp: {
            offset: 40,
            // 8 discriminator + 32 issuer
            bytes: userPk.toBase58()
          }
        }
      ]
    });
    return accounts.map((a) => this._parseCredential(a.pubkey, Buffer.from(a.account.data))).filter((c) => c !== null);
  }
  /**
   * Get all consent grants for a user.
   */
  async getConsents(user) {
    const userPk = typeof user === "string" ? new PublicKey(user) : user;
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: DISCRIMINATORS.ConsentAccount.toString("base64"),
            encoding: "base64"
          }
        },
        {
          memcmp: {
            offset: 8,
            bytes: userPk.toBase58()
          }
        }
      ]
    });
    return accounts.map((a) => this._parseConsent(a.pubkey, Buffer.from(a.account.data))).filter((c) => c !== null);
  }
  /**
   * Get a user's complete Glurk profile: credentials, consents, and score.
   */
  async getProfile(user) {
    const userPk = typeof user === "string" ? new PublicKey(user) : user;
    const [credentials, consents] = await Promise.all([
      this.getCredentials(userPk),
      this.getConsents(userPk)
    ]);
    return {
      wallet: userPk,
      credentials,
      consents,
      glurkScore: calcGlurkScore(credentials)
    };
  }
  /**
   * Get a user's Glurk Score without fetching the full profile.
   */
  async getScore(user) {
    const credentials = await this.getCredentials(user);
    return calcGlurkScore(credentials);
  }
  /**
   * Check if an issuer is registered on-chain.
   */
  async checkIssuer(issuer) {
    const [pda] = this.findIssuerAddress(issuer);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseIssuer(pda, Buffer.from(account.data));
  }
  /**
   * Check if a consent grant exists between a user and an app.
   */
  async checkConsent(user, requester) {
    const [pda] = this.findConsentAddress(user, requester);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseConsent(pda, Buffer.from(account.data));
  }
  // ── Parsers ──
  _parseCredential(pubkey, buf) {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.CredentialAccount)) return null;
      let offset = 8;
      const issuer = new PublicKey(buf.slice(offset, offset + 32));
      offset += 32;
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
      const mintAddress = new PublicKey(buf.slice(offset, offset + 32));
      offset += 32;
      const timestamp = Number(buf.readBigInt64LE(offset));
      offset += 8;
      const bump = buf.readUInt8(offset);
      return { pubkey, issuer, user, slug, tier, score, mintAddress, timestamp, bump };
    } catch {
      return null;
    }
  }
  _parseIssuer(pubkey, buf) {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.IssuerAccount)) return null;
      let offset = 8;
      const authority = new PublicKey(buf.slice(offset, offset + 32));
      offset += 32;
      const nameLen = buf.readUInt32LE(offset);
      offset += 4;
      const name = buf.slice(offset, offset + nameLen).toString("utf8");
      offset += nameLen;
      const trustScore = buf.readUInt8(offset);
      offset += 1;
      const credentialsIssued = buf.readBigUInt64LE(offset);
      offset += 8;
      const active = buf.readUInt8(offset) === 1;
      offset += 1;
      const registeredAt = Number(buf.readBigInt64LE(offset));
      offset += 8;
      const bump = buf.readUInt8(offset);
      return { pubkey, authority, name, trustScore, credentialsIssued, active, registeredAt, bump };
    } catch {
      return null;
    }
  }
  _parseConsent(pubkey, buf) {
    try {
      if (!buf.slice(0, 8).equals(DISCRIMINATORS.ConsentAccount)) return null;
      let offset = 8;
      const user = new PublicKey(buf.slice(offset, offset + 32));
      offset += 32;
      const requester = new PublicKey(buf.slice(offset, offset + 32));
      offset += 32;
      const grantedAt = Number(buf.readBigInt64LE(offset));
      offset += 8;
      const active = buf.readUInt8(offset) === 1;
      offset += 1;
      const bump = buf.readUInt8(offset);
      return { pubkey, user, requester, grantedAt, active, bump };
    } catch {
      return null;
    }
  }
};
async function verifyCredential(connection, issuer, user, slug) {
  return new GlurkClient(connection).verifyCredential(issuer, user, slug);
}
async function getGlurkScore(connection, user) {
  return new GlurkClient(connection).getScore(user);
}
async function getProfile(connection, user) {
  return new GlurkClient(connection).getProfile(user);
}
export {
  GLURK_PROGRAM_ID,
  GlurkClient,
  KNOWN_ISSUERS,
  calcGlurkScore,
  getGlurkScore,
  getProfile,
  verifyCredential
};
