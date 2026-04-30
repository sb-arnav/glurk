import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

/**
 * Sign-in-with-Solana — minimal implementation for proving a request
 * came from a specific wallet without running a full session layer.
 *
 * Client signs `glurk:<purpose>:<wallet>:<unix_seconds>` with their
 * Phantom wallet via `signMessage`. Server verifies the Ed25519
 * signature, the message format, the timestamp window (5 min), and
 * that the embedded wallet matches the asserted authority.
 *
 * The wallet authority is derived FROM the message — we don't trust
 * a separately-passed pubkey. That removes the substitution attack
 * where a caller signs with wallet A but claims to be wallet B.
 */

export interface VerifiedSignature {
  ok: true;
  wallet: string; // base58
}

export interface VerificationFailure {
  ok: false;
  error: string;
}

export type VerifyResult = VerifiedSignature | VerificationFailure;

export function buildAuthMessage(purpose: string, wallet: string, unixSeconds?: number): string {
  const ts = unixSeconds ?? Math.floor(Date.now() / 1000);
  return `glurk:${purpose}:${wallet}:${ts}`;
}

interface VerifyInput {
  message: string;
  signature: string; // base64
  expectedPurpose: string;
  /**
   * If provided, the verified wallet must equal this exact pubkey.
   * Use this to guard endpoints scoped to a specific authority.
   */
  expectedWallet?: string;
  /** Allowed clock skew, default 5 minutes */
  maxAgeSeconds?: number;
}

export function verifyAuthMessage(input: VerifyInput): VerifyResult {
  const { message, signature, expectedPurpose, expectedWallet, maxAgeSeconds = 300 } = input;

  if (!message || !signature) {
    return { ok: false, error: "message and signature required" };
  }

  // Format: glurk:<purpose>:<wallet>:<unix>
  const parts = message.split(":");
  if (parts.length !== 4 || parts[0] !== "glurk") {
    return { ok: false, error: "malformed auth message" };
  }
  const [, purpose, walletFromMsg, tsRaw] = parts;
  if (purpose !== expectedPurpose) {
    return { ok: false, error: `wrong purpose; expected '${expectedPurpose}'` };
  }

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts)) {
    return { ok: false, error: "malformed timestamp" };
  }
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSeconds > maxAgeSeconds) {
    return { ok: false, error: "signature expired" };
  }

  if (expectedWallet && walletFromMsg !== expectedWallet) {
    return {
      ok: false,
      error: "wallet in message does not match expected authority",
    };
  }

  let pubkeyBytes: Uint8Array;
  try {
    pubkeyBytes = new PublicKey(walletFromMsg).toBytes();
  } catch {
    return { ok: false, error: "invalid wallet pubkey in message" };
  }

  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(Buffer.from(signature, "base64"));
  } catch {
    return { ok: false, error: "signature is not valid base64" };
  }

  if (sigBytes.length !== 64) {
    return { ok: false, error: "signature must be 64 bytes" };
  }

  const messageBytes = new TextEncoder().encode(message);
  const valid = nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
  if (!valid) {
    return { ok: false, error: "signature does not verify" };
  }

  return { ok: true, wallet: walletFromMsg };
}
