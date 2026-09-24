#!/usr/bin/env bash
# Upload regenerated content (with .html link suffixes stripped) to Document
# Authoring, then preview + publish on main. Credentials are injected — no auth
# header. Requests are spaced out to avoid DA throttling; not retried.
set -u

ORG=pavansumanth19
REPO=pavan-eds
CONTENT_DIR=content
WORK=tools/importer/.dawork
LIST=tools/importer/.publish-list.txt
GAP=5
mkdir -p "$WORK"

mapfile -t paths < "$LIST"
echo "Total pages: ${#paths[@]}"

echo "=== Pass 1: upload to DA source ==="
declare -A uploaded
for path in "${paths[@]}"; do
  [ -z "$path" ] && continue
  src="$CONTENT_DIR${path}.plain.html"
  if [ ! -f "$src" ]; then echo "MISSING  $src"; continue; fi
  wrapped="$WORK/page.html"
  { echo '<body><header></header><main>'; cat "$src"; echo '</main><footer></footer></body>'; } > "$wrapped"
  code=$(curl -s -o "$WORK/resp.txt" -w '%{http_code}' -X POST -F "data=@${wrapped};type=text/html" "https://admin.da.live/source/${ORG}/${REPO}${path}.html")
  echo "upload $code  $path"
  [ "$code" -ge 200 ] && [ "$code" -lt 300 ] && uploaded[$path]=1
  sleep "$GAP"
done

echo "=== Pass 2: preview + publish ==="
ok=0; fail=0
for path in "${paths[@]}"; do
  [ -z "$path" ] && continue
  [ -n "${uploaded[$path]:-}" ] || { echo "SKIP (upload failed) $path"; fail=$((fail+1)); continue; }
  pv=$(curl -s -o "$WORK/resp.txt" -w '%{http_code}' -X POST "https://admin.hlx.page/preview/${ORG}/${REPO}/main${path}")
  sleep 2
  lv=$(curl -s -o "$WORK/resp.txt" -w '%{http_code}' -X POST "https://admin.hlx.page/live/${ORG}/${REPO}/main${path}")
  if [ "$pv" -ge 200 ] && [ "$pv" -lt 300 ] && [ "$lv" -ge 200 ] && [ "$lv" -lt 300 ]; then
    echo "OK    $path  (pv=$pv lv=$lv)"; ok=$((ok+1))
  else
    echo "FAIL  $path  (pv=$pv lv=$lv)"; fail=$((fail+1))
  fi
  sleep 2
done

echo "---"
echo "Done: $ok published, $fail failed"
