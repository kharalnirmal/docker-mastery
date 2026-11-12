const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
test('beginner, glossary and operational handoffs are present and current', () => {
  const context = { window: {} };
  for (const script of ['lessons', 'foundations', 'compose', 'recovery', 'delivery', 'visual-guides']) vm.runInNewContext(read(`assets/js/${script}.js`), context);
  const lessons = context.window.LESSONS;
  const first = lessons.find(lesson => lesson.id === 'first-container').html;
  assert.match(first, /id="terminal-basics"/);
  for (const term of ['exit status', 'relative path', 'shell', 'YAML', 'ARM64']) assert.ok(first.toLowerCase().includes(term.toLowerCase()), term);
  const reference = lessons.find(lesson => lesson.id === 'command-reference').html;
  assert.match(reference, /id="glossary"/);
  for (const file of ['docs/OPERATIONS-RUNBOOK.md', 'docs/COMPLETION-CHECKLIST.md']) {
    assert.ok(reference.includes(file));
    assert.ok(lessons.find(lesson => lesson.id === 'docker-capstone').html.includes(file));
  }
  const active = lessons.map(lesson => lesson.html).join('');
  assert.doesNotMatch(active, /workspace is not a Git repository|phase is still in progress|This prototype/);
  assert.match(read('docs/OPERATIONS-RUNBOOK.md'), /dc logs --tail 100 --since 15m --timestamps/);
  assert.match(read('docs/COMPLETION-CHECKLIST.md'), /intentionally start unchecked/);
});
test('public Markdown documentation local links resolve', () => {
  const { execFileSync } = require('node:child_process');
  const { publicFile } = require('../tools/build.cjs');
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(file => file.endsWith('.md') && publicFile(file));
  assert.ok(files.includes('examples/compose/README.md'), 'lab runbooks are checked too');
  for (const file of files) {
    const markup = read(file).replace(/```[\s\S]*?```/g, '');
    for (const [, target] of markup.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      const destination = path.resolve(root, path.dirname(file), target.split('#')[0]);
      assert.ok(destination === root || destination.startsWith(root + path.sep), `${file}: link leaves repository`);
      assert.ok(fs.existsSync(destination), `${file}: ${target}`);
    }
  }
});
