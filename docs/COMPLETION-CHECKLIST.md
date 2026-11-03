# Docker course completion and publication checklist

The **20-lesson local Docker course is implemented**. Completion means you can
explain and reproduce the chosen workflow, not that a demo is production-safe.
No cluster curriculum, public hosting or paid account is required.

## Learner sign-off

These boxes intentionally start unchecked. Copy them to your own learning record
and check only outcomes you personally observed; author tests do not complete
your exercises for you. Choose Prisma **or** Drizzle throughout.

### Foundations

- [ ] Identify the shell, working directory, flags, arguments, exit status and host/container boundary.
- [ ] Confirm the intended local context and both Docker Client and Server.
- [ ] Run, inspect, stop, restart and remove only your own disposable container.
- [ ] Explain host versus container ports and why loopback binding matters.
- [ ] Build the static image and explain build context, layers, cache and .dockerignore.
- [ ] Demonstrate private service DNS and named-volume persistence after container removal.
- [ ] Explain why a volume, static-file archive and consistent DB backup are different.

### Application and recovery

- [ ] Start the chosen task tracker, migrate explicitly and seed demo rows repeatably.
- [ ] Create, assign and complete a task; verify after Refresh and container replacement.
- [ ] Explain host DB URLs versus container service DNS and keep DB credentials server-only.
- [ ] Use hot reload in development and the standalone server in production-style mode.
- [ ] Restore a logical backup into a separate database and compare rows and ORM history.
- [ ] Apply compatible schema expansion with original data intact and old-app writes working.
- [ ] Recover the deliberately failed migration in a fresh disposable test project.

### Security, delivery and handoff

- [ ] Explain secret mounts versus ARG/ENV; verify the fake-secret BuildKit checkpoint.
- [ ] Inspect non-root/read-only permissions, writable tmpfs, limits and bounded logs.
- [ ] Distinguish process health, dependency readiness and restart policy.
- [ ] Distinguish local image IDs, mutable tags and registry manifest/index digests.
- [ ] Review the CI template's credential boundaries without enabling publication by accident.
- [ ] Rehearse dependency recovery and a same-artifact replacement without losing tasks.
- [ ] Fill in the [operations runbook](OPERATIONS-RUNBOOK.md), including owners and recovery targets.
- [ ] Explain cleanup/data-loss boundaries and record remaining uncertainties honestly.

## Maintainer evidence

See [CONTENT-REVIEW.md](../CONTENT-REVIEW.md) for dated observations and platform
details, and [LAB-VALIDATION.md](../LAB-VALIDATION.md) for reproduction commands.

| Area | Recorded evidence | What it does not establish |
| --- | --- | --- |
| Website | Node tests, seven viewports, all lessons at mobile width, touch emulation | Every browser/device or full accessibility certification |
| Accessibility | Sampled light/dark axe scans, keyboard navigation, reduced motion, CSS-zoom reachability | Screen-reader usability, physical hardware, every browser/text-zoom setting |
| Both ORM tracks | Independent builds, APIs, migrations, persistence, restore and failure-recovery tests | Every platform/architecture or large-database operational safety |
| Hardened runtime | Non-root/read-only controls, limits, shutdown/restart, same-image replacement | Public authentication, complete sandboxing or long-request drain guarantees |
| Dependencies | Lockfile audit at the recorded date | Absence of unknown issues or a full OS/image supply-chain audit |
| Website CI | Read-only GitHub Actions tests/static build | Executed GHCR template, image promotion, public deployment or TLS |

## Optional public-production gates — not completed by this course

Use these only if you separately choose to operate a public service. They are
not hidden lesson prerequisites and are not authorization to create resources.

- [ ] Implement and review authentication/authorization before storing private data.
- [ ] Provision approved infrastructure with an owner, budget and explicit teardown plan.
- [ ] Review host hardening, firewall/Docker interactions, TLS and certificate renewal.
- [ ] Separate least-privilege app/migration roles and deliver/rotate secrets securely.
- [ ] Test private-registry permissions and deploy verified app/tools digests.
- [ ] Configure protected environments/reviewers before enabling the publishing template.
- [ ] Generate/review image scan, SBOM and provenance/signature evidence and define policy.
- [ ] Test independent-host recovery, protected backup keys, retention, RPO/RTO and current writes.
- [ ] Measure capacity, connection budgets, alerting, shutdown draining and migration locking.
- [ ] Test the actual deployment architecture/platform; do not infer ARM64/native OS parity.
- [ ] Complete manual screen-reader, contrast, text enlargement and target-device review.
- [ ] Verify rights to all redistributed artwork or replace it with permitted assets.

Artwork permission cannot be established by optimization or a disclaimer. The
owner-supplied portraits remain subject to the caveats in [NOTICE.md](../NOTICE.md).
No production-security or legal sign-off is implied by a green build.

## Maintaining the guide

For a lesson change, check explanations and official references, update runnable
files and matching tests together, and rerun the affected disposable labs. For an
asset/navigation change, run the browser suites. Record actual dates/platforms
and failures, not only expected outputs. Re-audit locked dependencies when changing
packages; recheck pinned Actions with their upstream repositories before upgrades.

From a clean Git checkout, run `npm test` and `npm run build` before publishing.
Stage newly authored public files before building: the exporter copies tracked
inputs only. Inspect `dist/` for completeness and exclude secrets; never publish
the whole local working directory, backups or dependency folders. A passing
website workflow validates static packaging, not the optional production gates.
