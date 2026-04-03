/**
 * POST /api/sas  { action: 'setup' }
 *   Creates the Glurk credential record and schemas in SAS (one-time).
 *
 * POST /api/sas  { action: 'attest', wallet: string }
 *   Issues SAS attestations for all existing Glurk credentials for a wallet.
 *
 * GET  /api/sas?wallet=<base58>
 *   Fetches all SAS attestations for a wallet.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from 'sas-lib';
import type { Address } from '@solana/addresses';

export const dynamic = 'force-dynamic';

const RPC_URL = 'https://api.devnet.solana.com';

// One credential name for all Glurk-issued credentials
const GLURK_CREDENTIAL_NAME = 'glurk-financial-literacy';

// Each credential type has a schema version 1
const CREDENTIAL_SCHEMAS = [
  { slug: 'credit-score', description: 'Staq credit score assessment' },
  { slug: 'stocks',       description: 'Staq stocks knowledge assessment' },
  { slug: 'upi',          description: 'Staq UPI payments assessment' },
  { slug: 'sell-rules',   description: 'Staq sell-rules assessment' },
];

function decodeBase58(str: string): Uint8Array {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const char of str) num = num * BigInt(58) + BigInt(chars.indexOf(char));
  const bytes: number[] = [];
  while (num > BigInt(0)) { bytes.unshift(Number(num % BigInt(256))); num /= BigInt(256); }
  for (const char of str) { if (char === '1') bytes.unshift(0); else break; }
  return Uint8Array.from(bytes);
}

function getAuthority(): Keypair {
  const secretKey = process.env.STAQ_AUTHORITY_SECRET_KEY;
  if (!secretKey) throw new Error('STAQ_AUTHORITY_SECRET_KEY not set');
  return Keypair.fromSecretKey(decodeBase58(secretKey));
}

/** Cast a base58 string to the branded Address type sas-lib expects */
function addr(pubkey: PublicKey | string): Address {
  return (typeof pubkey === 'string' ? pubkey : pubkey.toBase58()) as unknown as Address;
}

