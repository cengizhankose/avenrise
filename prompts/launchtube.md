Launchtube = a hosted relay that takes your Soroban/Stellar transactions (or just the host-function + auth entries), pays the fees, manages sequence/nonce logic, and pushes them on-chain.

Quick start (Testnet)

1. Get a JWT credit token  
   open `https://testnet.launchtube.xyz/gen` → copy one token

2. Activate it  
   `curl -G "https://testnet.launchtube.xyz/activate" --data-urlencode "token=$TOKEN"`

3. Build & sign your tx locally (soroban-cli / stellar-sdk)  
   • simulate, set fees, timeout ≤ 30 s  
   • export the signed tx as base64 XDR

4. Submit via Launchtube

```bash
curl -X POST https://testnet.launchtube.xyz/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "xdr=$SIGNED_XDR"
# response = JSON result, header X-Credits-Remaining
```

Alternate body:  
`func=<HostFunctionXDR>&auth[]=AuthEntry1XDR&sim=false` (if you want Launchtube only to submit, not simulate).

5. Check remaining credits  
   `curl -H "Authorization: Bearer $TOKEN" https://testnet.launchtube.xyz/info`

Self-hosting (optional)

```bash
git clone https://github.com/stellar/launchtube
pnpm i
cp .dev.vars.example .dev.vars   # fill env values
pnpm run dev                     # wrangler dev – runs Cloudflare worker locally
```

Key rules  
• Send `Authorization: Bearer <token>` on every call  
• Credits are deducted in stages: 100 000 on submit → refunded after sim → final fee on success  
• For mainnet tokens ask in #launchtube Discord.

Refs: [README](https://github.com/stellar/launchtube), public endpoint docs shown in the repo.

---

## Other public endpoints

### Activate a credit token (API form)

If you prefer an API POST instead of the simple GET used in _Quick start → step 2_:

```bash
curl -X POST https://testnet.launchtube.xyz/activate \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=$TOKEN"
# 204 No Content on success
```

### Claim a brand-new token (when you have a _claim code_)

```bash
# Web form (opens a simple HTML page)
curl -G "https://testnet.launchtube.xyz/claim" --data-urlencode "code=$CLAIM_CODE"

# Pure API version – returns an HTML page with the new token
curl -X POST https://testnet.launchtube.xyz/claim \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "code=$CLAIM_CODE"
```

---

## Private endpoints

_Require an **auth token** (different from the credit token). Only SDF maintainers usually need these._

### Generate many credit tokens

```bash
curl -G "https://testnet.launchtube.xyz/gen" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  --data-urlencode "ttl=86400" \
  --data-urlencode "credits=1000000" \
  --data-urlencode "count=10"
# ⇒ JSON array of 10 fresh JWT credit tokens
```

### Create a QR code for a claim link

```bash
curl -G "https://testnet.launchtube.xyz/qrcode" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  --data-urlencode "ttl=3600" \
  --data-urlencode "xlm=5" \
  --data-urlencode "claim=true" --output qrcode.png
```

### Delete a token by `sub`

```bash
curl -X DELETE https://testnet.launchtube.xyz/<SUB_VALUE> \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

### Run an arbitrary SQL query (be **careful**)

```bash
curl -X POST https://testnet.launchtube.xyz/sql \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "query=SELECT * FROM Transactions LIMIT 10" \
  --data-urlencode "args=[]"
```

### Sequencer diagnostics

```bash
curl -H "Authorization: Bearer $AUTH_TOKEN" https://testnet.launchtube.xyz/seq
```

---

Mainnet ➜ just swap the base URL to `https://launchtube.xyz` (tokens are different).
