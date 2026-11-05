#!/usr/bin/env bash
# Збірка Docker-образів і push в Amazon ECR. Запускати в AWS CloudShell
# (права консольної сесії, access keys не потрібні) з кореня репозиторію:
#   bash infra/aws/build-and-push.sh [tag]
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
TAG="${1:-$(git rev-parse --short HEAD)}"

cd "$(git rev-parse --show-toplevel)"

echo "→ ECR login: ${REGISTRY}"
aws ecr get-login-password --region "${REGION}" |
  docker login --username AWS --password-stdin "${REGISTRY}"

for app in backend frontend; do
  repo="${REGISTRY}/car-calc-${app}"
  echo "→ build ${app} (${TAG})"
  # Контекст = корінь monorepo (turbo prune усередині Dockerfile).
  docker build -f "apps/${app}/Dockerfile" -t "${repo}:${TAG}" -t "${repo}:latest" .
  echo "→ push ${repo}"
  docker push "${repo}:${TAG}"
  docker push "${repo}:latest"
  # У CloudShell мало місця — чистимо образи й кеш збірки після кожного push.
  docker system prune -af >/dev/null
done

echo "✓ Готово. Образи: ${REGISTRY}/car-calc-{backend,frontend}:{${TAG},latest}"
echo "  Далі: ECS → service → Update → Force new deployment."
