## Apigee Private Edge

This directory contains an Apigee proxy bundle for placing the autonomous merchant store behind a private and confidential API edge. The bundle is wired to x402.wtf/payments as a real paid x402 store, with dedicated route rules, target endpoints, and a 402 challenge fault rule for each paid lane.

Design goals:

- Northbound traffic enters through Apigee Private Service Connect.
- Apigee org and runtime are isolated with VPC Service Controls.
- Only approved apps and agents can call the merchant APIs.
- Sensitive headers, request payloads, and receipts are masked in debug.
- x402 paid challenges, agent registry, and agent chat traffic are routed to https://x402.wtf via dedicated targets.
- Target routing to the OpenClawd gateway happens through controlled proxy flows.

Recommended production shape:

1. Private ingress with Apigee and PSC.
2. VPC Service Controls around the Apigee project and supporting services.
3. `VerifyAPIKey` for app admission, plus OAuth/JWT or mTLS for higher-trust actors.
4. Debug masking and `private.` flow variables for secrets and confidential payment material.
5. Apigee quotas, spike arrest, and per-product authorization in front of the x402 gateway.
6. `AM-SetX402Headers` stamps every x402-bound request with merchant identity, public key, and network.
7. `RF-X402Challenge` returns a structured 402 challenge when the upstream x402 endpoint demands payment.

Bundle contents:

- `apiproxy/OpenClawdPrivateStore.xml` — root proxy bundle descriptor
- `apiproxy/proxies/default.xml` — proxy endpoint with x402.wtf routes
- `apiproxy/targets/default.xml` — target endpoint pointing at the OpenClawd gateway
- `apiproxy/targets/x402-payments.xml` — paid lane for https://x402.wtf/payments
- `apiproxy/targets/x402-registry.xml` — lane for https://x402.wtf/agents/registry
- `apiproxy/targets/x402-agent-chat.xml` — lane for https://x402.wtf/api/x402/agent/chat
- `apiproxy/targets/x402-agents.xml` — lane for https://x402.wtf/api/agents
- `apiproxy/policies/AM-PrivateDefaults.xml` — private flow variables and confidential headers
- `apiproxy/policies/AM-SetX402Headers.xml` — stamps merchant identity on every x402 request
- `apiproxy/policies/EV-VerifyApiKey.xml` — API key verification
- `apiproxy/policies/JWT-ExtractAgentAssertion.xml` — agent JWT extraction
- `apiproxy/policies/Q-StorePerAppMinute.xml` — per-app quota
- `apiproxy/policies/SA-StoreBurstControl.xml` — burst control
- `apiproxy/policies/AM-SanitizeResponse.xml` — header sanitization
- `apiproxy/policies/RF-Unauthorized.xml` — 401 fault rule
- `apiproxy/policies/RF-X402Challenge.xml` — 402 challenge fault rule
- `apiproxy/debugmask.json` — environment debug masking config example

This is a repo-local scaffold, not a fully provisioned Apigee org. You still need to deploy it into your Apigee environment and connect the target host and ingress privately. x402.wtf is a public paid provider; keep all operator secrets inside `private.*` variables and use debug masking.
