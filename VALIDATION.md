# Local validation record

Scope: cycle 75, local build and tests only. No deployment, push, directory registration, registry submission, or network request to agentswarm.space was made. The repository has no Git remote.

## Source evidence

Read-only `git show origin/main:<path>` from `/home/emdash/.codex/worktrees/AND-1304/swarmhub-acq`, revision `bd0193e1caba68f330735bc9a54db4585973b7ca`:

- `site/lib/swarm/validate.ts`: registration field rules, reserved handles, bounty payer semantics.
- `site/app/api/feed/route.ts`: `{items, nextCursor}`.
- `site/app/api/bounties/route.ts`: `{bounties, nextCursor}` from the public bounty page.
- `site/app/api/posts/[id]/route.ts`: `{post, replies}`; only `post` is projected here.
- `site/app/api/agents/register/route.ts`: direct registration response and one-time credential guidance.

Reused the verified field projection and payer precedence from `/home/emdash/.local/state/kiss/acq/work/mcp65/agentswarm-mcp/server/api.js`, repository revision `fea5792aa772f040c9c2dd624980931c6f417613`. Copied its MIT LICENSE verbatim and retained the existing registry MCPB package URL and SHA-256.

Protocol references:

- Current A2A specification: <https://a2a-protocol.org/latest/specification/>.
- Current A2A official JSON schema: <https://a2a-protocol.org/latest/spec/a2a.json>, draft 2020-12.
- Legacy A2A official schema: <https://raw.githubusercontent.com/a2aproject/A2A/v0.3.0/specification/json/a2a.json>, draft 7.
- Official MCP registry schema: <https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json>, draft 7.
- Configuration: <https://developers.cloudflare.com/cf/projects/cloudflare-config/> and the installed cf Build Output Specification reader/writer definitions.

## Checks

`node --test` runs 25 tests against mocked fetch and an expiring `caches.default` stub. All pass. No live upstream data is included in test fixtures or artifacts.

`node scripts/build.js` writes a single-module cf build with no bindings, packages or bundler. The build imports `cloudflare.config.ts` directly using Node's native TypeScript support.

`daniela-secrets run --only CLOUDFLARE_API_TOKEN -- cf auth whoami` confirmed valid token access without printing credential values. `daniela-secrets run --only CLOUDFLARE_API_TOKEN -- cf deploy --dry-run --prebuilt` validates the emitted configuration and module, and exits before upload. `--prebuilt` is intentional: it keeps cf on the supplied single-module build rather than selecting a separate build implementation. No Wrangler executable or package was installed or invoked.

`cf --help`, `cf cli search "deploy worker"`, `cf schema deploy` and `cf deploy --help` were consulted. `cf schema deploy` reports no API schema for this project command; its help documents `--dry-run` and `--prebuilt`. The successful actual dry run establishes configuration validity.

AJV 5 CLI with ajv-formats validates five artifacts:

1. Current card against the current official AgentCard definition.
2. Legacy card against the official 0.3.0 AgentCard definition.
3. Current SendMessage result against the current official SendMessageResponse definition.
4. Legacy JSON-RPC response against the official 0.3.0 SendMessageResponse definition.
5. A placeholder-filled copy of `server.json` against the 2025-12-11 official MCP registry schema.

No official definitions were loosened. Schema-fixture generation adds a root `$ref` to select the official definition. `server.json` itself still contains `<SUBDOMAIN>`.

## Review evidence

Artifacts are outside the Git checkout at `/home/emdash/.local/state/kiss/acq/work/edge75/evidence/`:

```text
test-output.txt          Full node --test TAP output
build-output.txt         Local build output
dry-run-output.txt       cf dry-run output (no credentials)
schema-output.txt        All five AJV results
schema/                  Downloaded official schemas, exact wrappers and generated fixtures
```

The README contains commands to reproduce these checks and distinguishes both card formats. The supervisor approved using separate current and legacy card documents because the current official schema rejects the legacy top-level fields requested in the initial task.

## Remaining limits for deployment review

- The Worker has not been deployed, so no live reachability or real-client interoperability claim is made. The subdomain remains a placeholder.
- A2A Registry's public submit UI and OpenAPI document use the legacy `protocolVersion` and `url` model. Supply `/.well-known/agent.json` there, then inspect its live preview after deployment is separately approved. AgentPeering's API docs show 1.0 JSONRPC endpoints and accept explicit card URLs; prefer `/.well-known/agent-card.json` there. No registry validator or registration call was made during this task.
- Workers Cache API entries are local and evictable, not a global rate limiter. Cache projections can be stale for their TTL. A failed cache write yields an internal error; there is no fallback that bypasses caching.
- Search covers the first public feed page and its truncated bodies. It does not search all historical tasks. Simple A2A intent routing is deliberately literal.
- Member content is marked as untrusted data, not interpreted or executed. This label does not guarantee that every downstream agent will resist prompt injection.
- Only temporary public Cache API entries retain member content. No application logging, analytics, credential storage, KV/DB persistence or task-state retention is implemented.
