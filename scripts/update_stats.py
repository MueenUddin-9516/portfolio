"""Weekly refresh of Google Scholar figures on the portfolio page.

Reads citations, h-index and i10-index for the Scholar profile below and
writes them into index.html (elements tagged data-gs="citations|h|i10" and
the two <meta> description tags). If Scholar can't be reached, the page is
left unchanged so a bad fetch never wipes the numbers.

Source order:
  1. SerpAPI (needs repo secret SERPAPI_KEY; free tier covers weekly runs)
  2. The `scholarly` package (free, but Google often blocks GitHub's servers)
"""
import os
import re
import sys

import requests

SCHOLAR_ID = "ULNFqZIAAAAJ"
PAGE = "index.html"


def from_serpapi():
    key = os.environ.get("SERPAPI_KEY")
    if not key:
        return None
    r = requests.get(
        "https://serpapi.com/search.json",
        params={"engine": "google_scholar_author", "author_id": SCHOLAR_ID, "api_key": key},
        timeout=60,
    )
    r.raise_for_status()
    table = r.json()["cited_by"]["table"]
    vals = {}
    for row in table:
        (name, v), = row.items()
        vals[name] = v["all"]
    return {"citations": vals["citations"], "h": vals["h_index"], "i10": vals["i10_index"]}


def from_scholarly():
    try:
        from scholarly import scholarly
        a = scholarly.fill(scholarly.search_author_id(SCHOLAR_ID), sections=["indices"])
        return {"citations": a["citedby"], "h": a["hindex"], "i10": a["i10index"]}
    except Exception as e:  # blocked, captcha, etc.
        print("scholarly failed:", e)
        return None


def main():
    stats = None
    for fn in (from_serpapi, from_scholarly):
        try:
            stats = fn()
        except Exception as e:
            print(fn.__name__, "failed:", e)
        if stats:
            print("Got stats from", fn.__name__, stats)
            break
    if not stats or stats["citations"] < 1000:
        print("No reliable stats; leaving page unchanged.")
        return 0

    cites = f"{stats['citations'] // 10 * 10:,}+"  # e.g. 9,567 -> 9,560+
    h, i10 = str(stats["h"]), str(stats["i10"])

    html = open(PAGE, encoding="utf-8").read()
    new = re.sub(r'(data-gs="citations">)[^<]*(<)', rf"\g<1>{cites}\2", html)
    new = re.sub(r'(data-gs="h">)[^<]*(<)', rf"\g<1>{h}\2", new)
    new = re.sub(r'(data-gs="i10">)[^<]*(<)', rf"\g<1>{i10}\2", new)

    def fix_meta(m):
        tag = m.group(0)
        tag = re.sub(r"[\d,]+\+ citations", f"{cites} citations", tag)
        tag = re.sub(r"h-index \d+", f"h-index {h}", tag)
        return tag

    new = re.sub(r'<meta (name="description"|property="og:description")[^>]*>', fix_meta, new)

    if new != html:
        open(PAGE, "w", encoding="utf-8").write(new)
        print("index.html updated:", cites, "citations, h", h, "i10", i10)
    else:
        print("Figures unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
