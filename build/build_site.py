import json, re, html, os

ROOT = '/home/claude/portfolio'
p = json.load(open('pubs.json'))
tpl = open('index.tpl.html', encoding='utf-8').read()

# ---------- citations per year (OpenAlex) ----------
cites = json.load(open('cites.json'))
oa_total = sum(cites.values())

# ---------- featured publications ----------
def bold(a):
    return html.escape(a).replace('Mueen Uddin', '<span class="me">Mueen Uddin</span>')

keys = ['Machine Unlearning', 'Generative AI Revolution', 'Exploring the Convergence',
        'Critical Analysis of Generative', 'SEIMR', 'PrivNet', 'Hierarchical and Privacy',
        'Blockchain for Digital Twins']
feat = ''
for i, k in enumerate(keys):
    x = next(q for q in p if k in q['t'])
    f = f'<span class="pill if">IF {x["f"]:g}</span>' if x['f'] else ''
    feat += (f'<article class="pub-card{" lead" if i == 0 else ""}">'
             f'<div class="venue">{html.escape(x["v"])}</div>'
             f'<div class="t">{html.escape(x["t"])}</div>'
             f'<div class="au">{bold(x["a"])}</div>'
             f'<div class="meta">{f}<span class="pill">{x["y"]}</span></div></article>')

# ---------- QR cards ----------
QR = [
    ('scholar',  'Scholar',  'https://scholar.google.com/citations?user=ULNFqZIAAAAJ'),
    ('orcid',    'ORCID',    'https://orcid.org/0000-0003-1919-3407'),
    ('scopus',   'Scopus',   'https://www.scopus.com/authid/detail.uri?authorId=42062605100'),
    ('linkedin', 'LinkedIn', 'https://linkedin.com/in/mueen-uddin-bbba4b16'),
    ('github',   'GitHub',   'https://github.com/MueenUddin-9516'),
    ('cv',       'CV (PDF)', 'https://mueenuddin-9516.github.io/portfolio/assets/Mueen_Uddin_CV.pdf'),
]
qr = ''
for slug, label, href in QR:
    svg = open(os.path.join(ROOT, 'assets/qr', slug + '.svg'), encoding='utf-8').read().strip()
    svg = svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
    ext = ' target="_blank" rel="noopener"' if href.startswith('http') else ''
    qr += (f'<a class="qr-card" href="{html.escape(href, quote=True)}"{ext} title="{html.escape(label)}">'
           f'<span class="qr-tile">{svg}</span><b>{html.escape(label)}</b></a>')

data = json.dumps(p, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
cdata = json.dumps(cites, separators=(',', ':'))

out = (tpl.replace('__FEATURED__', feat)
          .replace('__QR__', qr)
          .replace('__OA_TOTAL__', f'{oa_total:,}')
          .replace('__PUBS__', data)
          .replace('<script src="assets/script.js"></script>',
                   f'<script type="application/json" id="citeData">{cdata}</script>\n<script src="assets/script.js"></script>'))
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)
print('built', len(out))
