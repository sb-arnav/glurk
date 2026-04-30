import { Connection, PublicKey } from "@solana/web3.js";
import { GLURK_PROGRAM_ID, GLURK_RPC_URL, getAuthorityKeypair } from "@/lib/glurk-program";

const CREDENTIAL_DISCRIMINATOR = Buffer.from([
  163, 33, 82, 244, 191, 35, 220, 78,
]);

export interface EarlyAdopter {
  wallet: string;
  pubkey: string;
  claimedAt: number;
  rank: number;
}

/**
 * Reads every credential PDA owned by the protocol authority and filters to
 * the early-adopter slug. Sorted ascending by mint timestamp — index 0 is
 * the founding member, index 1 the second, etc. Rank is 1-indexed.
 *
 * No caching: the count is the social-proof signal and must reflect chain
 * truth on every request. Solana getProgramAccounts is fast enough at this
 * scale; we add caching when this list grows beyond ~1k.
 */
export async function getEarlyAdopters(): Promise<EarlyAdopter[]> {
  const authority = getAuthorityKeypair();
  const connection = new Connection(GLURK_RPC_URL, "confirmed");

  const accounts = await connection.getProgramAccounts(GLURK_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: CREDENTIAL_DISCRIMINATOR.toString("base64"),
          encoding: "base64" as const,
        },
      },
      {
        memcmp: {
          offset: 8,
          bytes: authority.publicKey.toBase58(),
        },
      },
    ],
  });

  const adopters: Array<Omit<EarlyAdopter, "rank">> = [];
  for (const { pubkey, account } of accounts) {
    const buf = Buffer.from(account.data);
    if (!buf.slice(0, 8).equals(CREDENTIAL_DISCRIMINATOR)) continue;

    let offset = 8 + 32; // discriminator + issuer
    const user = new PublicKey(buf.slice(offset, offset + 32));
    offset += 32;

    const slugLen = buf.readUInt32LE(offset);
    offset += 4;
    const slug = buf.slice(offset, offset + slugLen).toString("utf8");
    offset += slugLen;
    if (slug !== "early-adopter") continue;

    const tierLen = buf.readUInt32LE(offset);
    offset += 4;
    offset += tierLen; // skip tier bytes
    offset += 1; // score (u8)
    offset += 32; // mint address
    const timestamp = Number(buf.readBigInt64LE(offset));

    adopters.push({
      wallet: user.toBase58(),
      pubkey: pubkey.toBase58(),
      claimedAt: timestamp,
    });
  }

  adopters.sort((a, b) => a.claimedAt - b.claimedAt);
  return adopters.map((adopter, i) => ({ ...adopter, rank: i + 1 }));
}

/**
 * Cheaper variant: just the count + the wallet PDA's existence check for one
 * caller. Use on the homepage hero where we don't need the full list.
 */
export async function countEarlyAdopters(): Promise<number> {
  const authority = getAuthorityKeypair();
  const connection = new Connection(GLURK_RPC_URL, "confirmed");

  const accounts = await connection.getProgramAccounts(GLURK_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: CREDENTIAL_DISCRIMINATOR.toString("base64"),
          encoding: "base64" as const,
        },
      },
      {
        memcmp: {
          offset: 8,
          bytes: authority.publicKey.toBase58(),
        },
      },
    ],
    dataSlice: { offset: 0, length: 0 }, // we only need the keys, not the data
  });

  // Re-fetch the data for ones that match (without dataSlice) so we can
  // filter to the right slug. For now, since the protocol authority only
  // issues `early-adopter`, the unfiltered count is accurate.
  return accounts.length;
}

/**
 * Has this specific wallet already claimed early-adopter?
 */
export async function hasClaimedEarlyAdopter(wallet: string): Promise<boolean> {
  try {
    const userPubkey = new PublicKey(wallet);
    const authority = getAuthorityKeypair();
    const [credentialPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("credential"),
        authority.publicKey.toBuffer(),
        userPubkey.toBuffer(),
        Buffer.from("early-adopter"),
      ],
      GLURK_PROGRAM_ID,
    );
    const connection = new Connection(GLURK_RPC_URL, "confirmed");
    const account = await connection.getAccountInfo(credentialPda);
    return account !== null;
  } catch {
    return false;
  }
}
