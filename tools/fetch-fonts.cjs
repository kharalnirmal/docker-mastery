// One-time asset acquisition, not needed to read or serve the guide.
const fs = require('node:fs/promises');
const path = require('node:path');
const dir = path.resolve(__dirname, '../assets/fonts');
async function get(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' } });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}
(async () => {
  await fs.mkdir(dir, { recursive: true });
  const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap';
  const css = await (await get(url)).text();
  const blocks = css.includes('/* latin */') ? [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(m => m[1]) : [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]);
  const local = [];
  for (const block of blocks) {
    const family = block.match(/font-family: '([^']+)'/)[1];
    const weight = block.match(/font-weight: ([^;]+)/)[1];
    const source = block.match(/url\(([^)]+)\)/)[1];
    const name = `${family.toLowerCase().replaceAll(' ', '-')}-${weight}.${source.endsWith('.woff2') ? 'woff2' : 'ttf'}`;
    await fs.writeFile(path.join(dir, name), Buffer.from(await (await get(source)).arrayBuffer()));
    local.push(block.replace(source, `../fonts/${name}`));
  }
  await fs.writeFile(path.resolve(dir, '../css/fonts.css'), '/* Google Fonts, SIL Open Font License; self-hosted Latin subset. */\n' + local.join('\n') + '\n');
  for (const [name, folder] of [['Inter', 'inter'], ['JetBrains-Mono', 'jetbrainsmono']]) {
    await fs.writeFile(path.join(dir, `${name}-OFL.txt`), await (await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${folder}/OFL.txt`)).text());
  }
  console.log(`Bundled ${blocks.length} font faces and both licenses.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
