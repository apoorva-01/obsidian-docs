import fs from 'fs';
import path from 'path';

const MARKER_START = '<!-- obsidian-docs:start -->';
const MARKER_END = '<!-- obsidian-docs:end -->';

export function readClaudeMd(cwd) {
  const filePath = path.join(cwd, 'CLAUDE.md');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

export function hasObsidianSection(cwd) {
  const content = readClaudeMd(cwd);
  if (!content) return false;
  return content.includes(MARKER_START);
}

export function appendObsidianSection(cwd, section) {
  const filePath = path.join(cwd, 'CLAUDE.md');
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

export function generateObsidianSection(project, skillPath) {
  const stack = [project.language, project.framework, project.database]
    .filter(Boolean)
    .join(' · ');

  return `## Documentation Policy

This repo maintains a living Obsidian vault at \`/docs\`.

**Stack detected:** ${stack || 'Unknown'}

**Claude must keep the vault in sync.** After any of the following, update the vault:
- Creating or significantly modifying a module or service
- Making an architectural decision (write an ADR)
- Discovering a bug, gotcha, or non-obvious behavior
- Changing how two modules interact

**Skill location:** \`${skillPath}\`
Read and follow it before writing any documentation.

**Vault location:** \`/docs\`
- \`docs/modules/\` — one note per module/service
- \`docs/decisions/\` — Architecture Decision Records
- \`docs/runbooks/\` — operational procedures
- \`docs/architecture/\` — system overviews
- \`docs/_INDEX.md\` — master index, always update this`;
}
