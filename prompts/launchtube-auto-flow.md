# End-to-end Launchtube demo (TypeScript)

This script shows how to **(1) generate**, **(2) activate** a credit token, **(3) build / sign** a Soroban transaction with `js-stellar-sdk`, then **(4) submit** it through Launchtube – completely hands-off.

> Works against **testnet**; swap the base URL for mainnet once comfortable.

---

## 1. Setup

```bash
mkdir launchtube-demo && cd $_
pnpm init -y                 # or npm
pnpm add @stellar/js-stellar-sdk cross-fetch dotenv ts-node typescript
npx tsc --init --rootDir src --outDir dist --resolveJsonModule --esModuleInterop
```

Create a `.env` (only needed if you already have an **auth token** for `/gen`; otherwise the script will grab public tokens):

```
AUTH_TOKEN=     # optional – only required for privileged flows
```

---

## 2. Script (`src/demo.ts`)

```ts
import fetch from "cross-fetch";
import * as StellarSdk from "@stellar/js-stellar-sdk";
import "dotenv/config";

const BASE = "https://testnet.launchtube.xyz";
const HORIZON = "https://horizon-testnet.stellar.org";

async function getCreditToken(): Promise<string> {
    const url = new URL(`${BASE}/gen`);
    url.searchParams.set("ttl", "86400"); // 24h
    url.searchParams.set("credits", "1000000"); // 1m stroops
    url.searchParams.set("count", "1");

    const headers: Record<string, string> = {};
    if (process.env.AUTH_TOKEN)
        headers["Authorization"] = `Bearer ${process.env.AUTH_TOKEN}`;

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error(`Token gen failed ${res.status}`);
    const [token] = (await res.json()) as string[];
    return token;
}

async function activateToken(token: string): Promise<void> {
    const res = await fetch(`${BASE}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }).toString(),
    });
    if (!res.ok) throw new Error(`Activation failed ${res.status}`);
}

async function buildAndSignTx(source: string): Promise<string> {
    const server = new StellarSdk.Server(HORIZON);
    const account = await server.loadAccount(source);

    // Example contract call: bump account sequence (cheap & safe)
    const fee = StellarSdk.BASE_FEE;
    const tx = new StellarSdk.TransactionBuilder(account, {
        fee,
        networkPassphrase: StellarSdk.Networks.TESTNET,
    })
        .setTimeout(30)
        .addOperation(
            StellarSdk.Operation.bumpSequence({
                bumpTo: account.sequenceNumber(),
            })
        )
        .build();

    // NOTE: using test account with secret for the demo ONLY
    tx.sign(StellarSdk.Keypair.fromSecret(process.env.SECRET!));
    return tx.toXDR();
}

async function submitViaLaunchtube(token: string, xdr: string) {
    const res = await fetch(BASE + "/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ xdr }).toString(),
    });
    const json = await res.json();
    console.log("launchtube →", json);
    console.log("credits remaining:", res.headers.get("X-Credits-Remaining"));
}

(async () => {
    const token = await getCreditToken();
    console.log("credit token:", token);
    await activateToken(token);
    console.log("activated!");

    // replace with your own funded testnet keypair
    if (!process.env.SECRET) throw new Error("Place SECRET in .env");
    const kp = StellarSdk.Keypair.fromSecret(process.env.SECRET);

    const xdr = await buildAndSignTx(kp.publicKey());
    await submitViaLaunchtube(token, xdr);
})();
```

---

## 3. Run

```bash
pnpm ts-node src/demo.ts
```

Console output should resemble:

```
credit token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
activated!
launchtube → { status: "success", tx: "40833f9c..." }
credits remaining: 899800
```

---

### What did we just do?

1. Fetched a **fresh credit token** from `/gen`.
2. **Activated** it via `/activate` so the backend will accept it.
3. Built & signed a trivial transaction with `js-stellar-sdk`.
4. Submitted the base64-XDR to Launchtube, which paid the fees & pushed it on-chain.

Swap `buildAndSignTx` for your actual Soroban contract invoke, just remember to:

-   call `server.simulateTransaction(tx)` first if you need auth entries or fee bumping (Launchtube can also simulate for you – set `sim=false` in the body to skip automatic simulation).
-   keep `setTimeout(≤30)` and inclusion fee ≤201 stroops when `sim=false`.

Happy launching! 🚀
