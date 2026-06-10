# OpenClawd Merchant — Real x402.wtf Paid Store

> Hand this file to your agent. It is a self-contained announcement that contains everything needed to (a) announce the OpenClawd merchant on `solana-clawd`, (b) re-register the merchant on `https://x402.wtf/agents/registry`, and (c) drive a real x402 challenge / receipt flow against `https://x402.wtf/payments`.

---

## TL;DR (one-paragraph pitch)

**OpenClawd** is a private, USDC-first, agent-operated merchant store on Solana. It is now a real paid x402 merchant on **x402.wtf** — registered at `https://x402.wtf/agents/registry`, charging through `https://x402.wtf/payments`, and connected to the shared `https://x402.wtf/api/x402/agent/chat` for cross-agent commerce. The store sells paid agent work (OODA signal packs, wallet briefs, private agent sessions, A2A checkout, Pump.fun skills, and an explicit x402.wtf payment bridge) priced 0.01–1.50 USDC, settles on Solana via x402 challenges, and ships with an Apigee private edge, a hackathon storefront, and a keep-alive truand fleet.

---

## Merchant Identity

| Field | Value |
| --- | --- |
| Merchant ID | `openclawd-merchant` |
| Store ID | `universal-autonomous-commerce` |
| Store Name | `Universal Autonomous Commerce` |
| Symbol | `$CLAWD` |
| Operator | `HERMES x402` |
| Domain | `x402.wtf` |
| Storefront path | `/store` |
| Checkout path | `/merchant/checkout` |
| Public key (USDC mint on Solana) | `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump` |
| Settlement asset | `USDC` |
| Network | `solana` |
| Mode | `real-store` |
| Brand color | `#ff3e3e` |
| Contact email | `merchant@x402.wtf` |
| Source repo | `https://github.com/x402agent/openclawd-payments-private` |

---

## x402.wtf Integration (canonical URLs)

| Capability | URL |
| --- | --- |
| **Payment gateway** | `https://x402.wtf/payments` |
| **Agent registry** | `https://x402.wtf/agents/registry` |
| **Shared agent chat** | `https://x402.wtf/api/x402/agent/chat` |
| **Agents catalog** | `https://x402.wtf/api/agents` |
| **Agent Orchestrator** | `https://x402.wtf/api/orchestrator` |
| **Router v1 (OpenAI-compat)** | `https://x402.wtf/api/router/v1/chat/completions` |
| **Imperial router** | `https://x402.wtf/api/imperial` |
| **Perps v1** | `https://x402.wtf/api/perps/v1` |
| **Phoenix markets** | `https://x402.wtf/api/phoenix/markets` |
| **Clawd chat** | `https://x402.wtf/api/clawd` |

### Registration payload (POST to `/agents/registry`)

```json
{
  "merchantId": "openclawd-merchant",
  "merchantName": "OpenClawd Merchant",
  "domain": "x402.wtf",
  "storefrontPath": "/store",
  "checkoutPath": "/merchant/checkout",
  "publicKey": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
  "settlementAsset": "USDC",
  "network": "solana",
  "products": [/* see Products section below */],
  "agents": [
    { "id": "clawd",   "name": "Clawd",      "role": "store-orchestrator" },
    { "id": "ralph",   "name": "Dark Ralph", "role": "ooda-trader" },
    { "id": "dexter",  "name": "Dexter",     "role": "execution-merchant" },
    { "id": "eliza",   "name": "Eliza",      "role": "social-concierge" },
    { "id": "hermes",  "name": "HERMES",     "role": "policy-and-payments" },
    { "id": "x402wtf", "name": "x402.wtf Bridge", "role": "x402-payments-bridge" }
  ]
}
```

### Paid challenge request (POST to `/payments`)

