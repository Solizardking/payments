## Truand Fleet

This package provisions the private keep-alive truand fleet for the OpenClawd merchant runtime.

![Animated OpenClawd x402 payment loop](../docs/x402-payment-loop.svg)

The fleet keeps paid lanes warm for [`https://x402.wtf/payments`](https://x402.wtf/payments) and is designed to pair with [`github.com/solizardking/solana-clawd`](https://github.com/solizardking/solana-clawd) for external agent discovery and OODA-style runtime work.

### Secrets

Use an untracked `.env.local` or shell environment variables. Do not commit:

- `UPSTASH_BOX_API_KEY`
- `OPENROUTER_API_KEY`
- `XAI_API_KEY`
- `OPENAI_API_KEY`
- `NEON_API_KEY`
- `NEON_PROJECT_ID`

The truand blueprint selects `OPENROUTER_API_KEY` first, then `XAI_API_KEY`, then `OPENAI_API_KEY`, unless you set `TRUAND_PROVIDER` or `OPENCLAWD_INFERENCE_PROVIDER` to `openrouter`, `xai`, or `openai`. OpenRouter defaults to a `:free` model, while xAI enables the Grok swarm and Grok Imagine image lanes.

### Commands

```bash
npm --prefix truand install
npm --prefix truand run plan
npm --prefix truand run manifest
npm run apigee:integrate
npm run apigee:validate
npm run check
npm --prefix truand run provision
```

`plan`, `manifest`, `apigee:integrate`, `apigee:validate`, and `check` are local-only. `provision` performs live API calls to Upstash Box and Neon and requires the selected provider key.

The Apigee integration command writes `generated/openclawd.apigee-integration.json`, which links the truand fleet to the generated store manifest, the latest generated store session, and the `apigee/apiproxy` route/policy bundle. Set `OPENCLAWD_SESSION_PATH` if you need to bind the contract to a specific session file instead of the latest one.

### GitHub safety gate

```bash
git ls-files .env .env.local storefront/.env.local truand/.env.local
npm run check
```

The env-file command should print nothing. Generated provisioning output, bearer URLs, provider keys, Neon keys, and Upstash Box keys must stay out of Git history.
