import { Connection, PublicKey } from "@solana/web3.js";
import { GLURK_PROGRAM_ID, GLURK_RPC_URL } from "@/lib/glurk-program";

const ISSUER_DISCRIMINATOR = Buffer.from([
  126, 234, 14, 239, 71, 204, 88, 61,
]);

export interface IssuerSummary {
  authority: string;
  pda: string;
  name: string;
  trustScore: number;
  credentialsIssued: number;
  active: boolean;
  registeredAt: number;
}

/**
 * Reads every IssuerAccount PDA owned by the program. The chain has no
 * pagination filter for issuers (count is small), so a single
 * getProgramAccounts is enough at this scale. Add caching when the network
 * grows past ~1k issuers.
 */
export async function getAllIssuers(): Promise<IssuerSummary[]> {
  const connection = new Connection(GLURK_RPC_URL, "confirmed");
  const accounts = await connection.getProgramAccounts(GLURK_PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: ISSUER_DISCRIMINATOR.toString("base64"),
          encoding: "base64" as const,
        },
      },
    ],
  });

  const issuers: IssuerSummary[] = [];
  for (const { pubkey, account } of accounts) {
    const buf = Buffer.from(account.data);
    if (!buf.slice(0, 8).equals(ISSUER_DISCRIMINATOR)) continue;

    let offset = 8;
    const authority = new PublicKey(buf.slice(offset, offset + 32));
    offset += 32;

    const nameLen = buf.readUInt32LE(offset);
    offset += 4;
    const name = buf.slice(offset, offset + nameLen).toString("utf8");
    offset += nameLen;

    const trustScore = buf.readUInt8(offset);
    offset += 1;
    const credentialsIssued = Number(buf.readBigUInt64LE(offset));
    offset += 8;
    const active = buf.readUInt8(offset) === 1;
    offset += 1;
    const registeredAt = Number(buf.readBigInt64LE(offset));

    issuers.push({
      authority: authority.toBase58(),
      pda: pubkey.toBase58(),
      name,
      trustScore,
      credentialsIssued,
      active,
      registeredAt,
    });
  }

  // Most credentials issued first → established issuers feel like the network.
  issuers.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return b.credentialsIssued - a.credentialsIssued;
  });
  return issuers;
}

export async function getIssuer(authority: string): Promise<IssuerSummary | null> {
  try {
    const authorityPubkey = new PublicKey(authority);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("issuer"), authorityPubkey.toBuffer()],
      GLURK_PROGRAM_ID,
    );
    const connection = new Connection(GLURK_RPC_URL, "confirmed");
    const account = await connection.getAccountInfo(pda);
    if (!account) return null;

    const buf = Buffer.from(account.data);
    if (!buf.slice(0, 8).equals(ISSUER_DISCRIMINATOR)) return null;

    let offset = 8;
    const parsedAuthority = new PublicKey(buf.slice(offset, offset + 32));
    offset += 32;
    const nameLen = buf.readUInt32LE(offset);
    offset += 4;
    const name = buf.slice(offset, offset + nameLen).toString("utf8");
    offset += nameLen;
    const trustScore = buf.readUInt8(offset);
    offset += 1;
    const credentialsIssued = Number(buf.readBigUInt64LE(offset));
    offset += 8;
    const active = buf.readUInt8(offset) === 1;
    offset += 1;
    const registeredAt = Number(buf.readBigInt64LE(offset));

    return {
      authority: parsedAuthority.toBase58(),
      pda: pda.toBase58(),
      name,
      trustScore,
      credentialsIssued,
      active,
      registeredAt,
    };
  } catch {
    return null;
  }
}
