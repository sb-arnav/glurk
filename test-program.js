import fetch from 'node-fetch';
globalThis.fetch = fetch;
import pkg from '@coral-xyz/anchor';
const { AnchorProvider, Program, Wallet, web3, BN } = pkg;
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('5FVzW7QwuETtRnBfXom3b2Rxd2R6weo1285Fywg66fCQ');
const IDL = JSON.parse(fs.readFileSync('./target/idl/glurk_protocol.json', 'utf8'));

// Load authority keypair
const authorityKey = JSON.parse(fs.readFileSync('/home/arnav/.config/solana/id.json', 'utf8'));
const authority = Keypair.fromSecretKey(Uint8Array.from(authorityKey));

const connection = new Connection('https://api.devnet.solana.com', {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  fetch: globalThis.fetch,
});
const wallet = new Wallet(authority);
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(IDL, provider);

async function main() {
  console.log('Authority:', authority.publicKey.toBase58());
  console.log('Program:', PROGRAM_ID.toBase58());
  console.log('Balance:', (await connection.getBalance(authority.publicKey)) / 1e9, 'SOL');

  // 1. Register Staq as the first issuer
  console.log('\n--- Step 1: Register Issuer ---');
  const [issuerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('issuer'), authority.publicKey.toBuffer()],
    PROGRAM_ID,
  );
  console.log('Issuer PDA:', issuerPda.toBase58());

  try {
    const tx1 = await program.methods
      .registerIssuer('Staq Financial Literacy')
      .accounts({
        admin: authority.publicKey,
        issuerAuthority: authority.publicKey,
        issuerAccount: issuerPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log('Issuer registered! Tx:', tx1);
  } catch (e) {
    if (e.message?.includes('already in use')) {
      console.log('Issuer already registered (good)');
    } else {
      console.log('Error:', e.message?.substring(0, 100));
    }
  }

  // Read issuer account
  try {
    const issuer = await program.account.issuerAccount.fetch(issuerPda);
    console.log('Issuer data:', {
      name: issuer.name,
      trustScore: issuer.trustScore,
      credentialsIssued: issuer.credentialsIssued?.toString(),
      active: issuer.active,
    });
  } catch (e) {
    console.log('Failed to read issuer:', e.message?.substring(0, 80));
  }

  // 2. Register a credential for a test user
  console.log('\n--- Step 2: Register Credential ---');
  const testUser = new PublicKey('AQEWftBuELL2vUHdwj7yYN3gMsRHbzJJjRGgdPyAQ8vN'); // Arnav's wallet
  const slug = 'credit-score';

  const [credentialPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), authority.publicKey.toBuffer(), testUser.toBuffer(), Buffer.from(slug)],
    PROGRAM_ID,
  );
  console.log('Credential PDA:', credentialPda.toBase58());

  try {
    const tx2 = await program.methods
      .registerCredential(slug, 'gold', 78, authority.publicKey)
      .accounts({
        issuerAuthority: authority.publicKey,
        issuerAccount: issuerPda,
        user: testUser,
        credentialAccount: credentialPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log('Credential registered! Tx:', tx2);
  } catch (e) {
    if (e.message?.includes('already in use')) {
      console.log('Credential already registered (good)');
    } else {
      console.log('Error:', e.message?.substring(0, 100));
    }
  }

  // Read credential
  try {
    const cred = await program.account.credentialAccount.fetch(credentialPda);
    console.log('Credential data:', {
      issuer: cred.issuer.toBase58(),
      user: cred.user.toBase58(),
      slug: cred.slug,
      tier: cred.tier,
      score: cred.score,
      timestamp: cred.timestamp?.toString(),
    });
  } catch (e) {
    console.log('Failed to read credential:', e.message?.substring(0, 80));
  }

  console.log('\n--- Done ---');
  console.log('Issuer PDA:', issuerPda.toBase58());
  console.log('Credential PDA:', credentialPda.toBase58());
  console.log('Explorer:', `https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`);
}

main().catch(console.error);
