## Truand Fleet

This package provisions the private keep-alive truand fleet for the OpenClawd merchant runtime.

### Secrets

Use an untracked `.env.local` or shell environment variables. Do not commit:

- `UPSTASH_BOX_API_KEY`
- `OPENAI_API_KEY`
- `NEON_API_KEY`
- `NEON_PROJECT_ID`

### Commands

```bash
npm --prefix truand install
npm --prefix truand run plan
npm --prefix truand run manifest
npm run apigee:integrate
npm run apigee:validate
npm --prefix truand run provision
```

`plan`, `manifest`, `apigee:integrate`, and `apigee:validate` are local-only. `provision` performs live API calls to Upstash Box and Neon.

The Apigee integration command writes `generated/openclawd.apigee-integration.json`, which links the truand fleet to the generated store manifest, the latest generated store session, and the `apigee/apiproxy` route/policy bundle. Set `OPENCLAWD_SESSION_PATH` if you need to bind the contract to a specific session file instead of the latest one.
