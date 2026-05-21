/**
 * Regression tests for the on-chain Glurk Protocol.
 *
 * Pins two P0 bug fixes shipped May 20-21:
 *   1. deactivate_issuer must require the issuer's own authority
 *      — previously any signer could disable any issuer.
 *   2. request_access uses init_if_needed for the contribution PDA
 *      — previously a user could not re-consent after revoke without
 *      the requester rotating slugs.
 *
 * Runs in-process via solana-bankrun + anchor-bankrun. No validator,
 * no devnet, no SOL — `npm run test:program` should pass deterministically.
 *
 * The .so is loaded by anchor-bankrun from target/deploy/glurk_protocol.so;
 * rebuild via `cd programs/glurk-protocol && cargo build-sbf` if you
 * change the program source.
 */
import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { startAnchor, BankrunProvider } from 'anchor-bankrun';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { expect } from 'chai';

import idl from '../app/idl.json';

const PROGRAM_ID = new PublicKey(idl.address);

// PDA helpers — mirror lib/glurk-program.ts so the test stays
// self-contained (no app-side imports beyond the IDL).
function issuerPda(authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('issuer'), authority.toBuffer()],
    PROGRAM_ID,
  )[0];
}
function credentialPda(issuer: PublicKey, user: PublicKey, slug: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('credential'), issuer.toBuffer(), user.toBuffer(), Buffer.from(slug)],
    PROGRAM_ID,
  )[0];
}
function consentPda(user: PublicKey, requester: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('consent'), user.toBuffer(), requester.toBuffer()],
    PROGRAM_ID,
  )[0];
}

// Fund a fresh keypair so it can pay rent + tx fees inside the in-process bank.
async function fundedKeypair(
  ctx: ProgramTestContext,
  lamports = 5_000_000_000,
): Promise<Keypair> {
  const kp = Keypair.generate();
  ctx.setAccount(kp.publicKey, {
    lamports,
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
    rentEpoch: 0,
  });
  return kp;
}

// Drive a single instruction tx through bankrun with the given signers.
// Returns the BanksTransactionMeta or throws on failure.
async function send(
  client: BanksClient,
  ctx: ProgramTestContext,
  ix: anchor.web3.TransactionInstruction,
  signers: Keypair[],
): Promise<void> {
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = ctx.lastBlockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  await client.processTransaction(tx);
}

describe('glurk-protocol regression', () => {
  let ctx: ProgramTestContext;
  let client: BanksClient;
  let program: anchor.Program<anchor.Idl>;

  before(async () => {
    ctx = await startAnchor('.', [], []);
    client = ctx.banksClient;
    const provider = new BankrunProvider(ctx);
    anchor.setProvider(provider);
    program = new anchor.Program(idl as anchor.Idl, provider);
  });

  describe('deactivate_issuer admin guard (commit f259f19)', () => {
    it('rejects deactivation by a non-authority signer', async () => {
      const issuer = await fundedKeypair(ctx);
      const attacker = await fundedKeypair(ctx);

      // Register issuer legitimately.
      const registerIx = await program.methods
        .registerIssuer('VictimIssuer')
        .accounts({
          admin: issuer.publicKey,
          issuerAuthority: issuer.publicKey,
          issuerAccount: issuerPda(issuer.publicKey),
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      await send(client, ctx, registerIx, [issuer]);

      // Attacker tries to deactivate using the issuer's PDA but their own
      // signature. With the fix in place, the constraint
      // `issuer_account.authority == authority.key()` rejects this.
      const deactivateIx = await program.methods
        .deactivateIssuer()
        .accounts({
          authority: attacker.publicKey,
          issuerAccount: issuerPda(issuer.publicKey),
        })
        .instruction();

      let threw = false;
      try {
        await send(client, ctx, deactivateIx, [attacker]);
      } catch (e) {
        threw = true;
        // Either Unauthorized (anchor error) or a seeds/PDA mismatch on the
        // issuer_account constraint — both prove the guard rejected the call.
        const msg = (e as Error).message ?? '';
        expect(msg.length).to.be.greaterThan(0);
      }
      expect(threw, 'attacker should not be able to deactivate someone else').to.equal(true);

      // The legitimate issuer can still deactivate themselves.
      const selfDeactivateIx = await program.methods
        .deactivateIssuer()
        .accounts({
          authority: issuer.publicKey,
          issuerAccount: issuerPda(issuer.publicKey),
        })
        .instruction();
      await send(client, ctx, selfDeactivateIx, [issuer]);

      const issuerAccount = await program.account.issuerAccount.fetch(
        issuerPda(issuer.publicKey),
      );
      expect(issuerAccount.active).to.equal(false);
    });
  });

  describe('request_access init_if_needed (commit f259f19)', () => {
    it('lets a user re-consent on the same slug after revoke', async () => {
      const requester = await fundedKeypair(ctx);
      const user = await fundedKeypair(ctx);
      const slug = 'trading-history';

      // Requester registers as an issuer (request_access requires their
      // issuer PDA to exist + be active).
      const registerIx = await program.methods
        .registerIssuer('LendApp')
        .accounts({
          admin: requester.publicKey,
          issuerAuthority: requester.publicKey,
          issuerAccount: issuerPda(requester.publicKey),
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      await send(client, ctx, registerIx, [requester]);

      const contrib = credentialPda(requester.publicKey, user.publicKey, slug);
      const consent = consentPda(user.publicKey, requester.publicKey);

      // First request_access — fresh state.
      const requestIx1 = await program.methods
        .requestAccess(slug, 'gold', 75)
        .accounts({
          requesterAuthority: requester.publicKey,
          user: user.publicKey,
          requesterIssuer: issuerPda(requester.publicKey),
          contributionAccount: contrib,
          consentAccount: consent,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      await send(client, ctx, requestIx1, [requester, user]);

      const consentAfterFirst = await program.account.consentAccount.fetch(consent);
      expect(consentAfterFirst.active).to.equal(true);

      // User revokes. Consent flips to inactive; contribution PDA still exists.
      const revokeIx = await program.methods
        .revokeAccess()
        .accounts({
          user: user.publicKey,
          consentAccount: consent,
          requester: requester.publicKey,
        })
        .instruction();
      await send(client, ctx, revokeIx, [user]);

      const consentAfterRevoke = await program.account.consentAccount.fetch(consent);
      expect(consentAfterRevoke.active).to.equal(false);

      // Re-consent on the same slug. With `init` this would fail with
      // AccountAlreadyInitialized on the contribution PDA. With `init_if_needed`
      // (the fix) the handler unconditionally rewrites the contribution fields
      // and the consent re-activates.
      const requestIx2 = await program.methods
        .requestAccess(slug, 'platinum', 95)
        .accounts({
          requesterAuthority: requester.publicKey,
          user: user.publicKey,
          requesterIssuer: issuerPda(requester.publicKey),
          contributionAccount: contrib,
          consentAccount: consent,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      await send(client, ctx, requestIx2, [requester, user]);

      const consentAfterReConsent = await program.account.consentAccount.fetch(consent);
      expect(consentAfterReConsent.active).to.equal(true);

      // Contribution was overwritten with the new tier/score from the second call.
      const contribAccount = await program.account.credentialAccount.fetch(contrib);
      expect(contribAccount.tier).to.equal('platinum');
      expect(contribAccount.score).to.equal(95);
    });
  });
});