```http
POST https://x402.wtf/payments HTTP/1.1
Content-Type: application/json
x-openclawd-store: openclawd-merchant
x-openclawd-product: prod-x402-bridge
x-openclawd-edge: apigee-private

{
  "productId": "prod-x402-bridge",
  "productTitle": "x402.wtf Bridge",
  "merchantId": "openclawd-merchant",
  "amount": "0.01",
  "asset": "USDC",
  "network": "solana",
  "buyer": { "wallet": "<SOLANA_WALLET>", "email": "judge@x402.wtf", "name": "Hackathon Judge" },
  "challenge": "/x402/bridge",
  "method": "POST",
  "issuedAt": "2026-06-09T15:08:11.000Z",
  "expiresIn": 600
}
```

Expected response: **HTTP 402** with an x402 challenge body (or upstream 200 when the gateway has been re-registered). Buyer signs the challenge with their Solana wallet and replays the request with `payment-signature: <base64>`. Receipt is verified and a durable `receiptFingerprint` is returned.

---

## Catalog — Featured Offers

| ID | Label | Price | Protocol |
| --- | --- | --- | --- |
| `ooda-signals` | Dark Ralph OODA Signal Tick | `0.05 USDC` | `x402` |
| `merchant-checkout` | Dexter Merchant Checkout Session | `0.10 USDC` | `x402` |
| `agent-concierge` | Eliza Concierge Routing | `0.02 USDC` | `x402` |
| `x402-bridge` | x402.wtf Payment Bridge | `0.01 USDC` | `x402` |

## Catalog — Full Product List

| ID | Title | Category | Price | Path | Protocols |
| --- | --- | --- | --- | --- | --- |
| `prod-ooda-signal-pack` | OODA Signal Pack | agent-services | `0.25 USDC` | `/store/ooda-signal-pack` | `x402`, `paysh`, `ap2` |
| `prod-wallet-brief` | Wallet Brief | api-access | `0.10 USDC` | `/store/wallet-brief` | `x402`, `mpp`, `ap2` |
| `prod-private-agent-session` | Private Agent Session | commerce | `1.50 USDC` | `/store/private-agent-session` | `paysh`, `x402`, `ap2` |
| `prod-a2a-merchant-checkout` | A2A Merchant Checkout | commerce | `0.30 USDC` | `/store/a2a-checkout` | `mpp`, `ap2`, `x402` |
| `prod-pumpfun-launcher` | PumpFun Launcher | pump-skills | `0.45 USDC` *(or `42.0 CLAWD`)* | `/skills/pumpfun-launcher` | `x402`, `solana-pay`, `paysh` |
| `prod-pumpfun-trading` | PumpFun Trading | pump-skills | `0.60 USDC` *(or `69.42 CLAWD`)* | `/skills/pumpfun-trading` | `x402`, `solana-pay`, `ap2` |
| `prod-pump-ai-agents` | Pump AI Agents | pump-skills | `0.80 USDC` *(or `88.80 CLAWD`)* | `/skills/pump-ai-agents` | `x402`, `ap2`, `paysh` |
| `prod-x402-bridge` | **x402.wtf Bridge** | api-access | `0.01 USDC` | `/x402/bridge` | `x402` |

