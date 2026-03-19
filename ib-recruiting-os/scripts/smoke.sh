#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

cleanup() {
  if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

npm run dev > /tmp/ib_smoke_dev.log 2>&1 &
DEV_PID=$!

for _ in {1..40}; do
  if curl -sSf "$BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

assert_code() {
  local name="$1"
  local expected="$2"
  shift 2
  local code
  code=$(curl -s -o /tmp/ib_smoke_resp.out -w "%{http_code}" "$@")
  if [[ "$code" != "$expected" ]]; then
    echo "❌ $name expected $expected got $code"
    echo "Response:"
    cat /tmp/ib_smoke_resp.out
    exit 1
  fi
  echo "✅ $name ($code)"
}

assert_code "GET /" "200" "$BASE_URL/"
assert_code "GET /app" "200" "$BASE_URL/app"
assert_code "GET /app?ui=a" "200" "$BASE_URL/app?ui=a"
assert_code "GET /app?ui=b" "200" "$BASE_URL/app?ui=b"
assert_code "GET /app?ui=c" "200" "$BASE_URL/app?ui=c"
assert_code "POST /api/beta-auth" "200" -H "content-type: application/json" -d '{"code":"test"}' "$BASE_URL/api/beta-auth"
assert_code "POST /api/parse-resume invalid type" "400" -F 'file=@/etc/hosts;type=text/plain' "$BASE_URL/api/parse-resume"
assert_code "POST /api/chat" "200" -H "content-type: application/json" -d '{"messages":[],"resumeText":"test","mode":"rewrite","candidateProfile":{},"isFirstMessage":true}' "$BASE_URL/api/chat"
assert_code "POST /api/suggest question phase" "200" -H "content-type: application/json" -d '{"bullet":"Built model","roleTitle":"Intern","company":"Firm","section":"Experience","candidateProfile":{},"resumeText":"x","phase":"question"}' "$BASE_URL/api/suggest"

echo "\nSmoke checks passed."