/* Authored HTML is trusted local content. Never insert search text into this HTML. */
window.LESSONS = [
  {
    id: 'first-container', title: 'Run your first container', group: '01 / FOUNDATIONS', level: 'Beginner', minutes: 35,
    description: 'Start a tiny web server, trace a browser request, and stop it without touching your other work.',
    keywords: 'docker run hello-world nginx WSL2 setup ports publish localhost daemon engine context name conflict virtualization terminal Bash shell quoting paths exit status YAML JSON AMD64 ARM64',
    html: `
      <div class="callout"><strong>Lab reviewed:</strong> core container, image, HTTP and failure workflows were exercised on a Windows client with a local Linux Docker engine. See the <a href="CONTENT-REVIEW.md">review log</a> for versions, actual checks and platform limits. Expected results below describe what to verify; they are not copied test transcripts.</div>
      <h2 id="prepare">1. Before you begin</h2>
      <p><strong>The problem:</strong> Naruto has joined a team. Before packaging the task tracker, he needs to prove that his machine can run a Linux container and reach it from a browser.</p>
      <p>Prerequisites: open a terminal, recognize a command and its arguments, and understand that a <strong>port</strong> identifies a network service. <strong>localhost</strong> means the machine making a request; <strong>HTTP</strong> is the request/response protocol a browser uses here. This lesson creates no course application or database.</p>
      <ul><li><strong>Windows (primary path):</strong> use supported Windows, WSL2, a supported Linux distribution, and Docker Desktop with Linux containers and WSL integration enabled for that distribution. Open that distribution's <strong>Bash</strong> terminal. Keep later projects in its Linux home directory, not under <code>/mnt/c</code>, for bind-mount performance. Use LF line endings for future shell scripts.</li>
      <li><strong>macOS:</strong> use supported Docker Desktop and Terminal. Linux containers run in a VM. Apple Silicon needs ARM64-compatible images; do not force an AMD64 image without understanding emulation.</li>
      <li><strong>Linux:</strong> follow Docker Engine's official instructions for your distribution. Docker Desktop is optional. Docker-group membership effectively grants root-level host access; consider rootless Docker rather than casually changing socket permissions.</li></ul>
       <p>An 8 GB machine is the planning target, not a measured guarantee. Close heavy apps and run one lab at a time. Check current installation support, virtualization requirements, resource settings, and organizational Docker Desktop licensing before installing. Do not disable endpoint protection or bypass company policy.</p>
      <p>Official setup: <a href="https://docs.docker.com/desktop/setup/install/windows-install/">Windows</a>, <a href="https://docs.docker.com/desktop/setup/install/mac-install/">macOS</a>, <a href="https://docs.docker.com/engine/install/">Linux Engine</a>, and <a href="https://docs.docker.com/subscription/desktop-license/">Desktop licensing</a>. These are installation prerequisites, not embedded installation scripts.</p>
       <h2 id="terminal-basics">Beginner primer: read the terminal before running a lab</h2>
       <p>A <strong>shell</strong> interprets commands; a terminal displays that shell. These labs use Bash, including WSL Bash on Windows. PowerShell is a different shell: do not assume its quoting, variables or continuation syntax is identical. Do not copy a prompt symbol such as <code>$</code> into a command. Commands below are read-only and run on your host:</p>
       <pre><code>pwd
ls
printf '%s\\n' "$HOME"
docker context show</code></pre>
       <p><code>pwd</code> prints the working directory; <code>ls</code> lists its visible entries. A <strong>relative path</strong> starts there: <code>examples/compose/prisma</code> means that directory under the guide root. An <strong>absolute path</strong> begins at the filesystem root. <code>$HOME</code> expands your home-directory variable; double quotes keep a path containing spaces one argument. <code>printf</code> prints with a format: <code>%s</code> is a string and <code>\\n</code> is a newline. Expected: your own path and context, not a specific example value. <code>cd</code> changes only your shell's directory, not the Docker daemon's storage.</p>
       <p>A <strong>process</strong> is a running program. <kbd>Ctrl+C</kbd> interrupts a foreground process, but does not automatically stop a detached container. An <strong>exit status</strong> of zero conventionally means success; nonzero means inspect the failure before continuing. Bash <code>echo "$?"</code> prints the preceding command's status, so run it immediately after that command. A command succeeding does not prove its output is correct.</p>
       <p>A <strong>flag</strong> changes a command's behavior; a positional argument names its input or target. <code>|</code> passes output to another command; <code>&amp;&amp;</code> runs the next command only if the first succeeds; <code>&gt;</code> writes to a file and can overwrite it. These are shell operators, not Docker flags. Single quotes preserve literal text; double quotes allow variable expansion. Later lessons label which shell interprets a quoted command.</p>
       <p>A <strong>host</strong> is the environment running Docker or your browser. The same word <code>localhost</code> refers to different machines/namespaces when used by your host, an app container or a database container. A URL combines protocol, hostname and optional port; DNS translates a hostname into an address. Port publication and container service DNS solve different problems.</p>
       <p>Configuration is not a terminal command: a Dockerfile describes a build; YAML uses indentation and <code>key: value</code> mappings (use spaces, not tabs); JSON uses quoted keys, braces and arrays; <code>.env</code> files provide text <code>NAME=value</code> entries for tools that explicitly load them. A value in an env file is not automatically available everywhere or protected as a secret. AMD64 and ARM64 are CPU architectures; use compatible images rather than assuming all binaries run on either.</p>
       <p>To obtain the guide, use the <a href="README.md">clone instructions</a>. <code>git clone</code> downloads a repository and its history into a new directory; it does not install Docker or start the app. Do not clone into an existing working directory full of unrelated files. <strong>Guided:</strong> locate the guide root with pwd/ls. <strong>Independent:</strong> explain where a relative path resolves after changing directories, and why quoting a path with spaces matters. No files or containers are created by the read-only primer; no cleanup is needed. Reference: <a href="https://www.gnu.org/software/bash/manual/bash.html">GNU Bash manual</a>.</p>
       <h2 id="model">2. What is actually running?</h2>
      <p>An <strong>image</strong> is a packaged filesystem and execution configuration. A <strong>container</strong> is an isolated set of processes started from an image, with its own writable layer. Containers share the relevant Linux kernel; they are not miniature VMs and isolation is not absolute. Desktop supplies that Linux kernel through a VM or WSL2 environment.</p>
       <p>The Docker <strong>client</strong> sends requests to the <strong>daemon</strong> (engine). A <strong>registry</strong> stores images. A <strong>tag</strong>, such as <code>stable-alpine</code>, is a mutable label, not a permanent identity. Later delivery lessons use immutable digests. This checkpoint uses official NGINX images and needs internet access for the first pull.</p>
      <figure><img src="assets/images/ports.svg" alt="Browser requests host 127.0.0.1 port 8080. Docker forwards to port 80 in the NGINX container, inside the Linux engine environment. It is not a public database connection."><figcaption>Publishing connects a host port to a container port. <a href="assets/images/ports.svg">Open full-size diagram</a>.</figcaption></figure>
      <h2 id="engine">3. Verify the engine first</h2>
      <p class="code-label">Terminal · read-only inspection · WSL Bash / macOS / Linux</p>
      <pre><code>docker version
docker context show
docker compose version</code></pre>
      <p><code>docker version</code> should report both Client and Server. A client alone does not prove engine connectivity. <code>context show</code> prints the selected daemon connection; make sure it is your local lab, not a remote workplace server. <code>compose version</code> checks the v2 plugin for later lessons; Compose is not used yet. These commands have no flags.</p>
      <p>If the server is missing, start the locally installed engine/Desktop and check WSL integration or service status. Do not switch contexts blindly or reinstall/delete Docker data.</p>
      <h2 id="run">4. Start small, then publish a port</h2>
      <p class="code-label">Terminal · state-changing · downloads an image and creates a container</p>
      <pre><code>docker run hello-world</code></pre>
      <p><code>run</code> creates and starts a new container. <code>hello-world</code> is the positional image argument; without a tag Docker uses <code>latest</code>, a mutable default, not a promise of a verified newest release. Expected behavior: a greeting and then a normal exit. This is not a long-running web server.</p>
      <p>Now solve a different problem: keep a web server running and reach it locally. Use the following expanded command only after reading its parts.</p>
      <pre><code>docker run --name ninja-web -d -p 127.0.0.1:8080:80 nginx:stable-alpine</code></pre>
      <div class="table-wrap"><table><thead><tr><th>Part</th><th>Meaning and effect</th></tr></thead><tbody>
      <tr><td><code>--name ninja-web</code></td><td>Assigns an explicit container name instead of an automatically generated one. Names must be unique on this daemon.</td></tr>
      <tr><td><code>-d</code> / <code>--detach</code></td><td>Returns your terminal while the container runs in the background. Without it, you remain attached to its output.</td></tr>
      <tr><td><code>-p</code> / <code>--publish</code></td><td>Creates a port forwarding rule when the container is created. Without it, the web server has no published host port.</td></tr>
      <tr><td><code>127.0.0.1:8080:80</code></td><td>Host address : host port : container port. Keep the host binding loopback-only. Omitting the address normally publishes on all interfaces.</td></tr>
      <tr><td><code>nginx:stable-alpine</code></td><td>Image name and mutable tag. NGINX serves HTTP on container port 80. Docker selects a compatible architecture when available.</td></tr>
      </tbody></table></div>
      <p class="code-label">Terminal · read-only inspection</p>
      <pre><code>docker ps
docker port ninja-web
docker logs ninja-web</code></pre>
      <p><code>ps</code> lists running containers; <code>port</code> shows the named container's mappings; <code>logs</code> reads its captured standard output/error. All three commands are flag-free here. Open <a href="http://localhost:8080">http://localhost:8080</a> in your host browser. Expected: the NGINX welcome page, an <code>Up</code> container, and a mapping from <code>127.0.0.1:8080</code> to container port <code>80</code>. IDs, timings, and log lines vary.</p>
      <h2 id="changed">5. What changed, and what can fail?</h2>
      <p>The image is cached in the engine's storage, not your working directory. A named container and its writable layer exist there too. No project files, database, bind mounts, or named volumes were created. Docker Desktop stores this data in its managed Linux environment; it is not your Windows filesystem.</p>
      <div class="table-wrap"><table><thead><tr><th>Symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody>
      <tr><td>Cannot connect to daemon</td><td>Check Client/Server and local context → start the intended engine → verify before every lab.</td></tr>
      <tr><td>Port already allocated</td><td>Inspect existing mappings with <code>docker ps</code> → choose unused host port 8081, retaining container port 80 → reserve lab ports. Do not kill an unknown process.</td></tr>
      <tr><td>Name already in use</td><td>Inspect <code>docker ps -a</code> (<code>-a</code>, alias <code>--all</code>, includes stopped containers) → use a new name or clean up only your known lab container → record ownership.</td></tr>
      <tr><td>Pull fails</td><td>Check registry reachability, VPN/proxy policy and architecture → retry after correcting the verified cause → use approved network configuration, not disabled TLS.</td></tr>
      </tbody></table></div>
      <h2 id="practice">6. Mission and independent challenge</h2>
      <p><strong>Guided:</strong> point to each port in the diagram and explain why the browser uses 8080, not 80. Confirm the mapping with <code>docker port ninja-web</code>.</p>
      <p><strong>Independent:</strong> create a second server named <code>ninja-web-two</code> on host port 8081. Predict whether both can listen on container port 80, then verify. They can: each container has its own network namespace. Clean up both named containers.</p>
      <details><summary>Optional AI exercise (manual path above is complete)</summary><p>Provide only the sample run command, not private logs. Ask: “Explain every argument, then show what network exposure changes if 127.0.0.1 is removed.” Compare its answer to Docker's publishing documentation. Do not execute suggestions without reviewing them.</p></details>
      <h2 id="cleanup">7. Stop and clean up safely</h2>
      <div class="callout warning"><strong>Container removal deletes its writable layer.</strong> Confirm these are your disposable lab containers. No volume removal or global prune is needed. Leave shared images and other containers alone.</div>
      <pre><code>docker stop ninja-web
docker rm ninja-web</code></pre>
      <p><code>stop</code> asks the main process to terminate and waits before forcing it if necessary; <code>rm</code> removes the stopped container. The argument names one container, not everything. Repeat with <code>ninja-web-two</code> if created. For the exited greeting container, inspect <code>docker ps -a</code>, identify its exact name, and pass that name to <code>docker rm</code>. Never paste a placeholder as if it were a real name.</p>
      <p>Verify the named containers are absent with <code>docker ps -a</code>. The downloaded images intentionally remain cached.</p>
      <h2 id="checkpoint">8. Checkpoint and references</h2>
      <p>You can now distinguish image from container and host from container port. Before continuing: Why does hello-world exit? What does a tag identify? Why does a running container not automatically have a public URL?</p>
      <p>Primary references: <a href="https://docs.docker.com/reference/cli/docker/container/run/">docker run</a>, <a href="https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/">port publishing</a>, <a href="https://docs.docker.com/engine/manage-resources/contexts/">contexts</a>. Next: understand the container lifecycle before building your own image.</p>`
  },
  {
    id: 'first-dockerfile', title: 'Build an image, line by line', group: '02 / IMAGE BUILDING', level: 'Beginner', minutes: 25,
    description: 'Turn a tiny team landing page into an image, and learn exactly what each Dockerfile instruction changes.',
    keywords: 'Dockerfile build context FROM WORKDIR COPY RUN CMD EXPOSE dockerignore layers cache nginx tag file permissions',
    html: `
      <h2 id="starting-point">1. A deliberately small starting point</h2>
      <p><strong>The problem:</strong> Naruto needs a repeatable team landing page, not a web server he edits by hand after startup. Prerequisite: complete <a href="#first-container">your first container</a>, including setup and safe cleanup. Estimated effort: 25 minutes.</p>
      <p>This is a static packaging exercise, <strong>not the Next.js + PostgreSQL task tracker</strong>. The <a href="#nextjs-postgres">next application checkpoint</a> offers equal Prisma/Drizzle tracks. No ORM, Node.js, database, or package manager is needed for this static checkpoint.</p>
      <div class="callout">The checkpoint image was built and served its page through loopback HTTP in a disposable local test. See the <a href="CONTENT-REVIEW.md">review log</a>. This image is a local teaching artifact, not a hardened deployment.</div>
      <p>Open a local copy of this project. In WSL Bash, macOS Terminal, or Linux Bash, navigate from the project root:</p>
      <pre><code>cd examples/docker/01-static-page
pwd
ls</code></pre>
      <p><code>cd</code> changes your shell's working directory; the path is relative to the project root. <code>pwd</code> prints the current directory. <code>ls</code> lists files, including the Dockerfile and page (hidden files require other options not needed here). These run on the <strong>host</strong>, not in a container. Windows users should keep their lab copy in the WSL Linux filesystem. Paths shown use forward slashes.</p>
      <h2 id="files">2. Read the complete files</h2>
      <p>A <strong>build context</strong> is the set of files the builder can access. A <strong>Dockerfile instruction</strong> is not a CLI flag or a command to paste into a shell. An image consists of filesystem layers plus configuration; a running container adds its own writable layer.</p>
      <p class="code-label">File contents · Dockerfile</p>
      <pre><code>FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
COPY index.html ./index.html
RUN test -s index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]</code></pre>
      <div class="table-wrap"><table class="instruction-table"><thead><tr><th>Instruction</th><th>Purpose, scope, and observable effect</th></tr></thead><tbody>
      <tr><td><code>FROM</code></td><td>Starts from the official NGINX Alpine image. Its tag is mutable; future pulls may differ. This inherits its filesystem, entrypoint and configuration. It is not a new VM.</td></tr>
      <tr><td><code>WORKDIR</code></td><td>Sets an absolute directory inside the image for subsequent instructions and runtime working directory. It does not change your host shell directory.</td></tr>
      <tr><td><code>COPY</code></td><td>Copies the context's index.html into that image directory, replacing the welcome page. Source paths are relative to the context; the destination here is relative to WORKDIR.</td></tr>
      <tr><td><code>RUN</code></td><td>Executes at build time. Shell builtin <code>test -s</code> checks that the file exists and is nonempty; <code>-s</code> belongs to <code>test</code>, not Docker. A false test makes the build fail. It does not run the web server.</td></tr>
      <tr><td><code>EXPOSE</code></td><td>Documents intended container port 80/TCP. It does not publish a host port or enforce network isolation.</td></tr>
      <tr><td><code>CMD</code></td><td>Provides default runtime arguments using a JSON array (exec form). The inherited NGINX entrypoint processes them. NGINX's <code>-g</code> sets global directives; <code>daemon off;</code> keeps the server in the foreground, rather than exiting the container's main process. The semicolon is inside an argument, not a host shell operator.</td></tr>
      </tbody></table></div>
      <p class="code-label">File contents · index.html</p>
      <pre><code>&lt;!doctype html&gt;
&lt;html lang="en"&gt;
&lt;meta charset="utf-8"&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
&lt;title&gt;Team Task Tracker · packaging checkpoint&lt;/title&gt;
&lt;h1&gt;Team Task Tracker&lt;/h1&gt;
&lt;p&gt;Packaging checkpoint 01. No database or private data.&lt;/p&gt;
&lt;/html&gt;</code></pre>
      <p class="code-label">File contents · .dockerignore</p>
      <pre><code>.git
.env
.env.*
node_modules
*.log</code></pre>
      <p>These patterns exclude matching files from the context. Explicit COPY already limits this example, but a safe context prevents accidental future copying of common secrets and clutter. This is not a universal secret detector. Never put real credentials in the directory, image, build arguments, or lesson screenshots.</p>
      <figure><img src="assets/images/build.svg" alt="Host directory sends Dockerfile and index.html as the filtered build context to the builder. FROM selects NGINX; COPY adds the page; RUN checks it; CMD configures startup. The resulting image creates a separate container."><figcaption>A build produces an image; running produces a container. <a href="assets/images/build.svg">Open full-size diagram</a>.</figcaption></figure>
      <h2 id="build">3. Build, then name the result</h2>
      <p class="code-label">Terminal · state-changing · from examples/docker/01-static-page</p>
      <pre><code>docker build .</code></pre>
      <p>The positional <code>.</code> means “use this directory as the build context.” Docker looks for <code>Dockerfile</code> there by default. Expected: all steps succeed and an image is produced. The build may download the base image. It does not start your server.</p>
      <p>An unnamed image is hard to find later. Add one option for this concrete problem:</p>
      <pre><code>docker build -t ninja-page:checkpoint-01 .</code></pre>
      <p><code>-t</code> (alias <code>--tag</code>) assigns the local image name and tag. It does not push to a registry. Repeating the command can reuse cached steps if inputs have not changed; do not assume every rebuild downloads or reruns everything. Changing index.html invalidates COPY and later dependent steps. The tag points to the new build; an already-running container still uses its original image.</p>
      <h2 id="verify">4. Run and verify the artifact</h2>
      <pre><code>docker run --name ninja-page -d -p 127.0.0.1:8080:80 ninja-page:checkpoint-01
docker ps
docker logs ninja-page</code></pre>
      <p>These flags were introduced in <a href="#first-container/run">the first run lesson</a>. Use 8081 instead if 8080 belongs to another service. Visit <a href="http://localhost:8080">localhost:8080</a>: expected heading <strong>Team Task Tracker</strong> and the checkpoint sentence. This verifies HTTP behavior, not just a successful build.</p>
      <p>The page now lives in an image layer in engine storage. Editing the host file does not edit a running container: no bind mount exists. The base image's entrypoint and server remain inherited; this exercise does not claim non-root execution, a read-only filesystem, or production hardening. Later lessons address those explicitly.</p>
      <h2 id="failures">5. Common failures</h2>
      <div class="table-wrap"><table><thead><tr><th>Symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody>
      <tr><td>Dockerfile not found</td><td>Use <code>pwd</code> and <code>ls</code> → move into this checkpoint directory → always check the context before build.</td></tr>
      <tr><td>COPY file not found</td><td>Check filename case, context and ignore patterns → restore index.html in the context → keep explicit COPY paths. Linux is case-sensitive.</td></tr>
      <tr><td>test exits nonzero</td><td>Confirm index.html is nonempty → restore its complete contents → retain a meaningful build check.</td></tr>
      <tr><td>Old page after editing</td><td>Compare the edited source, rebuilt tag and running container → rebuild then stop/remove only your old lab container and rerun → remember containers do not auto-update from a tag.</td></tr>
      </tbody></table></div>
      <h2 id="practice">6. Mission and independent challenge</h2>
      <p><strong>Guided:</strong> change the page's sentence, rebuild with the same tag, then recreate your container and verify the new page. Observe which build steps report cache reuse (wording varies).</p>
      <p><strong>Independent:</strong> explain why removing EXPOSE would not stop an explicit port publication. Predict the result before testing a rebuilt disposable image. Restore the file afterward. Do not remove unknown images to “fix” caching.</p>
      <details><summary>Optional AI review</summary><p>Ask an approved assistant to identify which Dockerfile lines run at build time versus runtime. Supply only these public example files. Verify against the Dockerfile reference yourself and reject any claim that EXPOSE publishes a host port. The manual table above is the equivalent path.</p></details>
      <h2 id="cleanup">7. Safe cleanup</h2>
      <div class="callout warning">The next commands delete this container's writable layer. Confirm the name is yours. They do not delete your source, image, or any volumes.</div>
      <pre><code>docker stop ninja-page
docker rm ninja-page
docker ps -a</code></pre>
      <p>Confirm ninja-page is absent. Keep the small image for the next lesson. No prune command is needed.</p>
      <h2 id="checkpoint">8. Checkpoint and references</h2>
      <p>Can you explain why RUN is not CMD, why the context matters, and why rebuilding does not replace an existing container? Continue only when you can verify a changed page through HTTP.</p>
      <p>Primary sources: <a href="https://docs.docker.com/reference/dockerfile/">Dockerfile reference</a>, <a href="https://docs.docker.com/build/building/context/">build context and .dockerignore</a>, <a href="https://docs.docker.com/build/cache/invalidation/">cache invalidation</a>, <a href="https://hub.docker.com/_/nginx">official NGINX image</a>. Next: connect containers using network names.</p>`
  },
  {
    id: 'troubleshooting', title: 'Diagnose a container that exits', group: '03 / FAILURE LAB', level: 'Intermediate', minutes: 25,
    description: 'Reproduce one harmless failure, gather evidence, and verify the smallest safe recovery.',
    keywords: 'troubleshoot exited exit code bad command logs inspect ps -a CrashLoopBackOff permission denied OOM port conflict',
    html: `
      <h2 id="prepare">1. Establish a known starting state</h2>
      <p><strong>The problem:</strong> Sakura receives a report: “The image built, but the service is down.” Rebuilding everything would erase evidence without explaining the failure.</p>
      <p>Prerequisites: the first-container and Dockerfile lessons; a local working engine; the <code>ninja-page:checkpoint-01</code> image built from <a href="#first-dockerfile">checkpoint 01</a>. This lab deliberately changes the startup command, not any source files or data. It needs no database and adds no paid services. Estimated effort: 25 minutes.</p>
      <div class="callout warning">Use only your disposable local Docker context, verified with <code>docker context show</code>. This missing-config failure and default-command recovery were exercised locally; expected outcomes below are explanations, not a recorded transcript. Do not run this against workplace services.</div>
      <h2 id="reproduce">2. Reproduce a controlled failure</h2>
      <p class="code-label">Terminal · state-changing · deliberate failure</p>
      <pre><code>docker run --name ninja-broken -d ninja-page:checkpoint-01 nginx -t -c /missing.conf</code></pre>
      <p>The run options and image tag are from previous lessons. Arguments <strong>after the image</strong> override its CMD; the inherited entrypoint still runs. These are NGINX options, not Docker options: <code>-t</code> tests configuration and exits; <code>-c /missing.conf</code> selects an intentionally nonexistent configuration file instead of the default. No port is published because this process is not intended to serve traffic.</p>
      <p>The detached command may print a container ID before the process fails. That only confirms container creation, not a healthy service. Wait briefly before inspection; do not assume a fixed timing.</p>
      <h2 id="evidence">3. Gather read-only evidence</h2>
      <pre><code>docker ps
docker ps -a
docker logs ninja-broken
docker inspect ninja-broken</code></pre>
      <p><code>ps</code> omits stopped containers by default. As introduced in the first lesson, <code>-a</code> / <code>--all</code> includes them. <code>logs</code> reads captured output. <code>inspect</code> returns detailed JSON metadata for the named object. It does not enter the container or change it.</p>
      <p>Expected evidence: ninja-broken is absent from the running list, present as exited in the full list, and its logs mention the missing configuration. In inspect, look at <code>State.Status</code>, <code>State.ExitCode</code>, <code>State.OOMKilled</code>, <code>Config.Cmd</code>, and <code>Config.Image</code>. A nonzero exit means failure; the number alone is not a universal diagnosis. Do not infer OOM without supporting state and host evidence.</p>
      <p>Inspection output may contain environment secrets in real applications. Never paste it wholesale into an issue or AI tool. This lab has no course credentials.</p>
      <figure><img src="assets/images/diagnosis.svg" alt="Report service down, inspect container state and logs, test a single startup-command hypothesis, recreate only the disposable container, and verify an HTTP response before declaring recovery."><figcaption>Evidence → one hypothesis → minimal fix → behavioral verification. <a href="assets/images/diagnosis.svg">Open full-size diagram</a>.</figcaption></figure>
      <h2 id="diagnosis">4. Explain the failure before fixing it</h2>
      <p><strong>Observed:</strong> the process exits and reports a missing config. <strong>Hypothesis:</strong> an overridden startup command selected the wrong file. <strong>Test:</strong> compare Config.Cmd with the Dockerfile's default. A restart alone would reuse the same bad command; it would not fix the cause.</p>
      <div class="table-wrap"><table><thead><tr><th>Different symptom</th><th>Diagnosis → safe fix → prevention</th></tr></thead><tbody>
      <tr><td>Running, but unreachable</td><td>Inspect <code>docker port</code>, server logs and browser URL → correct the proven mapping/interface issue by recreating the lab container → separate process status from reachable HTTP behavior.</td></tr>
      <tr><td>Permission denied</td><td>Identify the failing path, effective user and ownership before changing permissions → grant only required access → never use privileged mode or world-writable files as a blanket fix.</td></tr>
      <tr><td>Possible OOM</td><td>Correlate OOMKilled state with engine/host memory evidence → reduce workload or adjust measured limits → budget resources rather than restarting endlessly.</td></tr>
      <tr><td>No logs</td><td>Read inspect state and startup configuration → correct the verified startup failure or logging destination → arrange stdout/stderr logging. Empty logs do not prove health.</td></tr>
      </tbody></table></div>
      <h2 id="recover">5. Recover and prove behavior</h2>
      <div class="callout warning"><strong>Deletes the failed lab container's writable layer.</strong> Confirm it belongs to this exercise. Preserve useful evidence first. No persistent data exists in this lab; real stateful services need a separate recovery plan.</div>
      <pre><code>docker rm ninja-broken
docker run --name ninja-recovered -d -p 127.0.0.1:8080:80 ninja-page:checkpoint-01
docker ps
docker port ninja-recovered
docker logs ninja-recovered</code></pre>
      <p>The replacement uses the image's default CMD. No rebuild is necessary: the image was not the fault. If 8080 is occupied, inspect first and use an unused host port; do not stop an unknown service.</p>
      <p>Visit <a href="http://localhost:8080">localhost:8080</a>. Expected: the checkpoint heading and page text, plus a running container and loopback port mapping. Only declare recovery after HTTP verification, not after seeing a container ID.</p>
      <h2 id="practice">6. Mission and independent challenge</h2>
      <p><strong>Guided:</strong> write a four-line incident note: observed symptom, read-only evidence, root cause, verification. Record which outputs you actually observed instead of copying expected text.</p>
      <p><strong>Independent:</strong> explain what would happen if you ran NGINX's successful config test as the container's main command. Would a zero exit code imply a running server? Design a second disposable test with a new container name, inspect it, and remove only your test container. Hint: a successful one-off process can exit normally without serving requests.</p>
      <details><summary>Optional AI diagnosis exercise</summary><p>Supply the sample command and a manually redacted error line. Ask for read-only diagnostics first and one hypothesis. Compare its recommendation with Config.Cmd and the official CLI documentation. Reject deletion, pruning, privilege escalation, disabling security controls, or unverified production access. The manual investigation above requires no AI.</p></details>
      <h2 id="cleanup">7. Cleanup and prevention</h2>
      <div class="callout warning">Stopping interrupts the lab server; removal deletes its writable layer. Confirm the target name before executing.</div>
      <pre><code>docker stop ninja-recovered
docker rm ninja-recovered
docker ps -a</code></pre>
      <p>Confirm your lab containers are absent. Retain the checkpoint image if useful; do not prune shared data. Prevention: review startup overrides, verify the local context, record expected process behavior, and test HTTP after every release.</p>
      <h2 id="checkpoint">8. Checkpoint and next review gate</h2>
      <p>Why can a detached run return before failure? Why is restart not a fix for a wrong command? What evidence distinguishes a successful one-off job from a healthy web service?</p>
      <p>Primary references: <a href="https://docs.docker.com/reference/cli/docker/container/ls/">container listing</a>, <a href="https://docs.docker.com/reference/cli/docker/container/logs/">logs</a>, <a href="https://docs.docker.com/reference/cli/docker/inspect/">inspect</a>, <a href="https://nginx.org/en/docs/switches.html">NGINX command-line options</a>.</p>
      <div class="callout"><strong>Foundations checkpoint, not course completion.</strong> Use the command reference for recall, then continue to <a href="#nextjs-postgres">Next.js + PostgreSQL</a> and <a href="#compose-stack">Compose</a>. Choose one of the equal Prisma/Drizzle tracks, then finish recovery, secure delivery and the Docker capstone.</div>`
  }
];
