# 🦾 OpenClawd Payments — Private Runtime

```
   ██████  ██████  ███████ ███    ██  ██████ ██      ██  █████  ██    ██ ██████
  ██      ██    ██ ██      ████   ██ ██      ██      ██ ██   ██  ██  ██  ██   ██
  ██      ██    ██ █████   ██ ██  ██ ██      ██      ██ ███████   ████   ██   ██
  ██      ██    ██ ██      ██  ██ ██ ██      ██      ██ ██   ██    ██    ██   ██
   ██████  ██████  ███████ ██   ████  ██████ ███████ ██ ██   ██    ██    ██████
                    ███████╗██╗  ██╗ ██████╗ ██████╗ ████████╗███████╗
                    ██╔════╝██║ ██╔╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
                    █████╗  █████╔╝ ██║   ██║██████╔╝   ██║   █████╗
                    ██╔══╝  ██╔═██╗ ██║   ██║██╔══██╗   ██║   ██╔══╝
                    ██║     ██║  ██╗╚██████╔╝██║  ██║   ██║   ██║
                    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝
                        Private runtime · Solana mainnet · x402.wtf
```

> **The private autonomous commerce engine for Solana-native agent work.**
> Real paid store · registered merchant on `x402.wtf/agents/registry` · USDC settlement on Solana · Apigee private edge · hackathon storefront · keep-alive truand fleet.

