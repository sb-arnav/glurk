/**
 * Client-side: ask the connected Phantom wallet to sign
 * `glurk:<purpose>:<wallet>:<unix>` for lib/wallet-auth.ts verification.
 */
export async function signAuthMessage(
  purpose: string,
  wallet: string,
): Promise<{ message: string; signature: string }> {
  const sol = (window as unknown as {
    solana?: {
      signMessage?: (
        msg: Uint8Array,
        enc: string,
      ) => Promise<{ signature: Uint8Array | number[] }>;
    };
  }).solana;
  if (!sol?.signMessage) throw new Error("Your wallet does not support message signing");
  const message = `glurk:${purpose}:${wallet}:${Math.floor(Date.now() / 1000)}`;
  const resp = await sol.signMessage(new TextEncoder().encode(message), "utf8");
  const bytes =
    resp.signature instanceof Uint8Array ? resp.signature : new Uint8Array(resp.signature);
  return { message, signature: btoa(String.fromCharCode(...bytes)) };
}