/**
 * Convert a sas-lib v2 instruction to a web3.js v1 TransactionInstruction.
 *
 * SAS-lib uses @solana/kit (v2) where signing is handled at the transaction
 * level, so account roles don't encode the signer bit. We patch isSigner for
 * accounts whose pubkeys match known signers (payer + authority).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sasToV1(sasIx: any, signerPubkeys: PublicKey[]): TransactionInstruction {
  const signerSet = new Set(signerPubkeys.map(p => p.toBase58()));
  return new TransactionInstruction({
    programId: new PublicKey(sasIx.programAddress),
    keys: sasIx.accounts.map((acc: { address: string; role: number }) => ({
      pubkey: new PublicKey(acc.address),
      isWritable: (acc.role & 1) !== 0,
      isSigner: signerSet.has(acc.address),
    })),
    data: Buffer.from(sasIx.data),
  });
}

// ── GET: fetch attestations for a wallet ─────────────────────────────
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'wallet param required' }, { status: 400 });

  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: 'invalid wallet' }, { status: 400 });
  }

  try {
    // fetchAllAttestation uses the sas-lib RPC client — we call it via a
    // minimal v2-compatible rpc shim by passing the connection endpoint.
    // Because sas-lib's fetch functions use @solana/kit's createSolanaRpc,
    // we need to replicate that call or use raw JSON-RPC fallback.
    const connection = new Connection(RPC_URL, 'confirmed');
    const authority = getAuthority();

    const [credentialAddress] = await deriveCredentialPda({
      authority: addr(authority.publicKey),
      name: GLURK_CREDENTIAL_NAME,
    });

    // Build expected attestation PDAs for each schema
    const attestations: Record<string, unknown>[] = [];

    for (const schema of CREDENTIAL_SCHEMAS) {
      try {
        const [schemaAddress] = await deriveSchemaPda({
          credential: credentialAddress,
          name: schema.slug,
          version: 1,
        });

        const [attestationAddress] = await deriveAttestationPda({
          credential: credentialAddress,
          schema: schemaAddress,
          nonce: addr(wallet),
        });

        const info = await connection.getAccountInfo(new PublicKey(attestationAddress));
        if (info) {
          attestations.push({
            slug: schema.slug,
            attestationAddress,
            schemaAddress,
            exists: true,
            dataLength: info.data.length,
          });
        } else {
          attestations.push({ slug: schema.slug, attestationAddress, exists: false });
        }
      } catch (e) {
        attestations.push({ slug: schema.slug, error: (e as Error).message });
      }
    }

    return NextResponse.json({
      credentialAddress,
      sasProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
      attestations,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  const connection = new Connection(RPC_URL, { commitment: 'confirmed', confirmTransactionInitialTimeout: 90_000 });
  const authority = getAuthority();

  if (action === 'setup') {
    return handleSetup(connection, authority);
  } else if (action === 'attest') {
    const wallet = body.wallet as string;
    if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });
    return handleAttest(connection, authority, wallet, body.credentialData);
  }

  return NextResponse.json({ error: 'action must be setup or attest' }, { status: 400 });
}

async function handleSetup(connection: Connection, authority: Keypair) {
  const results: string[] = [];

  try {
    // 1. Derive the credential PDA
    const [credentialAddress] = await deriveCredentialPda({
      authority: addr(authority.publicKey),
      name: GLURK_CREDENTIAL_NAME,
    });
    results.push(`Credential PDA: ${credentialAddress}`);

    // Check if credential already exists
    const credInfo = await connection.getAccountInfo(new PublicKey(credentialAddress));
    if (!credInfo) {
      // Build create_credential instruction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ix = getCreateCredentialInstruction({
        payer: addr(authority.publicKey),
        authority: addr(authority.publicKey),
        credential: credentialAddress,
        name: GLURK_CREDENTIAL_NAME,
        signers: [addr(authority.publicKey)],
      } as any);

      const tx = new Transaction().add(sasToV1(ix, [authority.publicKey]));
      tx.feePayer = authority.publicKey;
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;

      const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: 'confirmed' });
      results.push(`Credential created: ${sig}`);
    } else {
      results.push('Credential already exists');
    }

    // 2. Create a schema for each credential type
    for (const schema of CREDENTIAL_SCHEMAS) {
      try {
        const [schemaAddress] = await deriveSchemaPda({
          credential: credentialAddress,
          name: schema.slug,
          version: 1,
        });

        const schemaInfo = await connection.getAccountInfo(new PublicKey(schemaAddress));
        if (!schemaInfo) {
          // Minimal layout bytes — empty for now (schema is informational)
          const layoutBytes = new Uint8Array(0);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ix = getCreateSchemaInstruction({
            payer: addr(authority.publicKey),
            authority: addr(authority.publicKey),
            credential: credentialAddress,
            schema: schemaAddress,
            name: schema.slug,
            description: schema.description,
            // Empty layout + empty fieldNames: schema stores opaque JSON in attestation data
            layout: layoutBytes,
            fieldNames: [],
          } as any);

          const tx = new Transaction().add(sasToV1(ix, [authority.publicKey]));
          tx.feePayer = authority.publicKey;
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = blockhash;

          const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: 'confirmed' });
          results.push(`Schema ${schema.slug} created: ${sig}`);
        } else {
          results.push(`Schema ${schema.slug} already exists`);
        }
      } catch (e) {
        const errMsg = (e as Error).message ?? '';
        console.error(`Schema ${schema.slug} full error:`, errMsg);
        results.push(`Schema ${schema.slug} error: ${errMsg.slice(0, 300)}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message, results }, { status: 500 });
  }
}

async function handleAttest(
  connection: Connection,
  authority: Keypair,
  wallet: string,
  credentialData?: Record<string, { tier: string; score: number }>,
) {
  let user: PublicKey;
  try {
    user = new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: 'invalid wallet' }, { status: 400 });
  }

  const results: { slug: string; status: string; address?: string; sig?: string; error?: string }[] = [];

  try {
    const [credentialAddress] = await deriveCredentialPda({
      authority: addr(authority.publicKey),
      name: GLURK_CREDENTIAL_NAME,
    });

    for (const schema of CREDENTIAL_SCHEMAS) {
      try {
        const [schemaAddress] = await deriveSchemaPda({
          credential: credentialAddress,
          name: schema.slug,
          version: 1,
        });

        const [attestationAddress] = await deriveAttestationPda({
          credential: credentialAddress,
          schema: schemaAddress,
          nonce: addr(user),
        });

        // Skip if attestation already exists
        const existing = await connection.getAccountInfo(new PublicKey(attestationAddress));
        if (existing) {
          results.push({ slug: schema.slug, status: 'already_exists', address: attestationAddress });
          continue;
        }

        // Empty data: schema has empty layout, so attestation data must also be empty.
        // The attestation PDA's existence on-chain IS the credential proof.
        // Credential details (tier, score) remain in our Anchor CredentialAccount.
        const dataBytes = new Uint8Array(0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ix = getCreateAttestationInstruction({
          payer: addr(authority.publicKey),
          authority: addr(authority.publicKey),
          credential: credentialAddress,
          schema: schemaAddress,
          attestation: attestationAddress,
          nonce: addr(user),
          data: dataBytes,
          expiry: BigInt(0), // 0 = no expiry in SAS
        } as any);

        const tx = new Transaction().add(sasToV1(ix, [authority.publicKey]));
        tx.feePayer = authority.publicKey;
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;

        const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: 'confirmed' });
        results.push({ slug: schema.slug, status: 'attested', address: attestationAddress, sig });
      } catch (e) {
        results.push({ slug: schema.slug, status: 'error', error: (e as Error).message?.slice(0, 120) });
      }
    }

    return NextResponse.json({
      wallet,
      credentialAddress,
      sasProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
      results,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message, results }, { status: 500 });
  }
}
