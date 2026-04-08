import * as anchor from '@coral-xyz/anchor';
import idl from '@/app/idl.json';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

export const GLURK_PROGRAM_ID = new PublicKey(idl.address);
export const GLURK_RPC_URL = 'https://api.devnet.solana.com';
export const GLURK_SYSTEM_PROGRAM_ID = SystemProgram.programId;

export interface RequestAccessAccounts {
  requesterAuthority: PublicKey;
  user: PublicKey;
  requesterIssuer: PublicKey;
  contributionAccount: PublicKey;
  consentAccount: PublicKey;
  systemProgram: PublicKey;
}

export interface RevokeAccessAccounts {
  user: PublicKey;
  consentAccount: PublicKey;
  requester: PublicKey;
}

export interface RegisterIssuerAccounts {
  admin: PublicKey;
  issuerAuthority: PublicKey;
  issuerAccount: PublicKey;
  systemProgram: PublicKey;
}

export interface RegisterCredentialAccounts {
  issuerAuthority: PublicKey;
  issuerAccount: PublicKey;
  user: PublicKey;
  credentialAccount: PublicKey;
  systemProgram: PublicKey;
}

interface TransactionBuilder {
  transaction(): Promise<Transaction>;
  rpc(): Promise<string>;
}

interface GlurkProgramMethods {
  requestAccess(
    contributionSlug: string,
    contributionTier: string,
    contributionScore: number,
  ): {
    accounts(accounts: RequestAccessAccounts): Pick<TransactionBuilder, 'transaction'>;
  };
  revokeAccess(): {
    accounts(accounts: RevokeAccessAccounts): Pick<TransactionBuilder, 'transaction'>;
  };
  registerIssuer(name: string): {
    accounts(accounts: RegisterIssuerAccounts): Pick<TransactionBuilder, 'rpc'>;
  };
  registerCredential(
    slug: string,
    tier: string,
    score: number,
    mintAddress: PublicKey,
  ): {
    accounts(accounts: RegisterCredentialAccounts): Pick<TransactionBuilder, 'rpc'>;
  };
}

export type GlurkProgram = anchor.Program<anchor.Idl> & {
  methods: GlurkProgramMethods;
};

function createReadonlyWallet(publicKey: PublicKey): anchor.Wallet {
  const payer = Keypair.generate();
  return {
    payer,
    publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      return txs;
    },
  };
}

function createSigningWallet(signer: Keypair): anchor.Wallet {
  return {
    publicKey: signer.publicKey,
    payer: signer,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof Transaction) {
        tx.partialSign(signer);
      } else {
        tx.sign([signer]);
      }
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      for (const tx of txs) {
        if (tx instanceof Transaction) {
          tx.partialSign(signer);
        } else {
          tx.sign([signer]);
        }
      }
      return txs;
    },
  };
}

export function getGlurkConnection() {
  return new Connection(GLURK_RPC_URL, 'confirmed');
}

export function getAuthorityKeypair() {
  const secretKey = process.env.STAQ_AUTHORITY_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STAQ_AUTHORITY_SECRET_KEY not set');
  }
  return Keypair.fromSecretKey(anchor.utils.bytes.bs58.decode(secretKey));
}

export function createReadonlyGlurkProgram(
  connection: Connection,
  publicKey: PublicKey,
): GlurkProgram {
  const provider = new anchor.AnchorProvider(
    connection,
    createReadonlyWallet(publicKey),
    { commitment: 'confirmed' },
  );
  return new anchor.Program(idl as anchor.Idl, provider) as GlurkProgram;
}

export function createSigningGlurkProgram(
  connection: Connection,
  signer: Keypair,
): GlurkProgram {
  const provider = new anchor.AnchorProvider(
    connection,
    createSigningWallet(signer),
    { commitment: 'confirmed' },
  );
  return new anchor.Program(idl as anchor.Idl, provider) as GlurkProgram;
}

export function findIssuerPda(issuerAuthority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('issuer'), issuerAuthority.toBuffer()],
    GLURK_PROGRAM_ID,
  );
}

export function findContributionPda(
  issuerAuthority: PublicKey,
  user: PublicKey,
  contributionSlug: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('credential'),
      issuerAuthority.toBuffer(),
      user.toBuffer(),
      Buffer.from(contributionSlug),
    ],
    GLURK_PROGRAM_ID,
  );
}

export function findConsentPda(user: PublicKey, requester: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('consent'), user.toBuffer(), requester.toBuffer()],
    GLURK_PROGRAM_ID,
  );
}
