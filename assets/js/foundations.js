/* Second reviewed Docker batch. Loaded after the original three lessons. */
(() => {
  const additions = [
    {
      id: 'container-lifecycle', title: 'Understand the container lifecycle', navTitle: 'Container lifecycle', group: 'Getting Started', level: 'Beginner', minutes: 20,
      description: 'Distinguish a stopped container from a deleted one, inspect its state, and run a command inside it.',
      keywords: 'start stop restart rm exec inspect ps all status exit code PID1 signals writable layer',
      html: `
        <h2 id="prepare">1. The problem and starting state</h2>
        <p>Naruto closes his terminal and wonders whether the web server disappeared. A container's lifecycle is independent of the terminal when it runs detached. Prerequisites: <a href="#first-container">first container</a>, a local working engine, and an unused lab container name. No files or database are required. Allow 20 minutes.</p>
        <p>Use WSL Bash on Windows, Terminal on macOS, or Bash on Linux. Verify the local target with <code>docker context show</code>. This lesson uses Linux containers, an internet pull, and no paid infrastructure. Windows/macOS run Linux processes through their engine's Linux environment.</p>
        <h2 id="model">2. States are not interchangeable</h2>
        <p><strong>Create</strong> allocates a container from an image. <strong>Start</strong> launches its configured process. <strong>Stop</strong> ends that process but keeps metadata and the writable layer. <strong>Remove</strong> deletes the container and its writable layer. An image remains a separate reusable artifact.</p>
        <p>A container runs while its main process (PID 1 in its process namespace) runs. A successful one-off command can exit with status zero and still not be a server. A tag is not a subscription: starting an old container never pulls a replacement image automatically.</p>
        <p>Text workflow: image → create → stopped container → start → running → stop → stopped. Removing is a separate final step; restarting returns to the same container, not a fresh image.</p>
        <h2 id="run">3. Create a known container</h2>
        <p class="code-label">Terminal · state-changing · local lab</p>
        <pre><code>docker run --name ninja-life -d nginx:stable-alpine
docker ps
docker inspect ninja-life</code></pre>
        <p><code>run</code>, <code>--name</code> and <code>-d</code> are explained in the <a href="#first-container/run">first run</a>. No <code>-p</code> is needed: we are investigating process state, not publishing HTTP. <code>inspect</code> returns JSON metadata; find <code>State.Running</code>, <code>State.Status</code>, and <code>Id</code>. Record the ID to compare later. Redact environment values before sharing real inspect output.</p>
        <h2 id="inside">4. Inspect a running process safely</h2>
        <pre><code>docker exec ninja-life nginx -v
docker logs ninja-life</code></pre>
        <p><code>exec</code> starts an additional process inside an already-running container. The first positional argument is the container, then the executable and its arguments. NGINX's <code>-v</code> prints the installed server version, possibly on stderr; it is not a Docker flag. Unlike attaching to the main process, this short command ends without shutting down the server. No interactive shell or TTY flags are needed.</p>
        <p><code>logs</code> reads captured stdout/stderr; it does not guarantee that all application logs use those streams. These are inspection commands, not fixes for an unhealthy service.</p>
        <h2 id="stop-start">5. Stop, start and verify</h2>
        <pre><code>docker stop ninja-life
docker ps -a
docker inspect ninja-life
docker start ninja-life
docker inspect ninja-life</code></pre>
        <p><code>stop</code> sends the configured stop signal and waits for termination, then can force termination after its timeout. Do not assume every image uses the same signal. <code>ps -a</code> (alias <code>--all</code>) includes stopped containers. <code>start</code> starts the existing container with its original configuration. It is not <code>run</code>, which creates another one.</p>
        <p><strong>Expected:</strong> stopped state after stop, running state after start, and the <strong>same ID</strong> throughout. A restart does not repair a bad command or pick up a newly rebuilt tag. Docker-managed writable changes survive a stop/start but not container deletion; important data belongs in explicitly managed storage.</p>
        <h2 id="failures">6. Common failures and practice</h2>
        <div class="table-wrap"><table><thead><tr><th>Symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody><tr><td>exec says not running</td><td>Inspect State and logs → fix the evidenced startup problem or start your known stopped lab → check state before exec.</td></tr><tr><td>name already exists</td><td>Inspect <code>docker ps -a</code> → choose a new lab name or clean up only your old lab → record resource names.</td></tr><tr><td>start exits again</td><td>Read the exit state and logs → correct the specific command/configuration → test startup behavior, not just command return.</td></tr></tbody></table></div>
        <p><strong>Guided:</strong> record ID and state before stop, after stop, and after start. <strong>Independent:</strong> explain what a new <code>docker run</code> would do differently, without removing someone else's container.</p>
        <details><summary>Optional AI exercise</summary><p>Ask an approved assistant to compare run, start, restart and exec using only these public examples. Verify every claim against the CLI reference. The manual state comparison is the complete non-AI path.</p></details>
        <h2 id="cleanup">7. Remove only your lab</h2>
        <div class="callout warning"><strong>Warning:</strong> removal deletes the container's writable layer. First confirm ninja-life is yours. Stopping interrupts its processes.</div>
        <pre><code>docker stop ninja-life
docker rm ninja-life
docker ps -a</code></pre>
        <p>Expected: ninja-life is absent; the image remains cached. No volumes or published ports were created. Never use global pruning as routine cleanup.</p>
        <h2 id="checkpoint">8. Checkpoint and references</h2>
        <p>Can a stopped container still reserve its name? Why does exec need a running container? What does removing a container leave behind?</p>
        <p>Primary references: <a href="https://docs.docker.com/reference/cli/docker/container/start/">start</a>, <a href="https://docs.docker.com/reference/cli/docker/container/stop/">stop</a>, <a href="https://docs.docker.com/reference/cli/docker/container/exec/">exec</a>. Next: build your own image.</p>`
    },
    {
      id: 'container-networks', title: 'Connect containers with service names', navTitle: 'Networks & service names', group: 'Networking & Storage', level: 'Beginner', minutes: 25,
      description: 'Give a disposable client a private path to your web server without publishing another host port.',
      keywords: 'bridge network DNS localhost host port container-to-container wget resolve name alias connection refused',
      html: `
        <h2 id="prepare">1. Start from a built image</h2>
        <p><strong>The problem:</strong> Sakura wants one container to request another. Typing localhost inside the client points back to that client, not to the server. Prerequisites: first container, lifecycle, and <a href="#first-dockerfile">the checkpoint image</a> named <code>ninja-page:checkpoint-01</code>. Allow 25 minutes. Use a local Docker context and the same Bash platform path as earlier lessons.</p>
        <p>This local lab adds one network, one server, and a short-lived client. No database, paid service, public port, or host networking is required. It downloads the official Alpine image if missing; <code>alpine:3</code> is a mutable major tag, not a reproducible digest.</p>
        <h2 id="vocabulary">2. Network and DNS vocabulary</h2>
        <p>A <strong>user-defined bridge</strong> is a Docker-managed local network. Containers attached to it can communicate, and Docker's embedded <strong>DNS</strong> resolves their network names. A <strong>network alias</strong> is a name scoped to that network. It is not automatically a hostname your laptop browser or the public internet can resolve.</p>
        <figure><img src="assets/images/network.svg" alt="Inside the Docker Linux engine, a client on ninja-net resolves the alias web to the NGINX server and requests port 80. No host port is published; the host browser cannot use Docker-only DNS."><figcaption>Client → Docker network DNS → web:80. <a href="assets/images/network.svg">Full-size diagram</a>.</figcaption></figure>
        <h2 id="create">3. Create and inspect the network</h2>
        <p class="code-label">Terminal · state-changing, then read-only</p>
        <pre><code>docker network create ninja-net
docker network inspect ninja-net</code></pre>
        <p><code>network create</code> creates a network with the default bridge driver here. The positional name identifies it. <code>network inspect</code> reads its configuration and endpoints. Do not change network address ranges to fix a VPN problem without understanding routing and your organization's policy.</p>
        <h2 id="server">4. Start the server on that network</h2>
        <pre><code>docker run --name ninja-network-web -d --network ninja-net --network-alias web ninja-page:checkpoint-01</code></pre>
        <p><code>--network ninja-net</code> attaches this container to the selected network instead of only Docker's default bridge. <code>--network-alias web</code> registers an additional name there. Both options affect this container's network connection. Previously explained <code>--name</code> and <code>-d</code> are unchanged. No <code>-p</code>: container-to-container traffic uses the server's port 80 directly.</p>
        <h2 id="client">5. Make a request from a second container</h2>
        <pre><code>docker run --name ninja-network-client --network ninja-net alpine:3 wget -qO- http://web
docker network inspect ninja-net</code></pre>
        <p>After the image name, <code>wget</code> is the executable, and <code>http://web</code> is its URL (HTTP defaults to port 80). Wget's <code>-qO-</code> combines <code>-q</code>, quiet mode, with <code>-O -</code>, write the fetched body to stdout rather than a file. These options belong to Wget, not Docker.</p>
        <p><strong>Expected:</strong> HTML containing <strong>Team Task Tracker</strong>, a zero client exit, and the server endpoint in network inspect. The client exits after its one request and a stopped client's active endpoint need not remain in that list; the server stays running. Docker-only names do not belong in browser-visible Next.js configuration. Later, the Next.js server will use a database's service name; browsers will call a public application URL instead.</p>
        <h2 id="practice">6. Diagnose and practice</h2>
        <div class="table-wrap"><table><thead><tr><th>Symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody><tr><td>bad address / cannot resolve</td><td>Inspect network membership and alias spelling → attach the correct lab containers → use service names rather than copied IPs.</td></tr><tr><td>connection refused</td><td>Inspect server state and logs → correct the evidenced startup or listener problem → verify readiness, not just DNS.</td></tr><tr><td>host browser cannot resolve web</td><td>Identify the request's origin → publish a loopback port when host access is intended → distinguish host DNS from container DNS.</td></tr></tbody></table></div>
        <p><strong>Guided:</strong> draw both containers and label port 80. <strong>Independent:</strong> predict what localhost would mean inside the client. Try a second disposable client with a new name, inspect its result, and clean up only that client.</p>
        <details><summary>Optional AI exercise</summary><p>Ask an assistant to trace one request from the client, then one from a host browser. Require it to state which DNS and port each uses. Compare with the diagram manually; never accept host networking or disabled firewalls as an unexplained fix.</p></details>
        <h2 id="cleanup">7. Clean up the endpoints first</h2>
        <div class="callout warning"><strong>Warning:</strong> these removals delete only the named lab containers' writable layers. Confirm ownership first. Network removal disconnects the lab and must not target a shared network.</div>
        <pre><code>docker rm ninja-network-client
docker stop ninja-network-web
docker rm ninja-network-web
docker network rm ninja-net
docker network ls</code></pre>
        <p><code>network rm</code> removes the named empty network; it fails if endpoints remain. <code>network ls</code> lists networks for verification. No volumes were created. Remove any extra challenge client before removing the network.</p>
        <h2 id="checkpoint">8. Checkpoint and references</h2>
        <p>Why does this work without -p? Why should a browser not use web as a public hostname? Why is a hardcoded container IP fragile?</p>
        <p>Primary references: <a href="https://docs.docker.com/engine/network/drivers/bridge/">bridge networking</a>, <a href="https://docs.docker.com/engine/network/">network overview and DNS</a>, <a href="https://docs.docker.com/reference/cli/docker/network/">network commands</a>. Next: preserve data outside a container's writable layer.</p>`
    },
    {
      id: 'persistent-data', title: 'Preserve data and test a restore', navTitle: 'Volumes, backup & restore', group: 'Networking & Storage', level: 'Beginner', minutes: 35,
      description: 'Write one disposable note to a named volume, archive it, and prove restoration into a different volume.',
      keywords: 'persistence named volume mount backup restore tar readonly writable layer bind mount tmpfs data deletion',
      html: `
        <h2 id="prepare">1. Make the recovery target concrete</h2>
        <p><strong>The problem:</strong> Naruto learns that deleting a container can delete its writable changes. He needs data to survive replacement, and Sakura insists on a tested restore rather than “we have a backup.” Prerequisites: first container and lifecycle; local Linux engine; Bash. Allow 35 minutes. No private data, database or paid storage is involved.</p>
        <p>This lesson creates three explicitly disposable named volumes. Do not reuse existing names: first inspect <code>docker volume ls</code> (list volumes). If any ninja-notes names below already belong to another project, choose a unique prefix consistently. All commands are host commands unless stated otherwise.</p>
        <h2 id="storage">2. Know where data lives</h2>
        <p>A container's <strong>writable layer</strong> belongs to that container. A <strong>named volume</strong> is managed by Docker independently and persists until explicitly removed. A <strong>bind mount</strong> exposes a chosen host path; host ownership, file sharing and Windows/WSL filesystem placement affect it. <strong>tmpfs</strong> is memory-backed temporary storage, not a durable backup.</p>
        <p>Volumes on Desktop live in its managed Linux storage, not in your source directory. They are not automatically replicated or backed up. A backup on the same engine is a local teaching artifact, not protection against engine/disk loss.</p>
        <figure><img src="assets/images/volumes.svg" alt="A writer container writes a note into the notes volume. A reader container can read the same volume after the writer is removed. An archive in a separate backup volume is extracted into a third restored volume and the recovered note is compared."><figcaption>Prove recovery into a separate target; do not overwrite the original. <a href="assets/images/volumes.svg">Full-size diagram</a>.</figcaption></figure>
        <h2 id="write">3. Create and write a note</h2>
        <p class="code-label">Terminal · state-changing · creates disposable lab storage</p>
        <pre><code>docker volume create ninja-notes
docker run --name ninja-note-writer --mount type=volume,source=ninja-notes,target=/data alpine:3 sh -c 'printf "checkpoint-01\\n" > /data/note.txt'</code></pre>
        <p><code>volume create</code> creates named storage. <code>--mount</code> accepts comma-separated mount fields: <code>type=volume</code> selects Docker storage; <code>source</code> names it; <code>target=/data</code> is the path <strong>inside</strong> the container. Read-write is the default. Inspect names first: create can reuse an existing volume rather than resetting it.</p>
        <p><code>sh</code> is the container's shell; its <code>-c</code> executes the next string. Bash single quotes keep the host shell from interpreting that string. Inside it, <code>printf</code> writes text with a newline; <code>></code> redirects output into a file, replacing existing contents. This operator runs <strong>inside the container</strong>. Use the displayed quoting in WSL Bash, macOS or Linux Bash, not as a promised PowerShell equivalent.</p>
        <h2 id="read">4. Prove independent persistence</h2>
        <div class="callout warning">The next removal deletes the writer container's writable layer, not its named volume. Confirm the writer is your disposable lab container.</div>
        <pre><code>docker rm ninja-note-writer
docker run --name ninja-note-reader --mount type=volume,source=ninja-notes,target=/data,readonly alpine:3 cat /data/note.txt</code></pre>
        <p><code>readonly</code> makes this mount read-only; it does not encrypt the data or make other mounts safe. <code>cat</code> prints the file. <strong>Expected:</strong> exactly checkpoint-01 followed by a newline, despite removal of the writer. The separate reader exits normally after reading.</p>
        <h2 id="restore">5. Archive and restore to a new volume</h2>
        <pre><code>docker volume create ninja-notes-backup
docker volume create ninja-notes-restored
docker run --name ninja-note-backup --mount type=volume,source=ninja-notes,target=/data,readonly --mount type=volume,source=ninja-notes-backup,target=/backup alpine:3 tar -cf /backup/notes.tar -C /data .
docker run --name ninja-note-restore --mount type=volume,source=ninja-notes-restored,target=/data --mount type=volume,source=ninja-notes-backup,target=/backup,readonly alpine:3 tar -xf /backup/notes.tar -C /data
docker run --name ninja-note-verified --mount type=volume,source=ninja-notes-restored,target=/data,readonly alpine:3 cat /data/note.txt</code></pre>
        <p><code>tar</code> packages files into an archive. <code>-c</code> creates; <code>-x</code> extracts; <code>-f</code> selects the archive path. The combined <code>-cf</code> and <code>-xf</code> are tar options, not Docker flags. <code>-C /data</code> changes tar's directory before operating; <code>.</code> selects its contents for backup. Each <code>--mount</code> adds one independent mount. The source note is read-only during backup; the restored volume is the extraction target.</p>
        <p><strong>Expected:</strong> checkpoint-01 from the restored reader. No original data is deleted to prove this. These are static files with no concurrent writer. <strong>Do not copy a live PostgreSQL data directory this way:</strong> a consistent database backup requires database-specific tools and a verified restore procedure. That later lesson will use logical backups.</p>
        <h2 id="practice">6. Diagnose and practice</h2>
        <div class="table-wrap"><table><thead><tr><th>Symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody><tr><td>file missing</td><td>Inspect exact mount source/target and writer exit/logs → use the original lab volume → copy names consistently; a typo can create different storage.</td></tr><tr><td>read-only filesystem</td><td>Identify the intentional readonly mount → write only through the writer's mount → keep backup sources read-only.</td></tr><tr><td>volume in use on cleanup</td><td>Find your remaining stopped containers with ps -a → remove only the named lab containers → treat stopped containers as references too.</td></tr></tbody></table></div>
        <p><strong>Guided:</strong> compare the original and restored output. <strong>Independent:</strong> explain why an archive's existence does not prove recovery, and where a real off-host backup would need to live. Do not test by deleting the original volume.</p>
        <details><summary>Optional AI exercise</summary><p>Ask an assistant to label every source, target and destructive operation in these commands. Check its answer against the manual explanation. Reject advice to apply this static-file archive to a live database.</p></details>
        <h2 id="cleanup">7. Deliberately delete only disposable data</h2>
        <div class="callout warning"><strong>Permanent data deletion:</strong> volume removal below deletes the note, archive and restored copy. Verify each name belongs to this lab and that the restore comparison succeeded. Do not proceed for real data. No global prune is needed.</div>
        <pre><code>docker rm ninja-note-reader ninja-note-backup ninja-note-restore ninja-note-verified
docker volume inspect ninja-notes ninja-notes-backup ninja-notes-restored
docker volume rm ninja-notes ninja-notes-backup ninja-notes-restored
docker volume ls</code></pre>
        <p><code>volume inspect</code> reads metadata for each named volume. <code>volume rm</code> removes only the specified volumes; multiple positional names do not mean “all.” Verify those three names are absent. The earlier writer was already removed.</p>
        <h2 id="checkpoint">8. Checkpoint and references</h2>
        <p>Which data survives stop, container removal, and volume removal? What does readonly protect? Why does a same-engine archive not protect against disk loss?</p>
        <p>Primary references: <a href="https://docs.docker.com/engine/storage/volumes/">volumes and backup/restore</a>, <a href="https://docs.docker.com/engine/storage/bind-mounts/">bind mounts</a>, <a href="https://docs.docker.com/engine/storage/tmpfs/">tmpfs</a>. Next: practice evidence-led troubleshooting; database persistence and Compose will build on these concepts.</p>`
    },
    {
      id: 'command-reference', title: 'Docker command field reference', navTitle: 'Commands & glossary', group: 'Reference', level: 'Optional', minutes: 20,
      description: 'Find commands and glossary definitions by task, with scope, risks and links to the full explanation.',
      keywords: 'cheatsheet commands flags reference run start stop rm logs inspect network volume build glossary RPO RTO SLO SBOM provenance digest registry repository daemon context bind mount tmpfs migration seed health readiness liveness rollback',
      html: `
        <h2 id="prepare">1. Use this after the lessons</h2>
         <p>Prerequisites: complete the relevant lab before reusing a command. Estimated effort: 20 minutes. The problem is recall, not learning unfamiliar flags from a wall of commands. Names below refer only to your known disposable lab. Use WSL Bash, macOS Terminal or Linux Bash. No paid infrastructure is involved.</p>
        <h2 id="inspect">2. Inspect before changing state</h2>
        <pre><code>docker context show
docker version
docker ps -a</code></pre>
        <p>Read-only: confirm local target, Client/Server connectivity, and stopped as well as running containers. <code>-a</code> means all containers, not all resources. Expected results depend on your machine; never copy example IDs from someone else. <a href="#first-container/engine">Full setup explanation</a>.</p>
        <h2 id="lifecycle">3. Manage an existing container</h2>
        <div class="table-wrap"><table><thead><tr><th>Task</th><th>Command</th><th>Scope and risk</th></tr></thead><tbody><tr><td>Read output</td><td><code>docker logs ninja-life</code></td><td>Read-only; output may contain secrets.</td></tr><tr><td>Read metadata</td><td><code>docker inspect ninja-life</code></td><td>Read-only; redact environment values.</td></tr><tr><td>Stop</td><td><code>docker stop ninja-life</code></td><td>Interrupts that container's processes.</td></tr><tr><td>Start again</td><td><code>docker start ninja-life</code></td><td>Uses the existing command and image, not a refreshed tag.</td></tr></tbody></table></div>
        <p><a href="#container-lifecycle">Lifecycle explanation and verification</a>. Do not run stop/start without confirming the name and impact.</p>
        <h2 id="images">4. Build and run are different tasks</h2>
        <p><code>docker build -t ninja-page:checkpoint-01 .</code> builds an image from the current context. <code>-t</code> assigns a name/tag; <code>.</code> selects the host directory. It does not deploy or publish. <a href="#first-dockerfile/build">Full flag and context explanation</a>.</p>
        <p>To reach a running container locally, publish with <code>-p 127.0.0.1:8080:80</code>: host address, host port, container port. EXPOSE is not port publication. <a href="#first-container/run">Full run explanation</a>.</p>
        <h2 id="networks">5. Diagnose communication</h2>
        <p><code>docker port ninja-web</code> reads host mappings. <code>docker network inspect ninja-net</code> reads network endpoints. Docker network DNS is for connected containers, not automatically a browser's DNS. <a href="#container-networks">Networking lab</a>.</p>
        <h2 id="storage">6. Locate data before cleanup</h2>
        <p><code>docker volume ls</code> lists storage; <code>docker volume inspect ninja-notes</code> reads its metadata. A named volume can survive container removal and still be lost when the engine's storage fails. <a href="#persistent-data">Persistence and verified restore</a>.</p>
        <div class="callout warning"><strong>Warning:</strong> <code>docker rm</code> deletes a container's writable layer, and <code>docker volume rm</code> permanently deletes named-volume data. Use the full lab cleanup with exact verified names; no bulk deletion shortcut is provided here.</div>
        <h2 id="practice">7. Recall without guessing</h2>
        <p><strong>Guided:</strong> find the read-only command for checking an exited container. <strong>Independent:</strong> explain what changes when you replace a host port, and what does not. For cleanup, return to the lab you actually created rather than copying another lab's names.</p>
        <details><summary>Optional AI exercise</summary><p>Ask an assistant for one read-only diagnostic for a sanitized error. Explain its flags yourself before running it. Manual path: choose the task above and open the linked lesson.</p></details>
         <h2 id="glossary">Glossary: distinguish the similar words</h2>
         <div class="table-wrap"><table><thead><tr><th>Term</th><th>Meaning and common confusion</th></tr></thead><tbody>
         <tr><td>Image / container</td><td>Packaged filesystem/configuration / running or stopped instance with a writable layer. Stopping is not removal.</td></tr>
         <tr><td>Client / daemon / context</td><td>CLI / engine managing resources / selected engine connection. A local CLI can target a remote daemon.</td></tr>
         <tr><td>Registry / repository / tag / digest</td><td>Image service / named image collection / movable label / content identity. A source Git repository stores code, not container images.</td></tr>
         <tr><td>Build context / Dockerfile / layer</td><td>Files available to a build / build instructions / filesystem change. Excluding a secret from the context is safer than deleting it in a later layer.</td></tr>
         <tr><td>Stage / target / cache</td><td>Named build phase / selected output stage / reusable build results. Cache is disposable, not application persistence.</td></tr>
         <tr><td>Bind mount / named volume / tmpfs</td><td>Specific host path / engine-managed durable storage / ephemeral in-memory filesystem. None is automatically a backup.</td></tr>
         <tr><td>Published port / EXPOSE / DNS</td><td>Host forwarding / image documentation / hostname resolution. A healthy container need not have a published port.</td></tr>
         <tr><td>Compose service / project / profile</td><td>One service definition / resource namespace / opt-in group. A project name does not reserve a host port.</td></tr>
         <tr><td>Environment / build argument / secret mount</td><td>Process configuration / build input / temporary build-time secret file. Environment and build arguments are not safe secret stores.</td></tr>
         <tr><td>Health / readiness / liveness</td><td>Reported check status / ability to serve dependency-backed work / process-level ability to continue. Compose health alone does not trigger restart.</td></tr>
         <tr><td>Schema / migration / seed</td><td>Database structure / reviewed change history / initial demo rows. Repeating a seed must not erase existing work.</td></tr>
         <tr><td>Backup / restore / rollback</td><td>Recovery copy / recovery from that copy / returning to an earlier release. An app rollback does not reverse SQL.</td></tr>
         <tr><td>RPO / RTO / SLO</td><td>Target maximum data loss / target recovery duration / defined service reliability objective. Targets are not measured guarantees.</td></tr>
         <tr><td>SBOM / scan / provenance / signature</td><td>Component inventory / known-vulnerability matching / build-origin claim / identity-bound authenticity. None alone proves a safe application.</td></tr>
         </tbody></table></div>
         <p>For commands to inspect a real incident and a fill-in handoff, use the <a href="docs/OPERATIONS-RUNBOOK.md">operations runbook</a>. Use the <a href="docs/COMPLETION-CHECKLIST.md">completion checklist</a> to record what you actually verified.</p>
         <h2 id="references">8. Checkpoint and official references</h2>
         <p>Can you identify the daemon target, resource scope and destructive effect before using any command here? Primary reference: <a href="https://docs.docker.com/reference/cli/docker/">Docker CLI reference</a>. Continue with <a href="#nextjs-postgres">the Next.js/PostgreSQL checkpoint</a>, then Compose, recovery and secure delivery. All 20 lessons are available; production and cross-platform validation limits are recorded separately.</p>`
    }
  ];
  const existing = window.LESSONS;
  existing[0].group = 'Getting Started'; existing[0].navTitle = 'Your first container';
  existing[1].group = 'Building Images'; existing[1].navTitle = 'Your first Dockerfile';
  existing[2].group = 'Troubleshooting'; existing[2].navTitle = 'Diagnose a failure';
  const byId = new Map([...existing, ...additions].map(item => [item.id, item]));
  window.LESSONS = ['first-container', 'container-lifecycle', 'first-dockerfile', 'container-networks', 'persistent-data', 'troubleshooting', 'command-reference'].map(id => byId.get(id));
})();
