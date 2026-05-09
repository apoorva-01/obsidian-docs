// Self-contained smoke + unit tests using node:test (built-in, zero deps).
// Run: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin/obsidian-docs');

// ── helpers ──────────────────────────────────────────────────────

function makeProject(extras = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'obsidian-docs-test-'));
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'fixture',
    dependencies: { express: '^4', pg: '^8' }
  }));
  if (extras.claudeMd) writeFileSync(path.join(dir, 'CLAUDE.md'), extras.claudeMd);
  if (extras.preExistingNote) {
    mkdirSync(path.join(dir, 'docs/modules'), { recursive: true });
    writeFileSync(path.join(dir, 'docs/modules/Existing.md'), extras.preExistingNote);
  }
  return dir;
}

function run(cwd, args, opts = {}) {
  const res = spawnSync(BIN, args, {
    cwd,
    encoding: 'utf8',
    input: opts.input ?? '',
    env: { ...process.env, ...opts.env }
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

function read(file) { return readFileSync(file, 'utf8'); }

// ── lib unit tests ──────────────────────────────────────────────

test('detect: identifies Express + PostgreSQL from package.json', async () => {
  const { detectProject } = await import('../lib/detect.js');
  const dir = makeProject();
  try {
    const p = detectProject(dir);
    assert.equal(p.language, 'JavaScript/TypeScript');
    assert.equal(p.framework, 'Express');
    assert.equal(p.database, 'PostgreSQL');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('detect: identifies Python from requirements.txt', async () => {
  const { detectProject } = await import('../lib/detect.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-py-'));
  try {
    writeFileSync(path.join(dir, 'requirements.txt'), 'flask\n');
    writeFileSync(path.join(dir, 'app.py'), '');
    const p = detectProject(dir);
    assert.equal(p.language, 'Python');
    assert.equal(p.framework, 'Flask');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('claude-md: appendObsidianSection creates new file', async () => {
  const { appendObsidianSection, hasObsidianSection } = await import('../lib/claude-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-cmd-'));
  try {
    appendObsidianSection(dir, '## Section\nbody');
    assert.equal(hasObsidianSection(dir), true);
    const content = read(path.join(dir, 'CLAUDE.md'));
    assert.match(content, /<!-- obsidian-docs:start -->/);
    assert.match(content, /<!-- obsidian-docs:end -->/);
    assert.match(content, /## Section\nbody/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('claude-md: append preserves existing content', async () => {
  const { appendObsidianSection } = await import('../lib/claude-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-cmd-'));
  try {
    writeFileSync(path.join(dir, 'CLAUDE.md'), '# My Project\n\nOriginal content.\n');
    appendObsidianSection(dir, 'OBSIDIAN');
    const content = read(path.join(dir, 'CLAUDE.md'));
    assert.match(content, /# My Project/);
    assert.match(content, /Original content\./);
    assert.match(content, /OBSIDIAN/);
    assert.ok(content.indexOf('Original content') < content.indexOf('OBSIDIAN'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('claude-md: re-appending replaces section, not duplicates', async () => {
  const { appendObsidianSection } = await import('../lib/claude-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-cmd-'));
  try {
    appendObsidianSection(dir, 'first');
    appendObsidianSection(dir, 'second');
    const content = read(path.join(dir, 'CLAUDE.md'));
    assert.equal((content.match(/<!-- obsidian-docs:start -->/g) || []).length, 1);
    assert.match(content, /second/);
    assert.doesNotMatch(content, /first/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ── agents-md tests ─────────────────────────────────────────────

test('agents-md: appendObsidianSection creates new file', async () => {
  const { appendObsidianSection, hasObsidianSection } = await import('../lib/agents-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-agents-'));
  try {
    appendObsidianSection(dir, '## Section\nbody');
    assert.equal(hasObsidianSection(dir), true);
    const content = read(path.join(dir, 'AGENTS.md'));
    assert.match(content, /<!-- obsidian-docs:start -->/);
    assert.match(content, /<!-- obsidian-docs:end -->/);
    assert.match(content, /## Section\nbody/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('agents-md: append preserves existing content', async () => {
  const { appendObsidianSection } = await import('../lib/agents-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-agents-'));
  try {
    writeFileSync(path.join(dir, 'AGENTS.md'), '# My Project\n\nOriginal content.\n');
    appendObsidianSection(dir, 'OBSIDIAN');
    const content = read(path.join(dir, 'AGENTS.md'));
    assert.match(content, /# My Project/);
    assert.match(content, /Original content\./);
    assert.match(content, /OBSIDIAN/);
    assert.ok(content.indexOf('Original content') < content.indexOf('OBSIDIAN'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('agents-md: re-appending replaces section, not duplicates', async () => {
  const { appendObsidianSection } = await import('../lib/agents-md.js');
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-agents-'));
  try {
    appendObsidianSection(dir, 'first');
    appendObsidianSection(dir, 'second');
    const content = read(path.join(dir, 'AGENTS.md'));
    assert.equal((content.match(/<!-- obsidian-docs:start -->/g) || []).length, 1);
    assert.match(content, /second/);
    assert.doesNotMatch(content, /first/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ── CLI integration tests ───────────────────────────────────────

test('install: creates full vault structure', () => {
  const dir = makeProject();
  try {
    const { status } = run(dir, ['install', '--no-git'], { input: '\n' });
    assert.equal(status, 0);
    for (const p of [
      'CLAUDE.md',
      'AGENTS.md',
      '.claude/skills/obsidian-docs/SKILL.md',
      'docs/_INDEX.md',
      'docs/modules',
      'docs/decisions',
      'docs/runbooks',
      'docs/architecture',
      'docs/.obsidian/app.json'
    ]) {
      assert.ok(existsSync(path.join(dir, p)), `expected ${p} to exist`);
    }
    assert.match(read(path.join(dir, 'CLAUDE.md')), /Express/);
    assert.match(read(path.join(dir, 'AGENTS.md')), /Express/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('install: appends to existing CLAUDE.md without clobbering', () => {
  const dir = makeProject({ claudeMd: '# Mine\n\nKeep me.\n' });
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const c = read(path.join(dir, 'CLAUDE.md'));
    assert.match(c, /# Mine/);
    assert.match(c, /Keep me\./);
    assert.match(c, /obsidian-docs:start/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('install: re-running does not overwrite existing vault notes', () => {
  const dir = makeProject({ preExistingNote: '# Existing\n\nOriginal note body.\n' });
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const note = read(path.join(dir, 'docs/modules/Existing.md'));
    assert.match(note, /Original note body/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('status: reports all green after install', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const { stdout, status } = run(dir, ['status']);
    assert.equal(status, 0);
    assert.match(stdout, /Everything looks good/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall --keep-vault: removes skill + section, keeps docs/', () => {
  const dir = makeProject({ claudeMd: '# Mine\n\nKeep me.\n' });
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['uninstall', '--yes', '--keep-vault']);
    assert.ok(!existsSync(path.join(dir, '.claude/skills/obsidian-docs')));
    assert.ok(existsSync(path.join(dir, 'docs/_INDEX.md')));
    const c = read(path.join(dir, 'CLAUDE.md'));
    assert.match(c, /# Mine/);
    assert.doesNotMatch(c, /obsidian-docs:start/);
    // AGENTS.md section should also be removed (file may be deleted if empty)
    if (existsSync(path.join(dir, 'AGENTS.md'))) {
      assert.doesNotMatch(read(path.join(dir, 'AGENTS.md')), /obsidian-docs:start/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall: full removal works', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['uninstall', '--yes']);
    assert.ok(!existsSync(path.join(dir, 'docs')));
    assert.ok(!existsSync(path.join(dir, '.claude/skills/obsidian-docs')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall: non-interactive without --yes is refused', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const { status } = run(dir, ['uninstall']);
    assert.notEqual(status, 0);
    assert.ok(existsSync(path.join(dir, 'docs')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook install: writes settings.json + script', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const { status } = run(dir, ['hook', 'install']);
    assert.equal(status, 0);
    const s = JSON.parse(read(path.join(dir, '.claude/settings.json')));
    assert.equal(s.hooks.PostToolUse[0].matcher, 'Write|Edit|MultiEdit');
    assert.match(s.hooks.PostToolUse[0].hooks[0].command, /obsidian-docs-nudge\.sh/);
    assert.ok(existsSync(path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook install: idempotent (no duplicate entries)', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    run(dir, ['hook', 'install']);
    const s = JSON.parse(read(path.join(dir, '.claude/settings.json')));
    assert.equal(s.hooks.PostToolUse[0].hooks.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook script: emits reminder for real source file', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    const out = execFileSync('bash', [path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')], {
      input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/auth/index.ts' }}),
      encoding: 'utf8'
    });
    const json = JSON.parse(out);
    assert.match(json.hookSpecificOutput.additionalContext, /src\/auth\/index\.ts/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook script: skips edits inside docs/', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    const out = execFileSync('bash', [path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')], {
      input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'docs/modules/Foo.md' }}),
      encoding: 'utf8'
    });
    assert.equal(out.trim(), '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook script: skips test files and config files', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    for (const f of ['src/foo.test.ts', 'package.json', '.env', 'tsconfig.json']) {
      const out = execFileSync('bash', [path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')], {
        input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: f }}),
        encoding: 'utf8'
      });
      assert.equal(out.trim(), '', `expected silence for ${f}`);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('hook uninstall: removes settings entry + script', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    run(dir, ['hook', 'uninstall']);
    assert.ok(!existsSync(path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')));
    assert.ok(!existsSync(path.join(dir, '.claude/settings.json')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('backfill: dry-run prints prompt without spawning claude', () => {
  const dir = makeProject();
  try {
    mkdirSync(path.join(dir, 'src'));
    run(dir, ['install', '--no-git'], { input: '\n' });
    const { stdout, status } = run(dir, ['backfill', '--dry-run']);
    assert.equal(status, 0);
    assert.match(stdout, /Backfill the Obsidian docs vault/);
    assert.match(stdout, /Scope: `src`/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('backfill: refuses if not installed', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-bf-'));
  try {
    const { stdout, status } = run(dir, ['backfill', '--dry-run']);
    assert.notEqual(status, 0);
    assert.match(stdout, /No SKILL\.md found/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ── Vault rename / relocate tests ───────────────────────────────

test('install: writes .obsidian-docs.json + vault marker', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const cfg = JSON.parse(read(path.join(dir, '.obsidian-docs.json')));
    assert.equal(cfg.vaultPath, 'docs');
    assert.ok(existsSync(path.join(dir, 'docs/.obsidian-docs-vault')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('install --vault-path: uses a custom vault folder name', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git', '--vault-path', 'wiki'], { input: '\n' });
    assert.ok(existsSync(path.join(dir, 'wiki/_INDEX.md')));
    assert.ok(existsSync(path.join(dir, 'wiki/.obsidian-docs-vault')));
    assert.equal(JSON.parse(read(path.join(dir, '.obsidian-docs.json'))).vaultPath, 'wiki');
    // CLAUDE.md references the new path, not docs/
    assert.match(read(path.join(dir, 'CLAUDE.md')), /wiki\/modules/);
    assert.doesNotMatch(read(path.join(dir, 'CLAUDE.md')), /docs\/modules/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rename survival: status auto-detects renamed vault', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    // Simulate Obsidian renaming the vault folder
    fs.renameSync(path.join(dir, 'docs'), path.join(dir, 'SyncForm'));
    const { stdout, status } = run(dir, ['status']);
    assert.equal(status, 0);
    assert.match(stdout, /relocated|SyncForm/);
    assert.match(stdout, /Everything looks good/);
    // Config was updated
    assert.equal(JSON.parse(read(path.join(dir, '.obsidian-docs.json'))).vaultPath, 'SyncForm');
    // CLAUDE.md was updated to reference SyncForm/
    assert.match(read(path.join(dir, 'CLAUDE.md')), /SyncForm\/modules/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rename survival: backfill --dry-run targets the new vault path', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    fs.renameSync(path.join(dir, 'docs'), path.join(dir, 'notes'));
    mkdirSync(path.join(dir, 'src'));
    const { stdout, status } = run(dir, ['backfill', '--dry-run']);
    assert.equal(status, 0);
    assert.match(stdout, /notes\//);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rename survival: hook script reads vault path from config', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    run(dir, ['hook', 'install']);
    fs.renameSync(path.join(dir, 'docs'), path.join(dir, 'wiki'));
    // Update config so the hook picks up the new path (simulates running `status` first)
    run(dir, ['status']);
    // Edit inside the renamed vault → should be skipped (no output)
    const out1 = execFileSync('bash', [path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')], {
      input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'wiki/modules/Foo.md' }}),
      encoding: 'utf8',
      cwd: dir
    });
    assert.equal(out1.trim(), '');
    // Edit in src/ → reminder should reference the new vault path
    const out2 = execFileSync('bash', [path.join(dir, '.claude/hooks/obsidian-docs-nudge.sh')], {
      input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: 'src/foo.ts' }}),
      encoding: 'utf8',
      cwd: dir
    });
    const json = JSON.parse(out2);
    assert.match(json.hookSpecificOutput.additionalContext, /wiki\/modules/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('legacy install: status detects + heals a renamed pre-1.2.0 vault', () => {
  // Simulate: user installed obsidian-docs v1.1.0 (no marker, no config),
  // populated the vault, renamed docs/ → MyWiki/ in Obsidian, then upgraded.
  const dir = makeProject();
  try {
    // Build a "legacy" vault at MyWiki/ — the canonical _INDEX.md preamble
    // + modules/ subfolder, but NO marker file and NO config.
    mkdirSync(path.join(dir, 'MyWiki/modules'), { recursive: true });
    writeFileSync(
      path.join(dir, 'MyWiki/_INDEX.md'),
      '# Project Docs Index\n\n_Maintained by Claude Code via obsidian-docs skill._\n\n## Modules\n- [[Foo]]\n'
    );
    writeFileSync(path.join(dir, 'MyWiki/modules/Foo.md'), '# Foo\n\nA module.\n');
    // Give it a CLAUDE.md with the section pointing at the OLD docs/ path
    writeFileSync(
      path.join(dir, 'CLAUDE.md'),
      '# Project\n\n<!-- obsidian-docs:start -->\n## Documentation Policy\n\nVault location: `/docs`\n- `docs/modules/`\n<!-- obsidian-docs:end -->\n'
    );
    // Skill must exist for status to be happy
    mkdirSync(path.join(dir, '.claude/skills/obsidian-docs'), { recursive: true });
    writeFileSync(path.join(dir, '.claude/skills/obsidian-docs/SKILL.md'), '# Skill');

    const { stdout, status } = run(dir, ['status']);
    assert.equal(status, 0);
    // Auto-detected MyWiki via _INDEX.md content
    assert.match(stdout, /MyWiki/);
    // Wrote the marker
    assert.ok(existsSync(path.join(dir, 'MyWiki/.obsidian-docs-vault')));
    // Wrote the config
    assert.equal(JSON.parse(read(path.join(dir, '.obsidian-docs.json'))).vaultPath, 'MyWiki');
    // Healed CLAUDE.md to reference MyWiki/
    assert.match(read(path.join(dir, 'CLAUDE.md')), /MyWiki\/modules/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('relocate: explicit move from docs/ to wiki/', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const { status } = run(dir, ['relocate', 'wiki']);
    assert.equal(status, 0);
    assert.ok(!existsSync(path.join(dir, 'docs')));
    assert.ok(existsSync(path.join(dir, 'wiki/_INDEX.md')));
    assert.equal(JSON.parse(read(path.join(dir, '.obsidian-docs.json'))).vaultPath, 'wiki');
    assert.match(read(path.join(dir, 'CLAUDE.md')), /wiki\/modules/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('uninstall: cleans up .obsidian-docs.json + renamed vault', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    fs.renameSync(path.join(dir, 'docs'), path.join(dir, 'SyncForm'));
    run(dir, ['uninstall', '--yes']);
    assert.ok(!existsSync(path.join(dir, 'SyncForm')));
    assert.ok(!existsSync(path.join(dir, '.obsidian-docs.json')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('demo: scaffolds a fake project + populated vault', () => {
  const dir = path.join(mkdtempSync(path.join(tmpdir(), 'odt-demo-')), 'demo');
  try {
    const { stdout, status } = run(process.cwd(), ['demo', '--dir', dir]);
    assert.equal(status, 0);
    assert.match(stdout, /Demo ready/);
    // Fake project files
    assert.ok(existsSync(path.join(dir, 'package.json')));
    assert.ok(existsSync(path.join(dir, 'src/auth/service.ts')));
    // Installed
    assert.ok(existsSync(path.join(dir, 'CLAUDE.md')));
    assert.ok(existsSync(path.join(dir, '.claude/skills/obsidian-docs/SKILL.md')));
    // Populated vault
    assert.ok(existsSync(path.join(dir, 'docs/modules/AuthService.md')));
    assert.ok(existsSync(path.join(dir, 'docs/modules/OrderService.md')));
    assert.ok(existsSync(path.join(dir, 'docs/modules/PaymentService.md')));
    assert.ok(existsSync(path.join(dir, 'docs/modules/UserRepository.md')));
    assert.ok(existsSync(path.join(dir, 'docs/decisions/ADR-001-jwt-over-sessions.md')));
    assert.ok(existsSync(path.join(dir, 'docs/decisions/ADR-002-synchronous-payment.md')));
    assert.ok(existsSync(path.join(dir, 'docs/runbooks/Deploy.md')));
    // Index references everything
    const idx = read(path.join(dir, 'docs/_INDEX.md'));
    assert.match(idx, /\[\[AuthService\]\]/);
    assert.match(idx, /\[\[ADR-001/);
    assert.match(idx, /\[\[Deploy\]\]/);
  } finally { rmSync(path.dirname(dir), { recursive: true, force: true }); }
});

test('demo: refuses to overwrite non-empty dir without --force', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'odt-demo-'));
  writeFileSync(path.join(dir, 'sentinel'), 'x');
  try {
    const { stdout, status } = run(process.cwd(), ['demo', '--dir', dir]);
    assert.notEqual(status, 0);
    assert.match(stdout, /already exists/);
    assert.ok(existsSync(path.join(dir, 'sentinel')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('update: refreshes SKILL.md', () => {
  const dir = makeProject();
  try {
    run(dir, ['install', '--no-git'], { input: '\n' });
    const before = read(path.join(dir, '.claude/skills/obsidian-docs/SKILL.md'));
    writeFileSync(path.join(dir, '.claude/skills/obsidian-docs/SKILL.md'), 'CORRUPTED');
    run(dir, ['update']);
    const after = read(path.join(dir, '.claude/skills/obsidian-docs/SKILL.md'));
    assert.equal(after, before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
