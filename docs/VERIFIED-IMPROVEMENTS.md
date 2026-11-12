# Verified Docker improvements — 2026-11-12

[Back to the guide](../README.md). This is an evidence record, not a claim that
every possible Docker topic or production requirement is complete.

## Code and test changes (12 focused changes)

1. Preview supports HEAD without a body and rejects unsupported HTTP methods.
2. Malformed URL encoding and control characters return a controlled bad request.
3. Preview blocks private archives and rechecks resolved filesystem targets.
4. Preview responses prohibit caching and cross-origin embedding.
5. Static export rejects ambiguous paths and private archive/database artifacts.
6. Static export rejects symlink inputs and requires owned regular output.
7. Markdown link tests cover all tracked public runbooks, not only a fixed shortlist.
8. Both APIs reject unsupported content types, malformed UTF-8/JSON and bodies over 16 KiB.
9. Both APIs reject empty, duplicate, fractional and out-of-range pagination offsets.
10. Compose verification preserves its evidence even when cleanup fails.
11. Basic lab cleanup checks ownership before deleting networks and test images too.
12. Every baseline Compose service has bounded local log rotation.

The documentation server is still a loopback-only local preview. These controls
do not turn it into a production hosting service or add tracker authentication.

## Visual learning additions (16 focused guides)

Each section includes an original SVG, meaningful alternative text, a complete
text workflow, an explicitly limited analogy, an explanation and a reasoning exercise.

| Topic | Lesson section |
| --- | --- |
| Container/kernel boundary | [Shared kernel](../index.html#first-container/shared-kernel) |
| Shutdown handover | [Signals and deadlines](../index.html#container-lifecycle/shutdown-signals) |
| Dependency cache | [Changed build inputs](../index.html#first-dockerfile/cache-invalidation) |
| Build context | [Filtering before delivery](../index.html#first-dockerfile/context-boundary) |
| Private networking | [Two address books](../index.html#container-networks/two-address-books) |
| Persistence | [Storage lifetimes](../index.html#persistent-data/storage-lifetimes) |
| Configuration | [Two phases](../index.html#compose-stack/configuration-phases) |
| Dependency health | [Readiness contract](../index.html#compose-stack/readiness-contract) |
| Next.js configuration | [Public build values](../index.html#nextjs-postgres/public-build-values) |
| Database recovery | [Restore evidence](../index.html#database-backups/restore-evidence) |
| Compatible migrations | [Expand and contract](../index.html#schema-upgrades/expand-contract) |
| Migration incidents | [History versus data](../index.html#migration-failures/history-versus-data) |
| Build secrets | [Temporary secret access](../index.html#buildkit-workflows/secret-mount-boundary) |
| Runtime constraints | [Resource budgets](../index.html#secure-runtime/resource-budgets) |
| Registry artifacts | [Content identity](../index.html#registry-artifacts/artifact-identity) |
| Delivery | [Promotion decision](../index.html#single-host-release/promotion-decision) |

## Actual runtime evidence

Environment: Windows AMD64 client; Docker Desktop 4.57.0, Engine 29.1.3,
Linux AMD64 daemon, Compose 5.0.1. Host Node 24.14.0.

- `npm test`: 26 passing tests, including dependency-free request-helper tests for both tracks.
- `npm run build`: 124 public files, 2.43 MiB; the export includes all diagram assets.
- `node tests/browser-check.cjs`: seven viewport sizes, all 20 mobile lessons,
  all 16 new section links/images/contents entries, keyboard search, history,
  theme persistence and copy controls passed. Lazy images are explicitly loaded
  and decoded before checking their dimensions.
- `node tests/browser-diagrams.cjs`: all 16 diagrams passed real-browser SVG
  text-bounds checks; no labels extended beyond their viewBox.
- `node tests/browser-touch.cjs`: trusted emulated touch checks passed.
- `node tests/browser-accessibility.cjs`: light/dark axe scans had zero automated
  violations on the six selected routes per theme; reduced motion and 200% CSS-zoom
  reachability passed. Manual-review findings and physical-device limits remain.
- `node tools/check-docker-labs.cjs`: container lifecycle, HTTP, bridge DNS,
  controlled command failure, volume persistence and separate restoration passed.
- `node tools/check-buildkit-labs.cjs`: required-secret rejection on a cache miss,
  secret/cache mount boundaries, repeated build and non-root proof passed.
- `node tools/check-compose-labs.cjs TRACK`: both tracks built, migrated and seeded;
  request validation, task operations, log rotation, non-root execution,
  unpublished DB, data survival and dependency recovery passed.
- `node tools/check-recovery-labs.cjs TRACK`: both tracks restored into a separate
  empty DB, retained history, upgraded populated data and ran the old app successfully.
- `node tools/check-delivery-labs.cjs TRACK`: both tracks passed deliberate migration
  failure/reconciliation, hardened runtime, signal stop/restart and release recreation.

Two simultaneous delivery attempts initially hit Windows Compose metadata-file
rename locks before containers started. Sequential reruns passed; this does not
prove the Windows locking issue has been fixed. Run one track at a time on constrained hosts.

The scripts retain compact, tracked JSON verification records under `tests/results/`;
this series refreshes those eight existing records. Raw database dumps are ignored.
No credentials, raw dumps or test evidence are included in the static export. All cited new source URLs were
reachable over HTTP on this review date; URL reachability alone is not technical certification.

## Cleanup boundaries

Verification containers, networks and volumes were removed. Sixteen exact,
project-labeled app/tools image tags from these runs were removed separately,
including tags from the interrupted builds. The basic and BuildKit runners
removed their own images. Existing `rag-qdrant-1` and `dockerlab-db` containers
were left untouched. Base images and shared builder cache remain intentionally;
no global prune was used. Host-side recovery archives remain local and ignored.

## Limits

No public hosting, paid infrastructure, registry publishing, real signing,
ARM64 certification, physical-device testing or production authentication was
performed. Refer to the [completion checklist](COMPLETION-CHECKLIST.md) for
separate public-production gates and [lab validation](../LAB-VALIDATION.md) to reproduce checks.
