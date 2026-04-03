import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');

export async function GET() {
  const results: string[] = [];

  try {
    // Load IDL
    const idlPath = path.join(process.cwd(), 'app', 'idl.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    results.push('IDL loaded: ' + idl.instructions?.map((i: any) => i.name).join(', '));

    // Connect
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load authority from env
    const secretKey = process.env.STAQ_AUTHORITY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'No authority key configured' }, { status: 500 });
    }

    // Decode base58 secret key
    const bs58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    function decodeBase58(str: string): Uint8Array {
      let num = BigInt(0);
      for (const char of str) {
        num = num * BigInt(58) + BigInt(bs58chars.indexOf(char));
      }
      const bytes: number[] = [];
      while (num > BigInt(0)) {
        bytes.unshift(Number(num % BigInt(256)));
        num = num / BigInt(256);
      }
      for (const char of str) {
        if (char === '1') bytes.unshift(0);
        else break;
      }
      return Uint8Array.from(bytes);
    }

    const authority = Keypair.fromSecretKey(decodeBase58(secretKey));
    results.push('Authority: ' + authority.publicKey.toBase58());

    const balance = await connection.getBalance(authority.publicKey);
    results.push('Balance: ' + (balance / 1e9) + ' SOL');

    // Setup Anchor — inline wallet since anchor.Wallet removed in 0.32
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet: any = {
      publicKey: authority.publicKey,
      signTransaction: async (tx: any) => { tx.sign(authority); return tx; },
      signAllTransactions: async (txs: any[]) => { txs.forEach((tx: any) => tx.sign(authority)); return txs; },
    };
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    const program = new anchor.Program(idl, provider);

    // 1. Register issuer
    const [issuerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), authority.publicKey.toBuffer()],
      PROGRAM_ID,
    );

    try {
      const tx = await program.methods
        .registerIssuer('Staq Financial Literacy')
        .accounts({
          admin: authority.publicKey,
          issuerAuthority: authority.publicKey,
          issuerAccount: issuerPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      results.push('Issuer registered! Tx: ' + tx);
    } catch (e: any) {
      if (e.message?.includes('already in use') || e.logs?.some((l: string) => l.includes('already in use'))) {
        results.push('Issuer already registered (OK)');
      } else {
        results.push('Register issuer error: ' + (e.message || '').substring(0, 120));
      }
    }

    // Read issuer
    try {
      const issuer = await (program.account as any).issuerAccount.fetch(issuerPda);
      results.push('Issuer: ' + JSON.stringify({
        name: issuer.name,
        trustScore: issuer.trustScore,
        active: issuer.active,
        credentialsIssued: issuer.credentialsIssued?.toString(),
      }));
    } catch (e: any) {
      results.push('Read issuer error: ' + (e.message || '').substring(0, 80));
    }

    // 2. Register credential
    const testUser = new PublicKey('AQEWftBuELL2vUHdwj7yYN3gMsRHbzJJjRGgdPyAQ8vN');
    const slug = 'credit-score';

    const [credPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('credential'), authority.publicKey.toBuffer(), testUser.toBuffer(), Buffer.from(slug)],
      PROGRAM_ID,
    );

    try {
      const tx = await program.methods
        .registerCredential(slug, 'gold', 78, authority.publicKey)
        .accounts({
          issuerAuthority: authority.publicKey,
          issuerAccount: issuerPda,
          user: testUser,
          credentialAccount: credPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      results.push('Credential registered! Tx: ' + tx);
    } catch (e: any) {
      if (e.message?.includes('already in use') || e.logs?.some((l: string) => l.includes('already in use'))) {
        results.push('Credential already registered (OK)');
      } else {
        results.push('Register credential error: ' + (e.message || '').substring(0, 120));
      }
    }

    // Read credential
    try {
      const cred = await (program.account as any).credentialAccount.fetch(credPda);
      results.push('Credential: ' + JSON.stringify({
        slug: cred.slug,
        tier: cred.tier,
        score: cred.score,
        user: cred.user.toBase58().substring(0, 8) + '...',
        issuer: cred.issuer.toBase58().substring(0, 8) + '...',
      }));
    } catch (e: any) {
      results.push('Read credential error: ' + (e.message || '').substring(0, 80));
    }

    return NextResponse.json({ success: true, results, program: PROGRAM_ID.toBase58() });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, results }, { status: 500 });
  }
}
