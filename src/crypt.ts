import * as crypto from "crypto";

function hexEncode(t: Uint8Array) {
  const n = [];
  for (let i = 0; i < t.length; i++) {
    const r = t[i];
    n.push((r >>> 4).toString(16));
    n.push((15 & r).toString(16));
  }
  return n.join("");
}

async function getKey(e: string, t: string): Promise<Buffer> {
  const normalizedE = e.normalize("NFKC");
  const normalizedT = t.normalize("NFKC");
  const n: Buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(
      Buffer.from(normalizedE, "utf-8"),
      Buffer.from(normalizedT, "utf-8"),
      32,
      {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 67108864,
      },
      (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key);
        }
      }
    );
  });
  return n.subarray(n.byteOffset, n.byteOffset + n.byteLength);
}

export async function MakeKeyHash(password: string, salt: string) {
  const n = await getKey(password, salt);
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new Uint8Array(n))
  );
  return hexEncode(digest);
}
