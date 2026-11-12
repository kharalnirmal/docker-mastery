const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {} };
vm.runInNewContext(read('assets/js/lessons.js'), context);
vm.runInNewContext(read('assets/js/foundations.js'), context);
vm.runInNewContext(read('assets/js/compose.js'), context);
vm.runInNewContext(read('assets/js/recovery.js'), context);
vm.runInNewContext(read('assets/js/delivery.js'), context);
vm.runInNewContext(read('assets/js/visual-guides.js'), context);
const lessons = context.window.LESSONS;
test('visual guides have accessible original diagrams and text workflows', () => {
  const source = read('assets/js/visual-guides.js');
  const guides = [...source.matchAll(/lesson: '([^']+)', id: '([^']+)'/g)];
  assert.equal(guides.length, 16);
  for (const [, lesson, id] of guides) {
    const html = lessons.find(entry => entry.id === lesson).html;
    assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes('Workflow, also available as text:'));
    const svg = read(`assets/images/guides/${id}.svg`);
    assert.match(svg, /role="img" aria-labelledby="title description"/);
    assert.match(svg, /<title id="title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="description">[^<]+<\/desc>/);
    assert.match(svg, /viewBox="0 0 640 360"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|href="https?:/);
  }
});
test('twenty distinct lessons with complete navigation metadata', () => {
  assert.equal(lessons.length, 20);
  assert.equal(new Set(lessons.map(l => l.id)).size, 20);
  for (const lesson of lessons) {
    for (const field of ['title', 'description', 'keywords', 'group', 'level', 'minutes']) assert.ok(lesson[field]);
    const ids = [...lesson.html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 8);
    for (const word of ['Prerequisite', 'Expected', 'Independent', 'Optional AI', 'cleanup', 'references']) assert.ok(lesson.html.toLowerCase().includes(word.toLowerCase()), `${lesson.id}: ${word}`);
  }
});
test('local images and lesson routes resolve', () => {
  const markup = read('index.html') + lessons.map(l => l.html).join('');
  for (const [, target] of markup.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^https?:/.test(target)) continue;
    assert.ok(fs.existsSync(path.join(root, target)), target);
  }
  for (const lesson of lessons) for (const [, id, section] of lesson.html.matchAll(/href="#([^"/]+)(?:\/([^"]+))?"/g)) {
    const dest = lessons.find(l => l.id === id);
    assert.ok(dest, id);
    if (section) assert.ok(dest.html.includes(`id="${section}"`), section);
  }
});
test('displayed checkpoint files match actual runnable files', () => {
  const html = lessons.find(l => l.id === 'first-dockerfile').html;
  const unescape = text => text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  const blocks = [...html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(m => unescape(m[1]));
  for (const file of ['Dockerfile', 'index.html', '.dockerignore']) {
    assert.ok(blocks.includes(read(`examples/docker/01-static-page/${file}`).trim()), file);
  }
});
test('reference fonts are bundled with licenses and explicit face weights', () => {
  const css = read('assets/css/fonts.css');
  for (const [, file] of css.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)) assert.ok(fs.statSync(path.join(root, 'assets/fonts', file)).size > 1000, file);
  for (const file of ['Inter-OFL.txt', 'JetBrains-Mono-OFL.txt']) assert.match(read(`assets/fonts/${file}`), /SIL OPEN FONT LICENSE/);
  assert.match(css, /font-family: 'Inter'/);
  assert.match(css, /font-family: 'JetBrains Mono'/);
  assert.match(read('index.html'), /id="search-dialog"/);
});
test('Dockerfile instruction cells cannot break inside names', () => {
  assert.match(lessons.find(l => l.id === 'first-dockerfile').html, /class="instruction-table"/);
  assert.match(read('assets/css/reference-design.css'), /instruction-table td:first-child code\{[^}]*white-space:nowrap/);
});
test('onboarding social profiles use named local SVG icons and safe new tabs', () => {
  const html = read('index.html');
  const socials = html.match(/<nav class="creator-socials"[\s\S]*?<\/nav>/)[0];
  const links = [...socials.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g)];
  assert.equal(links.length, 3);
  for (const [index, name] of ['GitHub', 'LinkedIn', 'Instagram'].entries()) {
    assert.ok(links[index][1].includes(`on ${name}`));
    assert.match(links[index][1], /rel="noopener noreferrer"/);
    assert.match(links[index][2], /<svg[^>]+aria-hidden="true"/);
  }
  for (const url of ['https://github.com/kharalnirmal', 'https://www.linkedin.com/in/kharalnirmal/', 'https://www.instagram.com/nirmalkharal/']) assert.ok(socials.includes(`href="${url}"`));
});
test('onboarding portraits are optimized, named, and dimensioned', () => {
  const html = read('index.html');
  for (const name of ['naruto', 'sakura', 'sasuke']) {
    const image = html.match(new RegExp(`<img[^>]+src="assets/images/${name}\\.webp"[^>]+>`));
    assert.ok(image, name);
    assert.match(image[0], /width="440" height="440"/);
    assert.match(image[0], /alt="[^"]+"/);
    const data = fs.readFileSync(path.join(root, `assets/images/${name}.webp`));
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.ok(data.length < 35000, name);
  }
  assert.match(html, /fetchpriority="high"/);
});
test('both tracks retain equivalent UI/API and safe container boundaries', () => {
  for (const file of ['lib/api.js', 'app/style.css', 'compose.yaml', 'compose.dev.yaml', 'compose.host.yaml']) {
    assert.equal(read(`examples/compose/prisma/${file}`), read(`examples/compose/drizzle/${file}`), file);
  }
  assert.equal(read('examples/compose/prisma/app/page.js').replace('PRISMA', 'ORM'), read('examples/compose/drizzle/app/page.js').replace('DRIZZLE', 'ORM'));
  for (const track of ['prisma', 'drizzle']) {
    const base = `examples/compose/${track}/`;
    const pkg = JSON.parse(read(base + 'package.json'));
    assert.ok(fs.existsSync(path.join(root, base, 'package-lock.json')));
    assert.match(read(base + 'Dockerfile'), /USER node/);
    assert.doesNotMatch(pkg.scripts['db:migrate'], /push|reset|dev/);
    assert.match(read(base + 'compose.yaml'), /pgdata:\/var\/lib\/postgresql/);
    assert.match(read(base + 'compose.yaml'), /driver: local/);
    assert.match(read(base + 'compose.yaml'), /max-size: "10m"/);
    assert.equal((read(base + 'compose.yaml').match(/logging: \*bounded-logs/g) || []).length, 3);
    assert.match(read(base + '.dockerignore'), /\.env\*/);
  }
});
test('recovery overlays preserve baseline histories and equivalent nullable expansion', () => {
  const base = 'examples/recovery/';
  assert.match(read(base + 'prisma/prisma/schema.prisma'), /description String\?/);
  assert.match(read(base + 'drizzle/lib/schema.js'), /description: text\('description'\)/);
  for (const file of ['prisma/prisma/migrations/202611030002_description/migration.sql', 'drizzle/drizzle/0001_description.sql']) {
    assert.match(read(base + file), /ADD COLUMN "description" text/i);
    assert.doesNotMatch(read(base + file), /NOT NULL|DROP|TRUNCATE/);
  }
  const original = JSON.parse(read('examples/compose/drizzle/drizzle/meta/_journal.json'));
  const next = JSON.parse(read(base + 'drizzle/drizzle/meta/_journal.json'));
  assert.deepEqual(next.entries[0], original.entries[0]);
  assert.equal(next.entries.length, 2);
  const previous = JSON.parse(read('examples/compose/drizzle/drizzle/meta/0000_snapshot.json'));
  const snapshot = JSON.parse(read(base + 'drizzle/drizzle/meta/0001_snapshot.json'));
  assert.equal(snapshot.prevId, previous.id);
  const description = snapshot.tables['public.Task'].columns.description;
  assert.equal(description.notNull, false);
  delete snapshot.tables['public.Task'].columns.description;
  assert.deepEqual(snapshot.tables, previous.tables);
  assert.match(read('tools/check-recovery-labs.cjs'), /--single-transaction/);
});
test('no unsafe bulk cleanup or public database publication', () => {
  const text = lessons.map(l => l.html).join('');
  assert.doesNotMatch(text, /docker (?:system|volume) prune|--privileged|5432:5432/);
  assert.match(read('index.html'), /aria-controls="sidebar" aria-expanded="false"/);
});
test('Docker-only UI and complete delivery boundaries', () => {
  const text = read('index.html') + lessons.map(l => l.html).join('');
  assert.doesNotMatch(text, /kubernetes|kubectl|\bkind\b/i);
  const workflow = read('examples/delivery/docker-ci.yaml');
  for (const [, ref] of workflow.matchAll(/uses: ([^\s]+)/g)) assert.match(ref, /@[a-f0-9]{40}$/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.DOCKER/);
  assert.match(workflow, /needs: checks/);
  assert.match(workflow, /environment: container-release/);
  const secure = read('examples/delivery/compose.secure.yaml');
  for (const field of ['read_only: true', 'cap_drop: [ALL]', 'no-new-privileges:true', 'mem_limit:', 'max-size:', 'pids_limit:']) assert.ok(secure.includes(field), field);
  assert.match(read('examples/delivery/compose.release.yaml'), /build: !reset null/);
  for (const track of ['prisma', 'drizzle']) {
    const pkg = JSON.parse(read(`examples/compose/${track}/package.json`));
    assert.ok(pkg.overrides, `${track} audited esbuild remediation must be explicit`);
  }
});
test('authored text has no trailing whitespace', () => {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.next', 'generated', '.git'].includes(entry.name)) walk(file);
      else if (/\.(?:html|js|cjs|css|md|json|svg)$/.test(file)) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /[\t ]+$/m, file);
    }
  }
  walk(root);
});
