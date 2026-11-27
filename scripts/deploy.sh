#!/usr/bin/env bash
# Deployment entry point called by .github/workflows/deploy.yml.
# No hosting provider has been chosen yet, so this FAILS on purpose instead of pretending to deploy.
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <staging|production>}"

if [[ -z "${DEPLOY_PROVIDER:-}" ]]; then
  echo "::error::DEPLOY_PROVIDER is not configured for ${ENVIRONMENT}. Choose a provider (see DEPLOYMENT.md), set the GitHub Environment variable and secrets, then implement its branch below."
  exit 1
fi

case "$DEPLOY_PROVIDER" in
  # vercel) ... ;;
  # container) ... ;;
  *)
    echo "::error::Unsupported DEPLOY_PROVIDER '${DEPLOY_PROVIDER}'. Implement it in scripts/deploy.sh."
    exit 1
    ;;
esac
