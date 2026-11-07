# Local validation record

Scope: cycle 75, local build and tests only. No deployment, push, directory registration, registry submission, or network request to agentswarm.space was made. The repository has no Git remote.

## Source evidence

Read-only `git show origin/main:<path>` from `/home/emdash/.codex/worktrees/AND-1304/swarmhub-acq`, revision `bd0193e1caba68f330735bc9a54db4585973b7ca`:

- `site/lib/swarm/validate.ts`: registration field rules, reserved handles, bounty payer semantics.
- `site/app/api/feed/route.ts`: `{items, nextCursor}`.
- `site/app/api/bounties/route.ts`: `{bounties, nextCursor}` from the public bounty page.
- `site/app/api/posts/[id]/route.ts`: `{post, replies}`; only `post` is projected here, with the `bountyMoney` additions and cross-owner reviewer count.
- `site/lib/swarm/money-store.ts`: all `BountyMoney` detail fields, including escrow state/held amount, split/review terms, challenge window and the first page of payout receipts with its cursor.
- `site/lib/swarm/ledger.ts`: at most five fixed shares and twenty payouts per detail page.
- `site/lib/swarm/review-store.ts`: `reviewers` is a count; reviewer identities are not public.
- `site/app/api/agents/register/route.ts`: direct registration response and one-time credential guidance.

Reused the verified field projection and payer precedence from `/home/emdash/.local/state/kiss/acq/work/mcp65/agentswarm-mcp/server/api.js`, repository revision `fea5792aa772f040c9c2dd624980931c6f417613`. Copied its MIT LICENSE verbatim and retained the existing registry MCPB package URL and SHA-256.

Protocol references:

- Current A2A specification: <https://a2a-protocol.org/latest/specification/>.
- Current A2A official JSON schema: <https://a2a-protocol.org/latest/spec/a2a.json>, draft 2020-12.
- Legacy A2A official schema: <https://raw.githubusercontent.com/a2aproject/A2A/v0.3.0/specification/json/a2a.json>, draft 7.
- Official MCP registry schema: <https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json>, draft 7.
- Configuration: <https://developers.cloudflare.com/cf/projects/cloudflare-config/> and the installed cf Build Output Specification reader/writer definitions.

## Checks

`node --test` runs 39 tests against mocked fetch, a controlled clock and either an expiring or no-op `caches.default` stub. All pass. Each test imports a fresh Worker module to isolate module-level caches and upstream budgets. No live upstream data is included in test fixtures or artifacts.

The FIX-1 regressions verify 40 concurrent identical requests across MCP/A2A cause one upstream call with a no-op Cache API; distinct-ID requests stop at 30 upstream fetch starts per rolling 60 seconds with HTTP 200 JSON-RPC busy errors and `retryAfterSeconds`; cache hits and registration remain available; failures consume budget and are sanitized/cached for 15 seconds; isolate entries expire at 60/120 seconds; eviction holds the 500-entry and 5 MiB UTF-8 payload/key caps. Custom-domain Cache API hits survive isolate replacement without extending their expiry. MCP header/Accept tests include real-client media type lists and wildcard quality precedence. A2A capability errors are tested for both versions and method-name sets. Bounty fixtures match the site's detail additions, including bounded fixed shares and payout receipts.

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
fix-1-test-output.txt     FIX-1 full node --test TAP output (39 passing)
fix-1-build-output.txt    FIX-1 local build output
fix-1-dry-run-output.txt  FIX-1 cf dry-run output (no credentials)
fix-1-schema-output.txt   FIX-1 all five passing AJV results
fix-1-schema/            FIX-1 fresh official schemas, wrappers and generated fixtures
```

The FIX-1 rerun passed all five validations against fresh downloads of the official schemas. The build and authenticated `cf deploy --dry-run --prebuilt` also passed: `Total Upload: 23.73 KiB / gzip: 8.08 KiB`, `No bindings found.`, `--dry-run: exiting now.` This reports the prospective upload size; nothing was uploaded.

The README contains commands to reproduce these checks and distinguishes both card formats. The supervisor approved using separate current and legacy card documents because the current official schema rejects the legacy top-level fields requested in the initial task.

## Remaining limits for deployment review

- The Worker has not been deployed, so no live reachability or real-client interoperability claim is made. The subdomain remains a placeholder.
- A2A Registry's public submit UI and OpenAPI document use the legacy `protocolVersion` and `url` model. Supply `/.well-known/agent.json` there, then inspect its live preview after deployment is separately approved. AgentPeering's API docs show 1.0 JSONRPC endpoints and accept explicit card URLs; prefer `/.well-known/agent-card.json` there. No registry validator or registration call was made during this task.
- The isolate cache and 30-fetch rolling budget bound upstream calls per isolate. Multiple or replacement isolates have independent state, so there is no global traffic/cost guarantee. The site itself is public and bot-open. Workers Cache API operations have no effect on workers.dev and remain an additional cache for supported custom domains. Cache API failures preserve the isolate protections. Cache projections can be stale for their TTL.
- Search covers the first public feed page and its truncated bodies. It does not search all historical tasks. Simple A2A intent routing is deliberately literal.
- Member content is marked as untrusted data, not interpreted or executed. This label does not guarantee that every downstream agent will resist prompt injection.
- Only temporary public isolate cache and Cache API entries retain member content. The isolate byte cap measures serialized UTF-8 payloads/keys, excluding JavaScript object overhead. No application logging, analytics, credential storage, KV/DB persistence or task-state retention is implemented.
