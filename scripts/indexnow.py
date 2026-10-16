"""Send the pages changed between two commits to IndexNow (Bing, Yandex, Seznam, Naver...).

Run by .github/workflows/indexnow.yml after each push to main:
    python3 scripts/indexnow.py <before-sha> <after-sha>
    python3 scripts/indexnow.py --all        # every page in sitemap.xml (run once by hand from GitHub Actions)
A page is <folder>/index.html; changes to the explorer's scripts, styles or data count as changes to the
two home pages. Nothing is sent when no page changed.
"""
import json, re, subprocess, sys, urllib.request
from pathlib import Path

SITE = "https://hummingbirds.world"
HOST = "hummingbirds.world"
APP = Path(__file__).resolve().parent.parent
KEY = next(p.stem for p in APP.glob("*.txt") if len(p.stem) == 32 and p.read_text().strip() == p.stem)
EXPLORER = (".js", ".css", ".json")


def changed_files(before, after):
    if not before or set(before) == {"0"}:   # first push of a branch: no "before" commit
        return []
    out = subprocess.run(["git", "-C", str(APP), "diff", "--name-only", "--diff-filter=AMR", before, after],
                         capture_output=True, text=True, check=True).stdout
    return out.split()


def urls(files):
    found = set()
    for f in files:
        if f.endswith("index.html") and not f.startswith(("scripts/", ".github/")):
            found.add(f"{SITE}/{f[:-len('index.html')]}")
        elif f.endswith(EXPLORER) and "/" not in f:
            found.update({f"{SITE}/", f"{SITE}/es/"})
    return sorted(found)


if __name__ == "__main__":
    if sys.argv[1:2] == ["--all"]:
        url_list = re.findall(r"<loc>([^<]+)</loc>", (APP / "sitemap.xml").read_text())
    else:
        url_list = urls(changed_files(*sys.argv[1:3]))
    if not url_list:
        sys.exit(print("No pages changed; nothing sent."))
    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"{SITE}/{KEY}.txt", "urlList": url_list[:10000]}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f"IndexNow: {len(url_list)} pages sent, HTTP {r.status}")
    for u in url_list[:20]:
        print(" ", u)
