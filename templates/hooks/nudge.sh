#!/usr/bin/env bash
# obsidian-docs PostToolUse nudge
# Reminds Claude to update the vault after Write/Edit/MultiEdit calls
# that touch real source files (not the vault itself, not config/test files).

set -e

# Read the hook payload from stdin
payload=$(cat)

# Resolve the vault path dynamically — rename-safe.
# Reads .obsidian-docs.json at repo root if present, else falls back to "docs".
vault_path=$(python3 -c '
import json, os, sys
try:
    with open(".obsidian-docs.json") as f:
        print(json.load(f).get("vaultPath", "docs"))
except Exception:
    print("docs")
' 2>/dev/null)
[ -z "$vault_path" ] && vault_path="docs"

# Extract file path
file_path=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)

[ -z "$file_path" ] && exit 0

# Skip if the edit was inside the vault itself (avoid feedback loop)
case "$file_path" in
    "$vault_path"/*|*/"$vault_path"/*) exit 0 ;;
esac

# Skip uninteresting files
case "$file_path" in
    *.md|*.json|*.yml|*.yaml|*.toml|*.lock|*.log|*.env*) exit 0 ;;
    */node_modules/*|*/.git/*|*/dist/*|*/build/*|*/.next/*) exit 0 ;;
    */test/*|*/tests/*|*/__tests__/*|*.test.*|*.spec.*) exit 0 ;;
esac

# Find the skill location for the reminder text
skill_loc=".claude/skills/obsidian-docs/SKILL.md"
[ ! -f "$skill_loc" ] && skill_loc="$HOME/.claude/skills/obsidian-docs/SKILL.md"

# Emit a reminder via PostToolUse JSON additionalContext so Claude sees it
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "obsidian-docs reminder: you just modified \`$file_path\`. If this changed a module's purpose, dependencies, public interface, or introduced a non-obvious gotcha, update the corresponding note in \`$vault_path/modules/\` (and \`$vault_path/_INDEX.md\` if new). Follow $skill_loc. Skip this if the change was purely cosmetic/refactor."
  }
}
EOF
