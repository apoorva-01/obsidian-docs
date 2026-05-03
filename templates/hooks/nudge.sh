#!/usr/bin/env bash
# obsidian-docs PostToolUse nudge
# Reminds Claude to update the /docs vault after Write/Edit/MultiEdit calls
# that touch real source files (not the vault itself, not config/test files).

set -e

# Read the hook payload from stdin
payload=$(cat)

# Extract file path (no jq dependency — use python3 which is always present on macOS)
file_path=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)

# Empty path → nothing to do
[ -z "$file_path" ] && exit 0

# Skip if the edit was inside docs/ itself (avoid feedback loop)
case "$file_path" in
    */docs/*|docs/*) exit 0 ;;
esac

# Skip uninteresting files
case "$file_path" in
    *.md|*.json|*.yml|*.yaml|*.toml|*.lock|*.log|*.env*) exit 0 ;;
    */node_modules/*|*/.git/*|*/dist/*|*/build/*|*/.next/*) exit 0 ;;
    */test/*|*/tests/*|*/__tests__/*|*.test.*|*.spec.*) exit 0 ;;
esac

# Emit a reminder via PostToolUse JSON additionalContext so Claude sees it
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "obsidian-docs reminder: you just modified \`$file_path\`. If this changed a module's purpose, dependencies, public interface, or introduced a non-obvious gotcha, update the corresponding note in docs/modules/ (and docs/_INDEX.md if new). Follow .claude/skills/obsidian-docs/SKILL.md. Skip this if the change was purely cosmetic/refactor."
  }
}
EOF
