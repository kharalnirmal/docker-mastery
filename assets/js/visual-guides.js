/* Original explanatory diagrams. Only repository-authored HTML is used here. */
(() => {
  function guide({ lesson, id, title, analogy, technical, steps, exercise, reference }) {
    const entry = window.LESSONS.find(item => item.id === lesson);
    if (!entry) throw new Error(`Missing visual-guide lesson: ${lesson}`);
    const image = `assets/images/guides/${id}.svg`;
    const html = `<h2 id="${id}">${title}</h2>
      <p><strong>Real-life analogy:</strong> ${analogy}</p>
      <p>${technical}</p>
      <figure><img src="${image}" alt="${steps.join(' → ')}" loading="lazy" width="640" height="360"><figcaption>${title}. <a href="${image}">Open full-size diagram</a>.</figcaption></figure>
      <p><strong>Workflow, also available as text:</strong></p><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol>
      <p><strong>Try explaining it:</strong> ${exercise} This reasoning exercise creates no resources and needs no cleanup.</p>
      <p>Primary reference: <a href="${reference}">${title}</a>. This diagram is a teaching model, not a production guarantee.</p>`;
    entry.html = entry.html.includes('<h2 id="cleanup"') ? entry.html.replace('<h2 id="cleanup"', html + '<h2 id="cleanup"') : entry.html + html;
    entry.keywords += ` ${title} ${id}`;
    entry.minutes += 5;
  }
  guide({
    lesson: 'first-container', id: 'shared-kernel', title: 'Processes, not tiny virtual machines',
    analogy: 'Two shops in one building have separate rooms and stock, but share the building infrastructure. Separate rooms do not make two separate buildings.',
    technical: 'Linux containers isolate process views, filesystems and networking through kernel facilities such as namespaces. Resource controls use cgroups. They still share the relevant Linux kernel: a container does not boot its own kernel. On Windows/macOS, the Linux engine normally runs in a Linux environment or VM. Isolation is useful but is not an unlimited security boundary; mounting the daemon socket or host files can undo it.',
    steps: ['Choose an image with its application and user-space files.', 'The engine starts isolated application processes.', 'Those processes call the shared Linux kernel.', 'On Desktop, that kernel belongs to the Linux environment, not the host Windows kernel.'],
    exercise: 'Why can an ordinary Linux image not provide a Windows kernel? Identify what a kernel vulnerability could affect across the shared boundary.',
    reference: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/'
  });
  guide({
    lesson: 'container-lifecycle', id: 'shutdown-signals', title: 'Graceful shutdown is a timed handover',
    analogy: 'A restaurant closes its entrance, finishes accepted orders, then locks up. Cutting the electricity immediately can abandon orders already paid for.',
    technical: 'Stopping is an opportunity to finish work, not proof that work finished. Docker sends the configured stop signal to the container main process; after the grace period it can force termination. Exec-form CMD avoids an unnecessary shell hiding the application from signals. The tracker uses init: true for signal forwarding and child reaping, plus a 30-second stop_grace_period. Those settings do not implement application-level draining or make database transactions safe automatically.',
    steps: ['Stop sends the image-configured signal to the main process.', 'The application stops accepting work and finishes or rejects in-flight requests.', 'The application closes connections and exits before its deadline.', 'If the deadline expires, forced termination may interrupt work.'],
    exercise: 'Explain why increasing the timeout cannot repair a program that ignores its signal. Which request and database evidence would demonstrate an orderly shutdown?',
    reference: 'https://docs.docker.com/reference/cli/docker/container/stop/'
  });
  guide({
    lesson: 'first-dockerfile', id: 'cache-invalidation', title: 'Cache invalidation follows changed inputs',
    analogy: 'A bakery can reuse a prepared dough batch when only the packaging changes. Changing the flour recipe means remaking the dough and everything that depends on it.',
    technical: 'A build cache result is reusable only when the instruction and its relevant inputs match. Copying package manifests and the lockfile before npm ci lets application-only edits reuse dependency installation. Copying the entire source first makes unrelated source changes invalidate that expensive step. Later dependent steps rebuild after a cache miss. Cache is a performance optimization: a clean build must still produce a correct application. Mutable base tags and unpinned downloads can change results even when your source did not change.',
    steps: ['Copy dependency manifests and lockfile into the dependency stage.', 'Install the locked dependency graph.', 'Copy application source after dependency installation.', 'Compile again when source changes; reinstall too when dependency inputs change.'],
    exercise: 'For a title-text edit versus a package-lock.json edit, predict which stages rebuild. Compare your prediction with build output before blaming a stale cache.',
    reference: 'https://docs.docker.com/build/cache/invalidation/'
  });
  guide({
    lesson: 'first-dockerfile', id: 'context-boundary', title: 'The build context is a delivery boundary',
    analogy: 'A courier can deliver only the documents inside the parcel. Marking a document as unused after sending the parcel does not make the original delivery private.',
    technical: 'The final build argument selects the context, not necessarily the Dockerfile directory. COPY reads from that context unless an explicit stage is selected. The context-root .dockerignore filters local files before they are made available to the build. Keep .env files, database dumps and local dependencies out. A Dockerfile elsewhere does not grant COPY permission to read arbitrary parent directories. Copying a secret and deleting it in a later layer is unsafe because earlier layers can retain it. Git ignore rules are not Docker ignore rules.',
    steps: ['Choose the smallest directory containing the intended build inputs.', 'Apply context-root .dockerignore before building.', 'COPY selects allowed inputs from that context or a named stage.', 'Inspect the final artifact; do not mistake a later deletion for secret removal.'],
    exercise: 'If -f selects examples/delivery/Dockerfile.buildkit but the final argument is examples/delivery, where does COPY begin? Why does .gitignore alone not protect a build?',
    reference: 'https://docs.docker.com/build/building/context/'
  });
  guide({
    lesson: 'container-networks', id: 'two-address-books', title: 'Host ports and service DNS are two address books',
    analogy: 'A customer uses the shop street address; employees call the warehouse by an internal extension. The internal extension is not a public postal address.',
    technical: 'The browser uses the host-published loopback address. The app server uses db:5432 inside its Compose network. Here 127.0.0.1:3000:3000 means host bind address, host port, then container port. EXPOSE documents intent but does not publish a port. Inside a container, localhost identifies that container, not the host or another service. Docker service DNS is network-scoped; client-side JavaScript in a laptop browser cannot connect to the database using db as if it were public DNS. PostgreSQL remains unpublished.',
    steps: ['The host browser requests the discovered loopback app port.', 'Docker forwards that connection to the app container port.', 'Server-side code resolves db on the Compose network.', 'PostgreSQL responds internally; the app returns only the intended HTTP data.'],
    exercise: 'Trace a failed browser request separately from a failed app-to-database connection. Which hostname and port belong to each hop, and which hop never needs a published DB port?',
    reference: 'https://docs.docker.com/compose/how-tos/networking/'
  });
  guide({
    lesson: 'persistent-data', id: 'storage-lifetimes', title: 'Choose storage by lifetime and ownership',
    analogy: 'A hotel room desk is temporary working space, a rented locker keeps belongings between stays, and your own suitcase remains yours. None is a second independent copy of its contents.',
    technical: 'A container writable layer remains through stop/start but disappears when that container is removed. A named volume has a separate lifecycle; removing a container does not normally remove the named volume. A bind mount points to a particular host path and carries host ownership and sharing constraints. A tmpfs mount is temporary and loses its contents when the container stops. Mounting over a populated image path hides the image contents while mounted; it does not merge every file automatically. Never use a volume deletion to fix an unexplained database startup error.',
    steps: ['Classify the data as reproducible scratch, editable source, or durable business state.', 'Select tmpfs, a bind mount, or an explicitly owned named volume accordingly.', 'Record the actual mount source before recreating containers.', 'Back up durable data independently and test a separate restoration.'],
    exercise: 'Predict which task data survives stop/start, container replacement, and explicit volume deletion. Why does a surviving volume still fail as a backup after host disk loss?',
    reference: 'https://docs.docker.com/engine/storage/'
  });
  guide({
    lesson: 'compose-stack', id: 'configuration-phases', title: 'Compose configuration happens in two phases',
    analogy: 'An event planner fills in a seating-plan template before handing each guest a place card. The planner reading a name does not mean every guest receives every name.',
    technical: 'Compose first interpolates expressions such as ${APP_PORT:-3000} from its interpolation environment. A shell variable can override a value from the selected env file. Later, service environment and env_file settings determine which values reach the container. A project .env file is not automatically copied wholesale into every service. Dockerfile ENV is another default that runtime configuration can replace. Keep the same project name, ordered -f files and --env-file selection across commands. config --quiet validates without printing resolved values; ordinary config output may expose secrets. Neither .env nor ENV is a production secret manager.',
    steps: ['Select the project, Compose files and interpolation env file deliberately.', 'Compose resolves variable expressions into the service model.', 'Service environment settings provide values to the created container.', 'Recreate the owned container to apply changed runtime values; restart keeps the old configuration.'],
    exercise: 'Why can changing APP_PORT alter publishing without defining APP_PORT inside the app? Explain why editing .env followed by restart may leave the running container unchanged.',
    reference: 'https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/'
  });
  guide({
    lesson: 'compose-stack', id: 'readiness-contract', title: 'Running, healthy and ready are different claims',
    analogy: 'A restaurant may have its lights on while the kitchen cannot prepare food. Repeatedly switching the lights off and on does not repair the kitchen.',
    technical: 'A running process can still fail real work. The tracker health endpoint proves the HTTP process responds; readiness also checks the database/schema dependency. depends_on with service_healthy coordinates initial startup but does not guarantee permanent database availability. A plain Compose healthcheck can mark a running container unhealthy; it does not by itself restart that container. Restart policies respond to process exit, not every unhealthy status. The application needs useful failure responses and dependency recovery, rather than a database outage causing endless process restarts.',
    steps: ['Check process health independently of the database.', 'Check readiness for the dependency required to serve requests.', 'When the database is unavailable, report readiness failure and inspect its evidence.', 'After dependency recovery, confirm readiness and a real demo task operation.'],
    exercise: 'Predict health, readiness and container status during the controlled database-stop lab. Why is a successful health response insufficient proof that creating a task works?',
    reference: 'https://docs.docker.com/compose/how-tos/startup-order/'
  });
  guide({
    lesson: 'nextjs-postgres', id: 'public-build-values', title: 'Browser configuration can be frozen at build time',
    analogy: 'A printed brochure keeps the phone number from printing day. Changing the office contact sheet later does not rewrite brochures already handed to customers.',
    technical: 'Next.js can inline direct NEXT_PUBLIC_* references into browser JavaScript during the production build. Changing a container environment variable later does not rewrite those emitted bundles. Server-only runtime configuration is different, but code executed during static generation may still capture build-time values. Keep DATABASE_URL in server code, never under a public prefix. To promote one image across environments, deliberately choose runtime configuration that does not depend on rebuilding public values, or clearly label environment-specific builds. A production image runs built output, not next dev.',
    steps: ['Classify each value as public browser data or private server configuration.', 'Identify whether the code reads it during build, static generation, or a runtime request.', 'Build and inspect the actual browser/server behavior with harmless sample values.', 'Promote the same artifact only when its configuration model supports that promise.'],
    exercise: 'Explain why setting a new NEXT_PUBLIC_API_URL at docker run may leave the old address visible in the browser. Which variable must never appear in a client bundle?',
    reference: 'https://nextjs.org/docs/app/guides/environment-variables'
  });
  guide({
    lesson: 'database-backups', id: 'restore-evidence', title: 'A backup is a claim until restoration is verified',
    analogy: 'Owning a spare key is not proof it opens the door. Test it on the intended lock before an emergency, without throwing away the working key.',
    technical: 'A successful pg_dump and a checksum establish useful evidence, but not complete recoverability. Restore into a separate empty database, preserve the original, and compare business rows, relationships and migration history. A tar copy of a live PostgreSQL data directory is not a substitute for a coordinated database backup. RPO is the acceptable data-loss interval; RTO includes detection, restoration and verification. Same-host restoration does not demonstrate recovery after host loss. Protect archives as sensitive data, and do not execute untrusted dump SQL casually.',
    steps: ['Record the source, time, archive identity and intended recovery targets.', 'Create and protect the database-consistent archive; record its checksum.', 'Restore into a separate disposable destination without overwriting the source.', 'Verify tasks, assignments, completion and ORM history; record elapsed recovery time.'],
    exercise: 'Would an hourly verified backup meet a five-minute RPO? What extra evidence would you need to claim host-loss recovery rather than a same-host restore?',
    reference: 'https://www.postgresql.org/docs/18/backup-dump.html'
  });
  guide({
    lesson: 'schema-upgrades', id: 'expand-contract', title: 'Expand and contract preserves release compatibility',
    analogy: 'A city opens a replacement bridge before closing the old one. Removing the old crossing first strands travelers still following yesterday\'s route.',
    technical: 'Schema and application versions can overlap during a release. First add a backward-compatible shape, such as the nullable description column in this lab. Apply the reviewed migration once through the selected tools artifact, then verify both retained rows and old application behavior. A later application can adopt the field. Backfills and constraints need their own bounded, tested plan. Remove an old field only after old readers and writers are gone and the rollback window has closed. Rolling back an application image does not undo SQL or erase new writes safely.',
    steps: ['Back up and expand the schema without breaking the current app.', 'Verify old code and existing rows against the expanded schema.', 'Deploy compatible new code and perform reviewed, resumable backfills if needed.', 'Contract only in a later reviewed change after old dependencies are retired.'],
    exercise: 'Why is adding a nullable field safer than renaming a required field in one release? Name the compatibility proof needed before returning to an old image.',
    reference: 'https://www.prisma.io/docs/guides/data-migration'
  });
  guide({
    lesson: 'migration-failures', id: 'history-versus-data', title: 'Migration bookkeeping is not the database itself',
    analogy: 'A construction checklist saying a wall was built is not the wall. Correcting a checkbox does not repair damaged brickwork, and rebuilding the wall does not automatically correct the checklist.',
    technical: 'After failed SQL, inspect both actual schema/data and the selected ORM history. In this pinned lab, Prisma records an unfinished migration and requires deliberate reconciliation; the tested Drizzle PostgreSQL transaction rolls back without adding a successful history entry. These are observations for these tools and statements, not a universal promise that failed migrations leave nothing behind. Prisma resolve changes bookkeeping, not SQL. A real backfill or nontransactional operation may need a very different recovery plan. Preserve evidence and backups; never mark a migration applied simply to silence an error.',
    steps: ['Stop additional migration attempts and capture the exact failure.', 'Inspect schema effects, business rows and migration history separately.', 'Review a repair or retry plan that matches the observed state.', 'Reconcile history only when justified, retry once, and verify retained business behavior.'],
    exercise: 'A history table says failed, but some new rows exist. Why is blindly marking rolled back unsafe? What must you establish before replaying the migration?',
    reference: 'https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting'
  });
  guide({
    lesson: 'buildkit-workflows', id: 'secret-mount-boundary', title: 'Secret mounts limit exposure, not malicious behavior',
    analogy: 'A visitor temporarily borrows a key at reception. Taking the key back prevents keeping that key, but cannot prevent the visitor from photographing it while trusted with access.',
    technical: 'BuildKit can mount a secret for one RUN without adding the secret mount itself to the resulting image layer. The instruction still has access and could copy or print its contents, so reviewed build code matters. Never use real credentials in the demonstration. A cache mount is also separate from the final image by default, but is disposable performance state rather than a credential vault. Secret contents are not themselves a normal cache-invalidation input: changing a secret does not guarantee a cached instruction reruns. Test the uncached missing-secret path separately from a cached rebuild.',
    steps: ['Provide a fake secret through the build secret interface, not COPY, ARG or ENV.', 'Allow only the reviewed RUN instruction to read the temporary mount.', 'Copy only the intended nonsecret result into the runtime stage.', 'Verify mount absence and intended behavior, while recognizing history inspection is not a complete secret scan.'],
    exercise: 'How could a malicious RUN leak a correctly mounted secret? Why must the missing-secret check use a cache miss to prove required=true is enforced?',
    reference: 'https://docs.docker.com/build/building/secrets/'
  });
  guide({
    lesson: 'secure-runtime', id: 'resource-budgets', title: 'Resource limits are different kinds of guardrail',
    analogy: 'An apartment has a power allowance, storage capacity and occupancy limit. Slowing electricity use is not the same as evicting an occupant when capacity is exceeded.',
    technical: 'CPU quotas usually throttle execution under pressure; a memory limit can lead to allocation failure or OOM termination. A PID limit constrains process/thread growth. Bounded logging limits retained Docker log files, not database growth. tmpfs uses memory and must be budgeted too. Non-root identity, dropped capabilities and a read-only filesystem restrict different actions; none replaces authentication or makes an unauthenticated tracker safe to publish. Exit 137 can follow a forced kill and is not sufficient OOM proof. Correlate OOMKilled, timestamps and observed usage before changing limits.',
    steps: ['Measure application, database, temporary files and log needs separately.', 'Set CPU, memory, PID and log budgets for the owned workload.', 'Observe throttling, exits and selected inspect fields without dumping secrets.', 'Fix the evidenced cause and remeasure; do not default to root or unlimited resources.'],
    exercise: 'An app is slow but alive; another exits with code 137. What evidence distinguishes CPU throttling from OOM or a manual kill? Why can a single stats snapshot miss a short peak?',
    reference: 'https://docs.docker.com/engine/containers/resource_constraints/'
  });
  guide({
    lesson: 'registry-artifacts', id: 'artifact-identity', title: 'Tags name releases; digests identify content',
    analogy: 'A shelf label reading today\'s edition can move to another book. A fingerprint of the exact edition lets reviewers agree which book they inspected, but does not prove its author is trustworthy.',
    technical: 'A registry tag is a mutable name unless repository policy enforces otherwise. A digest identifies particular manifest content. For multi-platform publishing, an index digest identifies the platform mapping while a platform manifest digest identifies one selected image; record which identity type you mean. An image ID from the local engine is not interchangeable with every registry digest. Pinning a digest supports reproducibility, not safety by itself. An SBOM inventories components, provenance describes build origin, and a verified signature binds an identity under a trust policy. Scanning has coverage and timing limits; none of these eliminates review.',
    steps: ['Build and test a candidate artifact with a recorded source revision.', 'Publish only after approval, then record the registry digest and supported platform.', 'Review inventory, provenance, signature policy and vulnerability findings for that artifact.', 'Deploy the reviewed digest and retain the previous compatible app/tools pair.'],
    exercise: 'Two hosts pull the same tag on different days. Why might they run different bytes? Does knowing an exact digest prove that the image is nonmalicious?',
    reference: 'https://docs.docker.com/dhi/core-concepts/digests/'
  });
  // More guides can be added here.
})();