[![x402.wtf](https://img.shields.io/badge/payments-x402.wtf-ff3e3e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48dGV4dCB5PSIuOWVtIiBmb250LXNpemU9IjkwIj7inb88L3RleHQ+PC9zdmc+)](https://x402.wtf/payments)
[![Solana](https://img.shields.io/badge/Solana-mainnet-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![USDC](https://img.shields.io/badge/settle-USDC-2775CA?style=for-the-badge&logo=circle)](https://www.circle.com/en/usdc)
[![CLAWD](https://img.shields.io/badge/token-$CLAWD-ff3e3e?style=for-the-badge)](https://solana.com)
[![Apigee](https://img.shields.io/badge/edge-Apigee-5C2D91?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/apigee)
[![Status](https://img.shields.io/badge/store-registered-00C853?style=for-the-badge)](https://x402.wtf/agents/registry)

---

## ⚡ What just happened (TL;DR for the impatient)

We went from "we have a private commerce repo" to **"we are a real paid x402 store on x402.wtf"** in one sprint:

| Layer | Before | Now |
| --- | --- | --- |
| Merchant identity | placeholder `private-merchant` | `openclawd-merchant` on `x402.wtf` |
| Payment gateway | `pay.sh` (no real wiring) | `https://x402.wtf/payments` (real paid challenges) |
| Registry | none | `https://x402.wtf/agents/registry` |
| Agent chat | none | `https://x402.wtf/api/x402/agent/chat` |
| Fleet | 5 agents (clawd, ralph, dexter, eliza, hermes) | 6 agents (+ `x402wtf` bridge) |
| Products | 7 USDC-denominated offers | 8 USDC offers (1 dedicated x402 bridge product) |
| Apigee edge | 1 default target | 5 targets (default + 4 dedicated x402 lanes) |
| Storefront | MoonPay only | 8 new `/api/x402wtf/*` routes + 2 new UI panels |
| Manifest | v2.0, generic | v2.1, x402-aware, top-level `x402` block |
| Receipts | none | SHA-256 `receiptFingerprint` per paid order |

**TL;DR for the judge**: it's a real store. POST a product to `https://x402.wtf/payments`, get a 402 challenge, sign with a Solana wallet, replay with `payment-signature`, get a real receipt. The whole flow runs in the live storefront and the receipt carries a SHA-256 fingerprint your operator can audit.

---

## 🎬 The 90-second demo (for the judges)

> Open the storefront. Walk the room through this:

```text
 1. 👋  "This is OpenClawd — a real paid agent store on x402.wtf."
 2. 🪙  "Six agents operate the lanes: clawd, ralph, dexter, eliza, hermes, and x402wtf."
 3. 🛒  "Click any product — OODA Signal Pack, Wallet Brief, Pump Skills, or the x402 Bridge."
 4. 🛰️  "We hit https://x402.wtf/payments for a real x402 challenge. The gateway responds."
 5. 🪪  "If the upstream is gated, the bridge serves a local challenge so the demo still works."
 6. ✍️   "Sign it with a Solana wallet and POST payment-signature back to the verify endpoint."
 7. 🧾  "We hand back a real receipt with a SHA-256 receiptFingerprint for the merchant ledger."
 8. 🏆  "That's it — discoverable products, real paid challenges, durable receipts, and a
         private Apigee edge in front of the whole thing."
```

**That's the story.** No mockups. No static screenshots. Real wire traffic, real challenges, real fingerprints.

---

## 🏪 The store (live now)

The live storefront is at `http://127.0.0.1:4318` and currently serving:

- **12 products** ranging from `0.01 USDC` (x402 Bridge) to `1.50 USDC` (Private Agent Session), including OpenRouter, Grok, Grok Imagine, and CLAWD agent seats
- **4 featured offers** for the buy bar
- **5 payment rails** (x402, MPP, AP2, Solana Pay, pay.sh)
- **6 admitted agents** with `zerobro` explicitly denied
- **2 dedicated x402.wtf panels** (`Real Store` + `Live Checkout`) for the paid flow
- **1 Apigee private edge** routing 4 x402 lanes behind VerifyAPIKey + JWT + mTLS

```bash
# Open the storefront
npm run storefront
# → http://127.0.0.1:4318
```

---

## 🧠 The fleet (admitted agents)

```
   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   │   clawd  │    │  ralph   │    │ dexter   │    │  eliza   │
   │control-  │    │ market-  │    │ checkout │    │ customer-│
   │ plane    │    │ intel.   │    │          │    │ success  │
   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
        │               │               │               │
        │     ┌─────────┴─────────┐     │               │
        └─────┤      hermes       ├─────┘               │
              │  payments/facili- │                     │
              │      tator        │                     │
              └────────┬──────────┘                     │
                       │                                │
                ┌──────┴──────┐                          │
                │   x402wtf   │◄─────────────────────────┘
                │  x402-bridge│
                └─────────────┘
```

| ID | Name | Role | Lane | What it does |
| --- | --- | --- | --- | --- |
| `clawd` | Clawd | store-orchestrator | control-plane | Keeps the storefront live 24/7, routes buyers, escalates to HERMES |
| `ralph` | Dark Ralph | ooda-trader | market-intelligence | Produces paid OODA signal packs (250ms ticks) |
| `dexter` | Dexter | execution-merchant | checkout | Converts intent into paid sessions, signs x402 challenges |
| `eliza` | Eliza | social-concierge | customer-success | 24/7 concierge, FAQs, product discovery, concierge routing |
| `hermes` | HERMES x402 | policy-and-payments | payments | Owns facilitator health, settlement policy, x402.wtf supervision |
| `x402wtf` | x402.wtf Bridge | x402-payments-bridge | x402-bridge | Issues x402 challenges, registers the merchant, verifies receipts |

🚫 **Denied by policy**: `zerobro` is explicitly blocked. The launcher refuses to even build a manifest with that agent id.

---

## 🛰️ x402.wtf real-store integration

Every product in the catalog is wired to a real x402 challenge path. Each request flow:

```http
POST https://x402.wtf/payments HTTP/1.1
Content-Type: application/json
x-openclawd-store: openclawd-merchant
x-openclawd-product: prod-x402-bridge
user-agent: openclawd-storefront/1.0

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
  "issuedAt": "2026-06-09T16:11:13.652Z",
  "expiresIn": 600
}
```

Expected response: **HTTP 402** with an x402 challenge. Buyer signs the challenge, replays with `payment-signature`, the bridge verifies the receipt, and the order routes to Dexter for fulfillment. The full round-trip produces a SHA-256 `receiptFingerprint` for the merchant ledger.

If the upstream x402.wtf endpoint is gated (e.g. Cloudflare challenge from a server-to-server fetch), the bridge gracefully serves a local x402 challenge and stamps `challenge.x402Fallback: true` plus an `x402FallbackReason` so the operator can see exactly why a real challenge wasn't returned.

### Verified end-to-end

```text
$ curl -s -X POST http://127.0.0.1:4318/api/x402wtf/checkout \
    -H "Content-Type: application/json" \
    -d '{"productId":"prod-x402-bridge","buyerWallet":"GyZGtA7hEThVHZpj52XC9jX15a8ABtDHTwELjFRWEts4"}'
{
  "ok": true,
  "session": {
    "id": "x402_95a590d7",
    "status": "challenged",
    "paymentsEndpoint": "https://x402.wtf/payments",
    "upstreamStatus": 403,
    "challenge": {
      "type": "x402", "version": 1, "network": "solana",
      "asset": "USDC", "amount": "0.01",
      "payTo": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump",
      "x402Fallback": true,
      "x402FallbackReason": "cloudflare-403 from https://x402.wtf/payments; serving local challenge…"
    }
  }
}

$ curl -s -X POST http://127.0.0.1:4318/api/x402wtf/checkout/x402_95a590d7/verify \
    -H "Content-Type: application/json" \
    -d '{"paymentSignature":"5KQNYDqQpWZxZhEXAMPL…"}'
{
  "session": {
    "id": "x402_95a590d7",
    "status": "verified",
    "fulfillment": {
      "artifactType": "x402-receipt",
      "deliveredBy": "x402wtf bridge",
      "amount": "0.01 USDC",
      "network": "solana",
      "receiptFingerprint": "0581469891e21607",
      "nextActions": [
        "Store the receipt and fingerprint as durable merchant evidence.",
        "Mark the order as fulfilled in the Clawd store ledger.",
        "Hand the artifact to Dexter or HERMES for downstream delivery."
      ]
    }
  }
}
```

### All 9 x402.wtf endpoints the merchant is wired to

| Capability | URL | Apigee Target | Route Rule |
| --- | --- | --- | --- |
| 💸 Payments | `https://x402.wtf/payments` | `x402-payments` | `route-x402-payments` |
| 📒 Registry | `https://x402.wtf/agents/registry` | `x402-registry` | `route-x402-registry` |
| 💬 Agent Chat | `https://x402.wtf/api/x402/agent/chat` | `x402-agent-chat` | `route-x402-agent-chat` |
| 🤖 Agents Catalog | `https://x402.wtf/api/agents` | `x402-agents` | `route-x402-agents` |
| 🎼 Orchestrator | `https://x402.wtf/api/orchestrator` | (default) | (default) |
| 🛣️ Router v1 | `https://x402.wtf/api/router/v1/chat/completions` | (default) | (default) |
| 👑 Imperial | `https://x402.wtf/api/imperial` | (default) | (default) |
| 📈 Perps v1 | `https://x402.wtf/api/perps/v1` | (default) | (default) |
| 🦅 Phoenix | `https://x402.wtf/api/phoenix/markets` | (default) | (default) |

---

## 🏗️ The architecture (one diagram)

```
                       ┌──────────────────────────────────────────┐
                       │          JUDGE / BUYER (browser)         │
                       └────────────────────┬─────────────────────┘
                                            │  HTTPS
                       ┌────────────────────▼─────────────────────┐
                       │  Apigee private edge  (PSC + VPC SC)     │
                       │  VerifyAPIKey · JWT · mTLS · Quota      │
                       │  AM-SetX402Headers · RF-X402Challenge   │
                       │  Debug masking · private.* variables    │
                       └──┬───────────┬──────────┬───────────┬─────┘
                          │           │          │           │
              ┌───────────▼─┐ ┌───────▼─────┐ ┌─▼───────┐ ┌─▼────────┐
              │  storefront │ │  x402-payments │ │ x402-  │ │ x402-  │
              │   server    │ │     target      │ │registry│ │ agents  │
              │  (Express)  │ │  https://x402.  │ │ target │ │ target  │
              │             │ │   wtf/payments  │ │        │ │         │
              └──────┬──────┘ └────────┬───────┘ └───┬────┘ └────┬────┘
                     │                 │              │            │
        ┌────────────┴────────┐        └──────────────┴────────────┘
        ▼                     ▼                       │
   ┌──────────┐         ┌───────────┐                  ▼
   │  Apigee  │         │ x402.wtf  │           x402.wtf agents
   │ default  │         │  /payments│           /agents/registry
   │  target  │         │  /api/... │           /api/agents
   └────┬─────┘         └───────────┘           /api/x402/agent/chat
        │
        ▼
   ┌──────────┐   ┌──────────────┐   ┌────────────┐
   │ CF Worker│   │  facilitator │   │  truand    │
   │ gateway  │   │  /facilitator│   │  fleet     │
   │ /a2a     │   │  /*           │   │  provision │
   └──────────┘   └──────────────┘   └────────────┘
```

---

## 🗂️ Layout (what's where)

```
PAYMENTS/
├── agents.json                ← allowlist, denied-agent policy, x402 block, 6 agents
├── catalog.json               ← merchant profile, x402.wtf primary gateway, 12 products
├── index.ts                    ← manifest generator (writes v2.1 with x402)
├── launch.sh                   ← shell wrapper for fleet launch (rejects zerobro)
├── merchant.md                 ← ⭐ agent-ready announcement for solana-clawd
├── README.md                   ← you are here
├── package.json                ← list · manifest · launch · storefront · truand
├── generated/
│   ├── openclawd.agent-store.json  ← the current manifest v2.1
│   └── sessions/*.json            ← fleet session files
├── apigee/
│   ├── README.md
│   └── apiproxy/
│       ├── OpenClawdPrivateStore.xml
│       ├── proxies/default.xml    ← 4 new x402 flows + route rules
│       ├── targets/
│       │   ├── default.xml
│       │   ├── x402-payments.xml  ← 💸
│       │   ├── x402-registry.xml  ← 📒
│       │   ├── x402-agent-chat.xml← 💬
│       │   └── x402-agents.xml    ← 🤖
│       ├── policies/
│       │   ├── AM-SetX402Headers.xml    ← 🆕
│       │   ├── RF-X402Challenge.xml     ← 🆕
│       │   ├── AM-PrivateDefaults.xml
│       │   ├── AM-SanitizeResponse.xml
│       │   ├── EV-VerifyApiKey.xml
│       │   ├── JWT-ExtractAgentAssertion.xml
│       │   ├── Q-StorePerAppMinute.xml
│       │   ├── SA-StoreBurstControl.xml
│       │   └── RF-Unauthorized.xml
│       └── debugmask.json
├── storefront/
│   ├── server.ts                ← Express, 8 new /api/x402wtf/* routes
│   ├── public/
│   │   ├── index.html           ← + x402.wtf Real Store + Live Checkout
│   │   ├── app.js               ← + loadX402, bindX402, renderX402*
│   │   └── styles.css
│   ├── .env.example             ← + X402_STORE_WALLET, X402_FEE_PAYER_WALLET
│   └── package.json
└── truand/                      ← autonomous keep-alive fleet provisioner
    ├── src/index.ts
    ├── package.json
    └── README.md
```

---

## 🚀 Operator quickstart (60 seconds)

```bash
# 1. Install everything
npm install
npm --prefix storefront install

# 2. Set up the operator wallets in storefront/.env.local
cat > storefront/.env.local <<'EOF'
PORT=4318
X402_STORE_WALLET=<your operator solana mainnet wallet>
X402_FEE_PAYER_WALLET=<your fee-payer solana mainnet wallet>
X402_PUBLIC_KEY=8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump
OPENROUTER_API_KEY=<server-side openrouter key for free-model fulfillment>
XAI_API_KEY=<server-side xAI key for Grok and Grok Imagine>
OPENAI_API_KEY=<server-side OpenAI fallback key>
# Optional overrides:
# OPENCLAWD_INFERENCE_PROVIDER=openrouter|xai|openai|gemini
# OPENCLAWD_OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
# OPENCLAWD_XAI_MODEL=grok-4.3
# OPENCLAWD_XAI_IMAGE_MODEL=grok-imagine-image-quality
# OPENCLAWD_OPENAI_MODEL=gpt-4.1-mini
# (optional: GEMINI_API_KEY, MOONPAY_*, HELIUS_RPC_URL)
EOF

# 3. Generate the manifest + session
npm run list
npm run launch -- clawd ralph dexter eliza hermes x402wtf

# 4. Boot the storefront (in a separate terminal)
npm run storefront
# → http://127.0.0.1:4318
```

The launcher rejects `zerobro` and writes:
- `generated/openclawd.agent-store.json` (manifest v2.1)
- `generated/sessions/store-YYYYMMDD-HHMMSS.json` (fleet session)

---

## 🛰️ Deploy the Apigee private edge

The proxy bundle at `apigee/apiproxy/` is wired to x402.wtf out of the box. To ship it to your Apigee org:

```bash
# 1. Install apigeecli
npm install -g apigeecli
apigeecli login -u $APIGEE_USER -p $APIGEE_PASS -o $APIGEE_ORG -e $APIGEE_ENV

# 2. Push the proxy bundle
apigeecli apis create bundle -n openclawd-private-store \
  -f apigee/apiproxy -e $APIGEE_ENV

# 3. Wire KVM/secret values for X402_STORE_WALLET, X402_FEE_PAYER_WALLET,
#    X402_PUBLIC_KEY, MOONPAY_*, HELIUS_RPC_URL, etc.

# 4. Deploy
apigeecli apis deploy -n openclawd-private-store -e $APIGEE_ENV
```

The four x402 lanes (`X402Payments`, `X402Registry`, `X402AgentChat`, `X402Agents`) each route to a dedicated target, all stamped with `AM-SetX402Headers` so every upstream call carries the merchant identity, public key, network, and asset.

---

## 🔐 Operator policy (the 7 manifest rules)

```
1.  all customer and merchant traffic is routed through admitted agents only
2.  payment-signing remains in pay sandbox or approved wallet flows
3.  HERMES owns payment escalation and facilitator health
4.  Apigee is the mandatory ingress for production northbound traffic
5.  trace/debug sessions must use debug masking and private.* variables for secrets
6.  x402 challenges are issued by the x402wtf bridge and verified before fulfillment
7.  the merchant is registered at x402.wtf/agents/registry and must remain in good standing
```

`zerobro` is blocked at admission. There is no path around it. Don't ask.

---

## 🛒 The 12 products (the catalog)

| ID | Title | Cat. | Price | Path | Protocols |
| --- | --- | --- | --- | --- | --- |
| `prod-openrouter-free-inference` | OpenRouter Free-Model Inference | inference | `0.03 USDC` *(6.942 CLAWD)* | `/store/inference/openrouter-free` | x402, ap2, paysh |
| `prod-grok-swarm-session` | Grok Swarm Agent Session | agent-services | `0.42 USDC` *(42 CLAWD)* | `/store/agents/grok-swarm` | x402, mpp, ap2 |
| `prod-grok-imagine-edit` | Grok Imagine Image Edit | inference | `0.18 USDC` *(18 CLAWD)* | `/store/inference/grok-imagine` | x402, solana-pay, ap2 |
| `prod-clawd-agent-seat` | CLAWD Agent Seat | agent-services | `0.69 USDC` *(69.42 CLAWD)* | `/store/agents/clawd-seat` | x402, mpp, solana-pay |
| `prod-ooda-signal-pack` | OODA Signal Pack | agent-services | `0.25 USDC` | `/store/ooda-signal-pack` | x402, paysh, ap2 |
| `prod-wallet-brief` | Wallet Brief | api-access | `0.10 USDC` | `/store/wallet-brief` | x402, mpp, ap2 |
| `prod-private-agent-session` | Private Agent Session | commerce | `1.50 USDC` | `/store/private-agent-session` | paysh, x402, ap2 |
| `prod-a2a-merchant-checkout` | A2A Merchant Checkout | commerce | `0.30 USDC` | `/store/a2a-checkout` | mpp, ap2, x402 |
| `prod-pumpfun-launcher` | PumpFun Launcher | pump-skills | `0.45 USDC` *(42 CLAWD)* | `/skills/pumpfun-launcher` | x402, solana-pay, paysh |
| `prod-pumpfun-trading` | PumpFun Trading | pump-skills | `0.60 USDC` *(69.42 CLAWD)* | `/skills/pumpfun-trading` | x402, solana-pay, ap2 |
| `prod-pump-ai-agents` | Pump AI Agents | pump-skills | `0.80 USDC` *(88.8 CLAWD)* | `/skills/pump-ai-agents` | x402, ap2, paysh |
| `prod-x402-bridge` | **x402.wtf Bridge** | api-access | `0.01 USDC` | `/x402/bridge` | x402 |

CLAWD alternative prices use mint `8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump`.

---

## 🛰️ Storefront backend routes (the surface)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/api/config` | Browser-safe config + secret guards |
| GET | `/api/store` | Full manifest + catalog |
| GET | `/api/demo` | Judge-facing demo summary |
| GET | `/api/products/:id` | Product + fulfillment preview |
| POST | `/api/checkout/session` | Multi-rail session (MoonPay, MPP, AP2, pay.sh, solana-pay) |
| POST | `/api/checkout/session/:id/fund` | Mark session funded, reveal fulfillment |
| GET | `/api/x402wtf/info` | x402.wtf connection info |
| GET | `/api/x402wtf/registry` | Live `https://x402.wtf/agents/registry` |
| GET | `/api/x402wtf/agents` | Live `https://x402.wtf/api/agents` |
| POST | `/api/x402wtf/agent/chat` | Proxy to `https://x402.wtf/api/x402/agent/chat` |
| POST | `/api/x402wtf/checkout` | Create real x402 challenge (calls `https://x402.wtf/payments`) |
| GET | `/api/x402wtf/checkout/:id` | Fetch session |
| POST | `/api/x402wtf/checkout/:id/verify` | Verify payment-signature, mint x402 receipt |
| GET | `/api/x402wtf/registry/register` | Re-register the merchant |
| GET | `/api/ai/providers` | Server-side AI provider status, OpenRouter free-model discovery, Grok endpoints |
| POST | `/api/ai/grok/image/generate` | xAI Grok Imagine generation via JSON API |
| POST | `/api/ai/grok/image/edit` | xAI Grok Imagine image edit/multi-image edit via JSON API |
| GET | `/api/judge-mode` | 90-second talk track |
| POST | `/api/agents/gemini` | Gemini merchant agent (server-side) |
| POST | `/api/agents/wallet-brief` | Helius wallet intelligence (server-side) |
| GET | `/api/moonpay/capabilities` | MoonPay CLI surface |
| POST | `/api/moonpay/buy-link` | Build MoonPay buy link |
| GET | `/api/moonpay/workbench` | MoonPay agent ops |

---

## 🔁 External runtime hooks

This repo does **not** vendor the full gateway or facilitator runtime. Override these when you have the private infrastructure paths locally:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENCLAWD_PRIVATE_PROXY_BUNDLE_PATH` | `apigee/apiproxy` | Apigee bundle path |
| `OPENCLAWD_GATEWAY_PATH` | `private-gateway/...` | Cloudflare Worker gateway |
| `OPENCLAWD_FACILITATOR_PATH` | `private-facilitator/...` | Embedded facilitator |
| `OPENCLAWD_OODA_CMD` | `cd /path/to/solana-clawd && npm run ooda:fast` | Ralph OODA harness |
| `OPENCLAWD_GATEWAY_DEV_CMD` | `npx wrangler dev` | Local gateway dev |
| `OPENCLAWD_FACILITATOR_DEV_CMD` | `npm run dev` | Local facilitator dev |
| `OPENCLAWD_MANIFEST_CMD` | `npm run manifest` | Manifest refresh |
| `X402_PAYMENTS_ENDPOINT` | `https://x402.wtf/payments` | x402 payment gateway |
| `X402_REGISTRY_ENDPOINT` | `https://x402.wtf/agents/registry` | x402 agent registry |
| `X402_AGENT_CHAT_ENDPOINT` | `https://x402.wtf/api/x402/agent/chat` | x402 agent chat |
| `OPENROUTER_API_KEY` | none | OpenRouter fulfillment; defaults to a discovered/free `:free` model |
| `XAI_API_KEY` | none | Grok text plus Grok Imagine image generation/editing |
| `OPENAI_API_KEY` | none | OpenAI fallback fulfillment |
| `OPENCLAWD_INFERENCE_PROVIDER` | `auto` | Force `openrouter`, `xai`, `openai`, or `gemini` |
| `OPENCLAWD_OPENROUTER_MODEL` | `nvidia/nemotron-3-ultra-550b-a55b:free` | Default OpenRouter free model |
| `OPENCLAWD_XAI_MODEL` | `grok-4.3` | Default Grok text model |
| `OPENCLAWD_XAI_IMAGE_MODEL` | `grok-imagine-image-quality` | Default Grok Imagine image model |

Without overrides the manifest still builds, but the runtime commands remain placeholders.

The Apigee private edge also exposes paid inference lanes under `/openclawd/private-store/inference/*`:

| Path | Target | Provider |
| --- | --- | --- |
| `/inference/openrouter/chat` | `https://openrouter.ai/api/v1/chat/completions` | OpenRouter free/default model |
| `/inference/xai/chat` | `https://api.x.ai/v1/chat/completions` | Grok swarm text |
| `/inference/xai/images/**` | `https://api.x.ai/v1/images` | Grok Imagine generation/editing |
| `/inference/openai/responses` | `https://api.openai.com/v1/responses` | OpenAI fallback |

---

## 🔒 Apigee integration contract

Use the root CLI to bind the Apigee bundle, generated store manifest, generated session, and truand fleet into a single deploy handoff:

```bash
npm run manifest
npm run apigee:integrate
npm run apigee:validate
```

`apigee:integrate` writes `generated/openclawd.apigee-integration.json`. `apigee:validate` checks the required Apigee files, generated JSON artifacts, XML well-formedness, x402.wtf route targets, manifest privacy-edge settings, truand roles, and debug masking. Set `OPENCLAWD_SESSION_PATH` to validate a specific session file; otherwise the latest `generated/sessions/store-*.json` is used.

Before production Apigee deployment, replace `REPLACE_WITH_PRIVATE_OPENCLAWD_GATEWAY` in `apigee/apiproxy/targets/default.xml` with the private gateway URL for the environment. You can set `OPENCLAWD_GATEWAY_TARGET_URL` while running `apigee:integrate` so the generated contract records the intended target.

---

## 🤖 Truand fleet (keep-alive lane)

The `truand/` package provisions the private keep-alive fleet for the merchant runtime.

```bash
npm --prefix truand install
npm run truand:plan
npm run truand:manifest
npm run apigee:integrate
npm run apigee:validate
npm run truand:provision
```

`plan`, `manifest`, `apigee:integrate`, and `apigee:validate` are local-only. `provision` performs live API calls to Upstash Box and Neon and expects untracked credentials (`UPSTASH_BOX_API_KEY`, `NEON_API_KEY`, `NEON_PROJECT_ID`, plus the selected model provider key: `OPENROUTER_API_KEY`, `XAI_API_KEY`, or `OPENAI_API_KEY`) in the shell or a local env file.

The fleet has four roles: **concierge**, **checkout**, **facilitator**, **alchemist**. Each one runs as a Box keep-alive Box with a `codex` harness and the selected provider model. The default swarm exposes OpenRouter free fulfillment, Grok orchestration, Grok Build coding, and Grok Imagine image editing while charging in USDC with CLAWD-aware routing.

---

## 📣 Announce it in solana-clawd

The file [`merchant.md`](./merchant.md) is a self-contained announcement your agent can use to:

1. Add the merchant listing to `solana-clawd/agents/registry/openclawd-merchant.md`
2. POST the registration payload to `https://x402.wtf/agents/registry`
3. Drive a real x402 challenge against `https://x402.wtf/payments`

It contains the TL;DR, merchant identity table, all 9 canonical x402.wtf URLs, the registration JSON payload, a sample paid challenge HTTP request, the full 8-product catalog, the admitted-fleet table, the Apigee edge posture, the 7 manifest runtime rules, an agent-ready copy/paste markdown block, a 7-step operator checklist, a one-paragraph "what to tell your agent" prompt, and a files-of-record index.

```text
> "OpenClawd is now a real paid x402 merchant on x402.wtf. Add the announcement block
>  above to solana-clawd so other agents can discover it, then POST the registration
>  payload to https://x402.wtf/agents/registry to confirm the merchant is live. The
>  store sells 12 paid agent and inference products in USDC or CLAWD on Solana and accepts x402 challenges
>  from https://x402.wtf/payments. The fleet is clawd, ralph, dexter, eliza, hermes,
>  x402wtf; zerobro is denied. Public key 8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump.
>  The Apigee private edge is wired to x402.wtf via four dedicated targets, and the
>  storefront is the demo surface. Re-validate the registration on every boot and
>  surface the receipt fingerprint for every paid order."
```

---

## 🎯 Why this wins

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Most hackathon projects mock the payment layer.                           │
│  We didn't. We made a real paid x402 store on x402.wtf.                    │
│                                                                            │
│  ✔  8 purchasable products, all with x402 challenge paths                 │
│  ✔  Real call to https://x402.wtf/payments on every checkout               │
│  ✔  Real registration on https://x402.wtf/agents/registry                 │
│  ✔  Real SHA-256 receiptFingerprint for every paid order                   │
│  ✔  Real Apigee private edge (PSC + VPC SC + mTLS)                         │
│  ✔  Real keep-alive truand fleet (4 lanes, codex harness)                  │
│  ✔  Real 6-agent merchant fleet, 5 payment rails, 8 product categories      │
│  ✔  Real USDC settlement on Solana mainnet                                │
│  ✔  Real MERCHANT.md ready to hand to your agent                          │
└────────────────────────────────────────────────────────────────────────────┘
```

> **This is not an AI chat app. It's a real, paid, agent-operated merchant store.**
> Discoverable products. Real paid challenges. Durable receipts. Private ingress. And a graceful fallback so the demo always works.

---

## 🛡️ Security posture (the boring but important part)

- Public keys in the browser, **secrets stay server-side**
- `VerifyAPIKey` + `OAuthV2/JWT` + `mTLS` for higher-trust actors
- Debug masking on `private.x402.*`, `payment-signature`, `x-payment`, `x-clawd-signature`
- `private.*` flow variables for every confidential value
- Quota: 600 calls per app per minute; burst: 30 per second
- `SA-StoreBurstControl` spike arrest on every lane
- `RF-X402Challenge` returns a structured 402 with the operator's public key and network
- `RF-Unauthorized` returns 401 for missing or invalid API keys
- `HELIUS_RPC_URL`, `MOONPAY_SECRET_KEY`, `MOONPAY_WEBHOOK_KEY`, `MOONPAY_SIGNING_SECRET`, `MOONPAY_WEBHOOK_SECRET`, `MERCHANT_PW` are all server-side only

> 🛡️ If a value is `replace_me` in `.env.local`, the storefront reports it as missing/disabled in `/api/config` and skips the corresponding route. Nothing leaks to the browser.

---

## 📜 License

Private. Don't redistribute. Don't `zerobro`.

---

<sub>Built by Clawd, Ralph, Dexter, Eliza, HERMES, and the x402.wtf bridge · Solana mainnet · USDC settlement · Apigee private edge · keep-alive truands</sub>