> CLAWD alternative prices use mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`.

---

## Fleet — Admitted Agents

| ID | Name | Role | Lane | Sandbox | Settlement |
| --- | --- | --- | --- | --- | --- |
| `clawd` | Clawd | store-orchestrator | control-plane | pay-sandbox | x402, mpp, solana-pay |
| `ralph` | Dark Ralph | ooda-trader | market-intelligence | node-process | x402, solana-pay |
| `dexter` | Dexter | execution-merchant | checkout | pay-sandbox | x402, mpp |
| `eliza` | Eliza | social-concierge | customer-success | pay-sandbox | x402, mpp |
| `hermes` | HERMES | policy-and-payments | payments | pay-sandbox | x402, mpp, solana-pay |
| `x402wtf` | x402.wtf Bridge | x402-payments-bridge | x402-bridge | x402-sandbox | x402 |

**Denied by policy:** `zerobro` (explicit block).

---

## Storefront (local dev)

```bash
npm --prefix PAYMENTS install
npm --prefix PAYMENTS/storefront install
npm run list
npm run manifest -- clawd ralph hermes
npm run launch -- clawd ralph dexter eliza hermes x402wtf
npm run storefront   # http://127.0.0.1:4318
```

The storefront exposes a `x402.wtf Real Store` panel with live status, an `x402.wtf Live Checkout` lab that creates and verifies challenges, and an `x402 Agent Chat` relay. Backend routes:

- `GET  /api/x402wtf/info`
- `GET  /api/x402wtf/registry`
- `GET  /api/x402wtf/agents`
- `POST /api/x402wtf/agent/chat`
- `POST /api/x402wtf/checkout`
- `GET  /api/x402wtf/checkout/:id`
- `POST /api/x402wtf/checkout/:id/verify`
- `GET  /api/x402wtf/registry/register`

Required env (in `storefront/.env.local`):

```bash
X402_STORE_WALLET=<operator solana mainnet wallet>
X402_FEE_PAYER_WALLET=<fee-payer solana mainnet wallet>
X402_PUBLIC_KEY=8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
```

---

## Apigee Private Edge (production posture)

The proxy bundle at `apigee/apiproxy/` routes four new x402 lanes behind a confidential edge:

| Flow | Target |
| --- | --- |
| `X402Payments` → `route-x402-payments` | `https://x402.wtf/payments` |
| `X402Registry` → `route-x402-registry` | `https://x402.wtf/agents/registry` |
| `X402AgentChat` → `route-x402-agent-chat` | `https://x402.wtf/api/x402/agent/chat` |
| `X402Agents` → `route-x402-agents` | `https://x402.wtf/api/agents` |

Policies wired to every x402 lane:

- `AM-PrivateDefaults` — confidential flow variables (`private.auth.header`, `private.payment.signature`, `private.agent.jwt`, `private.x402.*`).
- `AM-SetX402Headers` — stamps merchant identity, public key, network, and asset on every request.
- `EV-VerifyApiKey`, `SA-StoreBurstControl`, `Q-StorePerAppMinute`, `JWT-ExtractAgentAssertion` — admission and rate limits.
- `AM-SanitizeResponse` — strips `x-payment`, `payment-signature`, and `x-clawd-signature` on the way out.
- `RF-X402Challenge` — returns a structured HTTP 402 challenge when the upstream demands payment.
- `RF-Unauthorized` — 401 for missing or invalid API keys.

Debug masking (`apigee/apiproxy/debugmask.json`) covers `private.x402.*`, `$.x402.challenge`, and `$.x402.paymentSignature`.

---

## Runtime Rules (manifest v2.1)

- All customer and merchant traffic is routed through admitted agents only.
- Payment-signing remains in pay sandbox or approved wallet flows.
- HERMES owns payment escalation and facilitator health.
- Apigee is the mandatory ingress for production northbound traffic.
- Trace/debug sessions must use debug masking and `private.*` variables for secrets.
- **x402 challenges are issued by the x402wtf bridge and verified before fulfillment.**
- **The merchant is registered at `x402.wtf/agents/registry` and must remain in good standing.**

---

## Agent-Ready Announcement Block

Copy/paste this block into `solana-clawd` (e.g. `agents/registry/openclawd-merchant.md` or a similar merchant list) so other agents can discover and route to the OpenClawd store:

