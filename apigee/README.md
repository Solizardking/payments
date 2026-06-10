## Apigee Private Edge

This directory contains an Apigee proxy bundle for placing the autonomous merchant store behind a private and confidential API edge. The bundle is wired to x402.wtf/payments as a real paid x402 store, with dedicated route rules, target endpoints, and a 402 challenge fault rule for each paid lane.

![Animated OpenClawd x402 payment loop](../docs/x402-payment-loop.svg)

Primary payment rail: [`https://x402.wtf/payments`](https://x402.wtf/payments). Companion agent runtime: [`github.com/solizardking/solana-clawd`](https://github.com/solizardking/solana-clawd).

Design goals:

- Northbound traffic enters through Apigee Private Service Connect.
- Apigee org and runtime are isolated with VPC Service Controls.
- Only approved apps and agents can call the merchant APIs.
- Sensitive headers, request payloads, and receipts are masked in debug.
- x402 paid challenges, agent registry, agent chat, and paid inference traffic are routed through dedicated targets.
- Target routing to the OpenClawd gateway happens through controlled proxy flows.

Recommended production shape:

1. Private ingress with Apigee and PSC.
2. VPC Service Controls around the Apigee project and supporting services.
3. `VerifyAPIKey` for app admission, plus OAuth/JWT or mTLS for higher-trust actors.
4. Debug masking and `private.` flow variables for secrets and confidential payment material.
5. Apigee quotas, spike arrest, and per-product authorization in front of the x402 gateway.
6. `AM-SetX402Headers` stamps every x402-bound request with merchant identity, public key, and network.
7. `AM-SetInferenceHeaders` stamps paid inference requests with merchant identity and product-class metadata.
8. `RF-X402Challenge` returns a structured 402 challenge when the upstream x402 endpoint demands payment.

Bundle contents:

- `apiproxy/OpenClawdPrivateStore.xml` — root proxy bundle descriptor
- `apiproxy/proxies/default.xml` — proxy endpoint with x402.wtf routes
- `apiproxy/targets/default.xml` — target endpoint pointing at the OpenClawd gateway
- `apiproxy/targets/x402-payments.xml` — paid lane for https://x402.wtf/payments
- `apiproxy/targets/x402-registry.xml` — lane for https://x402.wtf/agents/registry
- `apiproxy/targets/x402-agent-chat.xml` — lane for https://x402.wtf/api/x402/agent/chat
- `apiproxy/targets/x402-agents.xml` — lane for https://x402.wtf/api/agents
- `apiproxy/targets/openrouter-chat.xml` — paid OpenRouter chat/completions inference lane
- `apiproxy/targets/xai-chat.xml` — paid Grok swarm chat/completions lane
- `apiproxy/targets/xai-images.xml` — paid Grok Imagine image generation/editing lane
- `apiproxy/targets/openai-responses.xml` — paid OpenAI fallback responses lane
- `apiproxy/policies/AM-PrivateDefaults.xml` — private flow variables and confidential headers
- `apiproxy/policies/AM-SetX402Headers.xml` — stamps merchant identity on every x402 request
- `apiproxy/policies/AM-SetInferenceHeaders.xml` — stamps merchant identity on every inference request
- `apiproxy/policies/EV-VerifyApiKey.xml` — API key verification
- `apiproxy/policies/JWT-ExtractAgentAssertion.xml` — agent JWT extraction
- `apiproxy/policies/Q-StorePerAppMinute.xml` — per-app quota
- `apiproxy/policies/SA-StoreBurstControl.xml` — burst control
- `apiproxy/policies/AM-SanitizeResponse.xml` — header sanitization
- `apiproxy/policies/RF-Unauthorized.xml` — 401 fault rule
- `apiproxy/policies/RF-X402Challenge.xml` — 402 challenge fault rule
- `apiproxy/debugmask.json` — environment debug masking config example

Local integration:

```bash
npm run manifest
npm run truand:manifest
npm run apigee:integrate
npm run apigee:validate
```

`npm run apigee:integrate` writes `generated/openclawd.apigee-integration.json`. That file is the local handoff contract connecting this proxy bundle to:

- `generated/openclawd.agent-store.json`
- the latest `generated/sessions/store-*.json` file, or `OPENCLAWD_SESSION_PATH` when set
- `generated/truand-fleet.json`
- the four x402.wtf target endpoints
- the four paid inference target endpoints
- the proxy base path `/openclawd/private-store`

`npm run apigee:validate` checks required bundle files, parses generated JSON, validates XML with `xmllint`, verifies x402 and inference route targets against the generated store manifest, confirms the store includes paid inference and CLAWD-priced products, and confirms debug masking covers private payment, agent, prompt, image, and provider variables.

This is a repo-local scaffold, not a fully provisioned Apigee org. You still need to deploy it into your Apigee environment and connect the target host and ingress privately. x402.wtf is a public paid provider; keep all operator secrets inside `private.*` variables and use debug masking.

Before production deployment, replace the default target URL in `apiproxy/targets/default.xml` with the private OpenClawd gateway URL for the Apigee environment. The generated integration contract reports this as `apigee.defaultTarget.upstream`; set `OPENCLAWD_GATEWAY_TARGET_URL` while generating the contract to record the intended deployment value.

GitHub safety gate:

```bash
npm run check
git ls-files .env .env.local storefront/.env.local truand/.env.local
```

The env-file command should print nothing. Live API keys, wallet private keys, payment signatures, and provider credentials belong in local env files, Apigee KVM/secret stores, or deployment platform secrets only.
