import { PublicKey, Connection } from '@solana/web3.js';

declare const GLURK_PROGRAM_ID: PublicKey;
declare const KNOWN_ISSUERS: {
    STAQ: PublicKey;
};
type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';
interface Credential {
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
interface IssuerAccount {
    pubkey: PublicKey;
    authority: PublicKey;
    name: string;
    trustScore: number;
    credentialsIssued: bigint;
    active: boolean;
    registeredAt: number;
    bump: number;
}
interface ConsentAccount {
    pubkey: PublicKey;
    user: PublicKey;
    requester: PublicKey;
    grantedAt: number;
    active: boolean;
    bump: number;
}
interface GlurkProfile {
    wallet: PublicKey;
    credentials: Credential[];
    consents: ConsentAccount[];
    /** 0–1000 reputation score weighted by tier and module score */
    glurkScore: number;
}
/**
 * Calculate a Glurk Score (0–1000) from a set of credentials.
 * Weighted by tier (platinum=100, gold=75, silver=50, bronze=25) × score/100.
 */
declare function calcGlurkScore(credentials: Pick<Credential, 'tier' | 'score'>[]): number;
declare class GlurkClient {
    readonly connection: Connection;
    readonly programId: PublicKey;
    constructor(connection: Connection | string, programId?: PublicKey);
    findCredentialAddress(issuer: PublicKey, user: PublicKey, slug: string): [PublicKey, number];
    findIssuerAddress(issuer: PublicKey): [PublicKey, number];
    findConsentAddress(user: PublicKey, requester: PublicKey): [PublicKey, number];
    /**
     * Verify a specific credential issued by a known issuer.
     * Returns null if the credential does not exist on-chain.
     */
    verifyCredential(issuer: PublicKey, user: PublicKey, slug: string): Promise<Credential | null>;
    /**
     * Get all credentials for a user across all issuers.
     */
    getCredentials(user: PublicKey | string): Promise<Credential[]>;
    /**
     * Get all consent grants for a user.
     */
    getConsents(user: PublicKey | string): Promise<ConsentAccount[]>;
    /**
     * Get a user's complete Glurk profile: credentials, consents, and score.
     */
    getProfile(user: PublicKey | string): Promise<GlurkProfile>;
    /**
     * Get a user's Glurk Score without fetching the full profile.
     */
    getScore(user: PublicKey | string): Promise<number>;
    /**
     * Check if an issuer is registered on-chain.
     */
    checkIssuer(issuer: PublicKey): Promise<IssuerAccount | null>;
    /**
     * Check if a consent grant exists between a user and an app.
     */
    checkConsent(user: PublicKey, requester: PublicKey): Promise<ConsentAccount | null>;
    private _parseCredential;
    private _parseIssuer;
    private _parseConsent;
}
/**
 * Verify a credential without instantiating a client.
 *
 * @example
 * const cred = await verifyCredential(connection, KNOWN_ISSUERS.STAQ, userWallet, 'credit-score');
 * if (cred) console.log(`${cred.tier} tier, score ${cred.score}/100`);
 */
declare function verifyCredential(connection: Connection | string, issuer: PublicKey, user: PublicKey, slug: string): Promise<Credential | null>;
/**
 * Get a user's Glurk Score (0–1000) without instantiating a client.
 *
 * @example
 * const score = await getGlurkScore(connection, userWallet);
 * if (score > 500) offerReducedCollateral();
 */
declare function getGlurkScore(connection: Connection | string, user: PublicKey | string): Promise<number>;
/**
 * Get a user's full Glurk profile without instantiating a client.
 *
 * @example
 * const { credentials, glurkScore } = await getProfile(connection, userWallet);
 */
declare function getProfile(connection: Connection | string, user: PublicKey | string): Promise<GlurkProfile>;

export { type ConsentAccount, type Credential, GLURK_PROGRAM_ID, GlurkClient, type GlurkProfile, type IssuerAccount, KNOWN_ISSUERS, type Tier, calcGlurkScore, getGlurkScore, getProfile, verifyCredential };
