// Vault location is resilient to folder rename (e.g. when a user renames the
// Obsidian vault and Obsidian renames the folder on disk).
//
// Two markers:
//   1. `.obsidian-docs.json` at REPO ROOT — stores the current vaultPath.
//   2. `.obsidian-docs-vault` at VAULT ROOT — survives folder rename and lets
//      us re-find the vault by scanning top-level dirs.

import fs from 'fs';
import path from 'path';

export const CONFIG_FILE = '.obsidian-docs.json';
export const VAULT_MARKER = '.obsidian-docs-vault';
export const DEFAULT_VAULT_PATH = 'docs';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  'target', 'venv', '.venv', '__pycache__', '.claude', '.obsidian-docs'
]);

export function readConfig(cwd) {
  const p = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

export function writeConfig(cwd, data) {
  const p = path.join(cwd, CONFIG_FILE);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

export function writeVaultMarker(vaultDir) {
  fs.writeFileSync(
    path.join(vaultDir, VAULT_MARKER),
    'This file marks the directory as an obsidian-docs vault.\n' +
    'Do not delete — the CLI uses it to find the vault if you rename the folder.\n'
  );
}

const LEGACY_INDEX_MARKER = 'Maintained by Claude Code via obsidian-docs skill';

function isVaultDir(p) {
  // Primary: dedicated marker file (post-1.2.0 installs)
  if (fs.existsSync(path.join(p, VAULT_MARKER))) return true;
  // Fallback: legacy installs lacked the marker — recognize a vault by
  // its _INDEX.md preamble + the canonical modules/ subfolder.
  const indexPath = path.join(p, '_INDEX.md');
  if (!fs.existsSync(indexPath)) return false;
  if (!fs.existsSync(path.join(p, 'modules'))) return false;
  try {
    const head = fs.readFileSync(indexPath, 'utf8').slice(0, 500);
    return head.includes(LEGACY_INDEX_MARKER);
  } catch {
    return false;
  }
}

export function scanForVault(cwd) {
  let entries;
  try { entries = fs.readdirSync(cwd, { withFileTypes: true }); }
  catch { return null; }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (IGNORE_DIRS.has(e.name)) continue;
    if (e.name.startsWith('.')) continue;
    const full = path.join(cwd, e.name);
    if (isVaultDir(full)) return e.name;
  }
  return null;
}

/**
 * If we recognized a legacy vault (no marker file) at `vaultDir`, drop the
 * marker into it so future scans are O(1).
 */
export function ensureMarker(vaultDir) {
  const markerPath = path.join(vaultDir, VAULT_MARKER);
  if (!fs.existsSync(markerPath)) {
    writeVaultMarker(vaultDir);
    return true;
  }
  return false;
}

/**
 * Find the vault for `cwd`.
 * @returns {{ vaultPath: string|null, relocated: { from: string, to: string }|null, source: 'config'|'scan'|'default'|'none' }}
 */
export function findVault(cwd) {
  const config = readConfig(cwd);
  const configured = config?.vaultPath;

  // 1. Honor the configured path if the marker is still there
  if (configured && isVaultDir(path.join(cwd, configured))) {
    return { vaultPath: configured, relocated: null, source: 'config' };
  }

  // 2. The configured path moved — scan for the marker
  const scanned = scanForVault(cwd);
  if (scanned) {
    if (configured && scanned !== configured) {
      return { vaultPath: scanned, relocated: { from: configured, to: scanned }, source: 'scan' };
    }
    return { vaultPath: scanned, relocated: null, source: 'scan' };
  }

  // 3. Fall back to default folder name even if no marker (legacy installs)
  if (fs.existsSync(path.join(cwd, DEFAULT_VAULT_PATH, '_INDEX.md'))) {
    return { vaultPath: DEFAULT_VAULT_PATH, relocated: null, source: 'default' };
  }

  return { vaultPath: null, relocated: null, source: 'none' };
}

/**
 * Resolve, then auto-heal: persist the new path to config + return the resolution.
 * Callers can use the `relocated` field to print a friendly message and update
 * downstream references (CLAUDE.md, hook, etc.).
 */
export function resolveVault(cwd) {
  const result = findVault(cwd);
  if (result.vaultPath && result.relocated) {
    const config = readConfig(cwd) || {};
    writeConfig(cwd, { ...config, vaultPath: result.vaultPath });
  }
  // Even when not relocated, ensure config exists for legacy installs that
  // pre-date the config file.
  if (result.vaultPath && !readConfig(cwd)) {
    writeConfig(cwd, { vaultPath: result.vaultPath });
  }
  return result;
}
