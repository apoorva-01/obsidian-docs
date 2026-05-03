import fs from 'fs';
import path from 'path';

export function detectProject(cwd) {
  const has = (file) => fs.existsSync(path.join(cwd, file));
  const read = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(cwd, file), 'utf8')); }
    catch { return null; }
  };

  const result = {
    name: path.basename(cwd),
    language: 'Unknown',
    framework: null,
    database: null,
    packageManager: null,
    structure: []
  };

  if (has('package.json')) result.language = 'JavaScript/TypeScript';
  else if (has('requirements.txt') || has('pyproject.toml')) result.language = 'Python';
  else if (has('go.mod')) result.language = 'Go';
  else if (has('Cargo.toml')) result.language = 'Rust';
  else if (has('pom.xml') || has('build.gradle') || has('build.gradle.kts')) result.language = 'Java';
  else if (has('Gemfile')) result.language = 'Ruby';
  else if (has('composer.json')) result.language = 'PHP';

  const pkg = read('package.json');
  if (pkg?.dependencies || pkg?.devDependencies) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) result.framework = 'Next.js';
    else if (deps['@remix-run/react']) result.framework = 'Remix';
    else if (deps['react']) result.framework = 'React';
    else if (deps['vue']) result.framework = 'Vue';
    else if (deps['svelte']) result.framework = 'Svelte';
    else if (deps['express']) result.framework = 'Express';
    else if (deps['fastify']) result.framework = 'Fastify';
    else if (deps['@nestjs/core']) result.framework = 'NestJS';
    else if (deps['hono']) result.framework = 'Hono';

    if (deps['pg'] || deps['postgres']) result.database = 'PostgreSQL';
    else if (deps['mysql2'] || deps['mysql']) result.database = 'MySQL';
    else if (deps['mongoose'] || deps['mongodb']) result.database = 'MongoDB';
    else if (deps['redis'] || deps['ioredis']) result.database = 'Redis';
    else if (deps['@prisma/client']) result.database = 'Prisma ORM';
    else if (deps['drizzle-orm']) result.database = 'Drizzle ORM';
    else if (deps['better-sqlite3'] || deps['sqlite3']) result.database = 'SQLite';
  }

  if (has('manage.py')) result.framework = 'Django';
  if (has('app.py') && (has('requirements.txt') || has('pyproject.toml'))) {
    result.framework = result.framework || 'Flask';
  }

  if (has('pnpm-lock.yaml')) result.packageManager = 'pnpm';
  else if (has('yarn.lock')) result.packageManager = 'yarn';
  else if (has('package-lock.json')) result.packageManager = 'npm';
  else if (has('bun.lockb') || has('bun.lock')) result.packageManager = 'bun';

  const ignore = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.cache', 'target', 'venv', '.venv', '__pycache__']);
  try {
    result.structure = fs.readdirSync(cwd)
      .filter(f => !ignore.has(f) && !f.startsWith('.'))
      .filter(f => {
        try { return fs.statSync(path.join(cwd, f)).isDirectory(); }
        catch { return false; }
      })
      .slice(0, 8);
  } catch {
    result.structure = [];
  }

  return result;
}
