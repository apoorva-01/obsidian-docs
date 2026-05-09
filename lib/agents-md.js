import fs from 'fs';
import path from 'path';

const MARKER_START = '<!-- obsidian-docs:start -->';
const MARKER_END = '<!-- obsidian-docs:end -->';

export function readAgentsMd(cwd) {
  const filePath = path.join(cwd, 'AGENTS.md');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function hasObsidianSection(cwd) {
  const content = readAgentsMd(cwd);
  if (!content) return false;
  return content.includes(MARKER_START);
}

export function appendObsidianSection(cwd, section) {
  const filePath = path.join(cwd, 'AGENTS.md');
  const block = `${MARKER_START}\n${section}\n${MARKER_END}`;

  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current.includes(MARKER_START)) {
      const replaced = current.replace(
        new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`),
        block
      );
      fs.writeFileSync(filePath, replaced);
    } else {
      const sep = current.endsWith('\n') ? '\n' : '\n\n';
      fs.writeFileSync(filePath, `${current}${sep}${block}\n`);
    }
  } else {
    fs.writeFileSync(filePath, `${block}\n`);
  }
}

export function generateObsidianSection(project, skillPath, vaultPath = 'docs') {
  const stack = [project.language, project.framework, project.database]
    .filter(Boolean)
    .join(' · ');
  const v = vaultPath;

  return `## Documentation Policy

This repo maintains a living Obsidian vault at \`/${v}\`.

**Stack detected:** ${stack || 'Unknown'}

**You must keep the vault in sync.** After any of the following, update the vault:
- Creating or significantly modifying a module or service
- Making an architectural decision (write an ADR)
- Discovering a bug, gotcha, or non-obvious behavior
- Changing how two modules interact

**Skill location:** \`${skillPath}\`
Read and follow it before writing any documentation (OpenCode: use the skill tool to load it).

**Vault location:** \`/${v}\` (canonical path stored in \`.obsidian-docs.json\` — do not hard-code)
- \`${v}/modules/\` — one note per module/service
- \`${v}/decisions/\` — Architecture Decision Records
- \`${v}/runbooks/\` — operational procedures
- \`${v}/architecture/\` — system overviews
- \`${v}/_INDEX.md\` — master index, always update this`;
}