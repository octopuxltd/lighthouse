#!/usr/bin/env bash
set -euo pipefail

REPO="octopuxltd/lighthouse"
DEFAULT_ACCOUNT_ID="1b4c2e262789e38cf337b9c098ea5fb1"

# Make sure the GitHub CLI is signed in before we try to store anything.
gh auth status >/dev/null || { echo "Not signed in. Run: gh auth login"; exit 1; }

# Ask for the API token. -s hides it as you type/paste; echo adds a newline after.
read -rsp "Cloudflare API token: " CF_API_TOKEN
echo

# Ask for the account ID, offering the known one as the default (just press Enter).
read -rp "Cloudflare account ID [${DEFAULT_ACCOUNT_ID}]: " CF_ACCOUNT_ID
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-$DEFAULT_ACCOUNT_ID}"

# Store both as GitHub Actions secrets. Piping via stdin keeps the token out of
# the process list, so it never shows up as a command-line argument.
printf '%s' "$CF_API_TOKEN"  | gh secret set CLOUDFLARE_API_TOKEN  --repo "$REPO"
printf '%s' "$CF_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO"

echo
echo "Done. Secrets now on $REPO:"
gh secret list --repo "$REPO"
