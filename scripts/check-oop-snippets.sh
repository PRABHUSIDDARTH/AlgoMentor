#!/usr/bin/env bash
# Compiles every OOP lesson's code samples: javac, python -m py_compile and g++ -fsyntax-only.
# Usage: scripts/check-oop-snippets.sh   (needs Node 23.6+, JDK 21, Python 3 and g++)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
node "$ROOT/scripts/extract-oop-snippets.mjs" "$OUT" > /dev/null
fails=0
for d in "$OUT"/*/; do
  id="$(basename "$d")"
  javac -d "$d/classes" "$d"/*.java 2> "$d/java.err" || { echo "FAIL $id java"; cat "$d/java.err"; fails=$((fails + 1)); }
  python3 -m py_compile "$d/snippet.py" 2> "$d/py.err" || { echo "FAIL $id python"; cat "$d/py.err"; fails=$((fails + 1)); }
  g++ -std=c++20 -fsyntax-only -Wall "$d/snippet.cpp" 2> "$d/cpp.err" || { echo "FAIL $id c++"; cat "$d/cpp.err"; fails=$((fails + 1)); }
done
n=$(ls -d "$OUT"/*/ | wc -l)
if [ $fails -eq 0 ]; then echo "oop snippets: $n modules compile in Java, Python and C++"; else echo "oop snippets: $fails failures"; exit 1; fi
