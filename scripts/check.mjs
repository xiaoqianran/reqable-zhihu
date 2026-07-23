import { spawnSync } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ignored = new Set(['.git', 'node_modules', 'capture-exports', 'runtime-data']);
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}

await walk(root);

for (const file of files.filter((path) => ['.js', '.mjs'].includes(extname(path)))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

for (const file of files.filter((path) => extname(path) === '.json')) {
  JSON.parse(await readFile(file, 'utf8'));
}

for (const file of files.filter((path) => extname(path) === '.md')) {
  const text = await readFile(file, 'utf8');
  const links = text.matchAll(/\[[^\]]*]\(([^)]+)\)/g);
  for (const [, rawTarget] of links) {
    const target = rawTarget.trim().replace(/^<|>$/g, '');
    if (!target || target.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(target)) continue;
    const localPath = target.split(/[?#]/, 1)[0];
    if (!localPath) continue;
    try {
      await access(resolve(dirname(file), decodeURIComponent(localPath)));
    } catch {
      throw new Error(
        `Broken local Markdown link in ${relative(root, file)}: ${rawTarget}`,
      );
    }
  }
}

for (const file of files.filter((path) => path.includes(`${join('fixtures', '')}`))) {
  const text = await readFile(file, 'utf8');
  if (/"(?:authorization|cookie|x-zse-\d+|x-udid|x-suger)"\s*:/i.test(text)) {
    throw new Error(`Sensitive header key found in fixture: ${relative(root, file)}`);
  }
}

process.stdout.write(`checked ${files.length} files\n`);
