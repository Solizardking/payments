# OpenClawd Payments Private

This repository is the private autonomous commerce runtime split out of `solana-clawd`.

It owns the merchant manifest, private Apigee edge bundle, hackathon storefront, and truand fleet provisioning. Public hackathon copy stays in the public repo; the live payment hosting layer lives here.

## Quick start

```bash
npm install
npm run list
npm run manifest -- clawd ralph hermes
npm run launch -- clawd ralph dexter eliza hermes
```

The launcher rejects `zerobro` and writes:

- `generated/openclawd.agent-store.json`
- `generated/sessions/*.json`

## Layout

- `agents.json` — allowlist and denied-agent policy
- `catalog.json` — merchant profile and product catalog
- `index.ts` — manifest generator and session planner
- `launch.sh` — shell wrapper for fleet launch
- `apigee/` — private ingress proxy bundle
- `storefront/` — local storefront server and static frontend
- `truand/` — autonomous keep-alive fleet provisioner

## External runtime hooks

This repo does not vendor the full gateway or facilitator runtime. Override these when you have the private infrastructure paths locally:

- `OPENCLAWD_PRIVATE_PROXY_BUNDLE_PATH`
- `OPENCLAWD_GATEWAY_PATH`
- `OPENCLAWD_FACILITATOR_PATH`
- `OPENCLAWD_OODA_CMD`
- `OPENCLAWD_GATEWAY_DEV_CMD`
- `OPENCLAWD_FACILITATOR_DEV_CMD`

Without overrides, the generated manifest still builds, but the runtime commands remain placeholders.

## Storefront

```bash
npm --prefix storefront install
npm run storefront
```

Put browser-safe config only in `storefront/.env.local`. Keep merchant secrets and webhook credentials server-side.

## Truands

```bash
npm --prefix truand install
npm run truand:plan
npm run truand:manifest
npm run truand:provision
```

`truand:provision` performs live API calls and expects untracked credentials in the shell or a local env file.
