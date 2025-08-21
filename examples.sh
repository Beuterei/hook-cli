#!/usr/bin/env bash
set -euo pipefail

npx tsx src/index.ts checkCommitMessagePattern -m "I say HelloWorld" -p "HelloWorld" || true

npx tsx src/index.ts checkForVulnerabilities || true

npx tsx src/index.ts checkPackageVersion || true

npx tsx src/index.ts updateReminder -n || true

npx tsx src/index.ts checkForFileChanged CHANGELOG.md -b main || true