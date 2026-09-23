#!/usr/bin/env bash
# Upload the re-imported magazine + adventure pages to Document Authoring, then
# preview + publish them. Credentials are injected automatically — no auth header.
# DA throttles bursts, so requests are spaced out and NOT retried (retries only
# add to the request rate and make throttling worse).
set -u

ORG=pavansumanth19
REPO=pavan-eds
CONTENT_DIR=content
WORK=/tmp/dawork
GAP=6            # seconds between requests
mkdir -p "$WORK"

# Build the list of re-imported page paths (relative, no extension).
paths=()
while IFS= read -r url; do
  [ -z "$url" ] && continue
  p=$(echo "$url" | sed -E 's#https?://[^/]+##; s#\.html?$##')
  paths+=("$p")
done < <(cat tools/importer/urls-magazine-article.txt tools/importer/urls-adventure-detail.txt)

echo "Total pages: ${#paths[@]}"

# ---- Pass 1: upload all pages to DA source ----
echo "=== Pass 1: upload ==="
declare -A uploaded
for path in "${paths[@]}"; do
  src="$CONTENT_DIR${path}.plain.html"
  if [ ! -f "$src" ]; then echo "MISSING  $src"; continue; fi
  wrapped="$WORK/page.html"
  { echo '<body><header></header><main>'; cat "$src"; echo '</main><footer></footer></body>'; } > "$wrapped"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -F "data=@${wrapped};type=text/html" "https://admin.da.live/source/${ORG}/${REPO}${path}.html")
  echo "upload $code  $path"
  [ "$code" -ge 200 ] && [ "$code" -lt 300 ] && uploaded[$path]=1
  sleep "$GAP"
done

# ---- Pass 2: preview + publish the uploaded pages ----
echo "=== Pass 2: preview + publish ==="
ok=0; fail=0
for path in "${paths[@]}"; do
  [ -n "${uploaded[$path]:-}" ] || { echo "SKIP (upload failed) $path"; fail=$((fail+1)); continue; }
  pv=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://admin.hlx.page/preview/${ORG}/${REPO}/main${path}")
  sleep 3
  lv=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://admin.hlx.page/live/${ORG}/${REPO}/main${path}")
  if [ "$pv" -ge 200 ] && [ "$pv" -lt 300 ] && [ "$lv" -ge 200 ] && [ "$lv" -lt 300 ]; then
    echo "OK    $path  (pv=$pv lv=$lv)"; ok=$((ok+1))
  else
    echo "FAIL  $path  (pv=$pv lv=$lv)"; fail=$((fail+1))
  fi
  sleep 3
done

echo "---"
echo "Done: $ok published, $fail failed"
