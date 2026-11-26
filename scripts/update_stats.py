"""Weekly refresh of the research figures on the portfolio page.

Two independent sources, so a failure in one never blanks the other:

  1. OpenAlex (free, no key) -> the citations-per-year chart and its total.
  2. Google Scholar          -> headline citations, h-index and i10-index.
     Only when the repo secret SERPAPI_KEY is set. Google blocks direct
     scraping from CI, so without the key these figures stay as they are
     and can be edited by hand in index.html whenever they drift.

If a source can't be reached, the page keeps the numbers it already has
rather than showing wrong ones.
"""
import json
import os
import re
import sys

import requests

ORCID = "0000-0003-1919-3407"
SCHOLAR_ID = "ULNFqZIAAAAJ"
PAGE = "index.html"
CITE_FILE = "assets/citations-by-year.json"
UA = {"User-Agent": "mueenuddin-portfolio/1.0 (mailto:mueen.uddin@udst.edu.qa)"}


# --------------------------------------------------------------- OpenAlex
def citations_by_year():
    """Return {year: citations} from OpenAlex, or None if unavailable."""
    r = requests.get(
        "https://api.openalex.org/authors/https://orcid.org/" + ORCID,
        headers=UA, timeout=60,
    )
    r.raise_for_status()
    rows = r.json().get("counts_by_year", [])
    out = {int(d["year"]): int(d["cited_by_count"]) for d in rows if d.get("cited_by_count")}
    return dict(sorted(out.items())) if len(out) >= 5 else None


# ----------------------------------------------------------- Google Scholar
def scholar_serpapi():
    key = os.environ.get("SERPAPI_KEY")
    if not key:
        return None
    r = requests.get(
        "https://serpapi.com/search.json",
        params={"engine": "google_scholar_author", "author_id": SCHOLAR_ID, "api_key": key},
        timeout=60,
    )
    r.raise_for_status()
    vals = {}
    for row in r.json()["cited_by"]["table"]:
        (name, v), = row.items()
        vals[name] = v["all"]
    return {"citations": vals["citations"], "h": vals["h_index"], "i10": vals["i10_index"]}


def scholar_stats():
    for fn in (scholar_serpapi,):
        try:
            s = fn()
        except Exception as e:
            print(fn.__name__, "failed:", e)
            continue
        if s and s["citations"] > 1000:
            print("Scholar stats from", fn.__name__, s)
            return s
    return None


# ------------------------------------------------------------------ rewrite
def main():
    html = open(PAGE, encoding="utf-8").read()
    before = html

    try:
        cites = citations_by_year()
    except Exception as e:
        print("OpenAlex failed:", e)
        cites = None

    if cites:
        total = sum(cites.values())
        blob = json.dumps({str(k): v for k, v in cites.items()}, separators=(",", ":"))
        html = re.sub(
            r'(<script type="application/json" id="citeData">).*?(</script>)',
            lambda m: m.group(1) + blob + m.group(2),
            html, flags=re.S,
        )
        html = re.sub(r"OpenAlex \([\d,]+ in total\)", f"OpenAlex ({total:,} in total)", html)
        os.makedirs(os.path.dirname(CITE_FILE), exist_ok=True)
        with open(CITE_FILE, "w", encoding="utf-8") as fh:
            json.dump(cites, fh, indent=1)
        print(f"Citations chart updated: {len(cites)} years, {total:,} total")

    stats = scholar_stats()
    if stats:
        cites_txt = f"{stats['citations'] // 10 * 10:,}+"
        h, i10 = str(stats["h"]), str(stats["i10"])
        html = re.sub(r'(data-gs="citations">)[^<]*(<)', rf"\g<1>{cites_txt}\2", html)
        html = re.sub(r'(data-gs="h">)[^<]*(<)', rf"\g<1>{h}\2", html)
        html = re.sub(r'(data-gs="i10">)[^<]*(<)', rf"\g<1>{i10}\2", html)

        def fix_meta(m):
            tag = m.group(0)
            tag = re.sub(r"[\d,]+\+ citations", f"{cites_txt} citations", tag)
            tag = re.sub(r"h-index \d+", f"h-index {h}", tag)
            return tag

        html = re.sub(r'<meta (name="description"|property="og:description")[^>]*>', fix_meta, html)
        print(f"Scholar figures updated: {cites_txt} citations, h {h}, i10 {i10}")

    if html != before:
        open(PAGE, "w", encoding="utf-8").write(html)
        print("index.html written.")
    else:
        print("Nothing changed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
