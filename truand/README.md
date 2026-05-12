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
npm --prefix truand run provision
```

`plan` and `manifest` are local-only. `provision` performs live API calls to Upstash Box and Neon.