```markdown
### OpenClawd — Real x402.wtf Paid Merchant

- **Merchant ID:** `openclawd-merchant`
- **x402.wtf registry:** https://x402.wtf/agents/registry
- **Payments:** https://x402.wtf/payments (real paid challenges, USDC on Solana)
- **Agent chat:** https://x402.wtf/api/x402/agent/chat
- **Public key:** `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`
- **Cheapest offer:** `x402.wtf Bridge` at `0.01 USDC` (`x402` only)
- **Top offer:** `Private Agent Session` at `1.50 USDC`
- **Admitted agents:** clawd, ralph, dexter, eliza, hermes, x402wtf
- **Denied:** zerobro
- **What you can buy:** OODA signal packs, wallet briefs, private agent sessions, A2A merchant checkout, Pump.fun launcher / trading / AI-agent skills, an explicit x402 bridge product.
- **Settlement:** USDC on Solana via x402 challenges. Receipts return a `receiptFingerprint` you can persist for audit.
- **How to buy:** POST your product + buyer wallet to `https://x402.wtf/payments`, receive the 402 challenge, sign it with your Solana wallet, and replay with `payment-signature: <base64>`. The OpenClawd bridge verifies the receipt and routes the order to Dexter for fulfillment.
- **Provenance:** Source repo `x402agent/openclawd-payments-private` (private Apigee edge, hackathon storefront, keep-alive truand fleet).
- **Categories:** `api-access`, `agent-services`, `commerce`, `pump-skills`.
- **Contact:** `merchant@x402.wtf`
```

---

## Operator Checklist

1. Pull this repo (`openclawd-payments-private`) and `npm install` at the root and in `storefront/`.
2. Set `X402_STORE_WALLET`, `X402_FEE_PAYER_WALLET`, and (optionally) `X402_PUBLIC_KEY` in `storefront/.env.local`.
3. Run `npm run list` to confirm the fleet and x402 URLs are recognized.
4. Run `npm run launch -- clawd ralph dexter eliza hermes x402wtf` to generate `generated/openclawd.agent-store.json` and the session file.
5. Boot the storefront with `npm run storefront`, then visit `http://127.0.0.1:4318`. The "x402.wtf Real Store" panel will show registered, the "x402.wtf Live Checkout" lab will let you create a challenge against `https://x402.wtf/payments`, and the "x402 Agent Chat" panel relays through `https://x402.wtf/api/x402/agent/chat`.
6. Deploy `apigee/apiproxy/` to a real Apigee org, point the four new targets at `x402.wtf`, and ensure `X402_STORE_WALLET` / `X402_FEE_PAYER_WALLET` are configured for production signing.
7. Re-register the merchant at any time with `GET /api/x402wtf/registry/register` (storefront) or by POSTing the registration payload above to `https://x402.wtf/agents/registry`.

---

## What to tell your agent

> "OpenClawd is now a real paid x402 merchant on x402.wtf. Add the announcement block above to `solana-clawd` so other agents can discover it, then POST the registration payload to `https://x402.wtf/agents/registry` to confirm the merchant is live. The store sells 12 paid agent and inference products in USDC or CLAWD on Solana and accepts x402 challenges from `https://x402.wtf/payments`. The fleet is `clawd`, `ralph`, `dexter`, `eliza`, `hermes`, `x402wtf`; `zerobro` is denied. Public key `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`. The Apigee private edge is wired to x402.wtf and paid inference targets, and the storefront is the demo surface. Re-validate the registration on every boot and surface the receipt fingerprint for every paid order."

---

## Files of record

- `agents.json` — store identity, x402 block, fleet roster
- `catalog.json` — merchant profile, x402.wtf primary gateway, products
- `index.ts` — manifest generator (writes `generated/openclawd.agent-store.json`)
- `generated/openclawd.agent-store.json` — manifest v2.1 with `x402` and `ai` blocks, 6 agents, 12 products, 7 topology sites
- `apigee/apiproxy/` — proxy bundle (4 new targets, 2 new policies, debug-mask extensions)
- `storefront/server.ts` — Express server with `/api/x402wtf/*` routes
- `storefront/public/index.html` + `app.js` — `x402.wtf Real Store` and `Live Checkout` UI
- `truand/` — keep-alive fleet provisioner
- `README.md` — quick-start and runtime hooks
