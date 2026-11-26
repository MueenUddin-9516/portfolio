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
    ('email',    'Email',          'mueen.uddin@udst.edu.qa',  'mailto:mueen.uddin@udst.edu.qa'),
    ('scholar',  'Google Scholar', 'Publications and citations','https://scholar.google.com/citations?user=ULNFqZIAAAAJ&hl=en'),
    ('orcid',    'ORCID',          '0000-0003-1919-3407',      'https://orcid.org/0000-0003-1919-3407'),
    ('scopus',   'Scopus',         'Author ID 42062605100',    'https://www.scopus.com/authid/detail.uri?authorId=42062605100'),
    ('linkedin', 'LinkedIn',       'Professional profile',     'https://www.linkedin.com/in/mueen-uddin-bbba4b16/'),
    ('github',   'GitHub',         'Code and this site',       'https://github.com/MueenUddin-9516'),
    ('cv',       'Curriculum vitae','Full CV as PDF',          'assets/Mueen_Uddin_CV.pdf'),
    ('site',     'This profile',   'Share the page',           'https://mueenuddin-9516.github.io/portfolio/'),
]
qr = ''
for slug, label, sub, href in QR:
    svg = open(os.path.join(ROOT, 'assets/qr', slug + '.svg'), encoding='utf-8').read().strip()
    svg = svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
    ext = ' target="_blank" rel="noopener"' if href.startswith('http') else ''
    qr += (f'<a class="qr-card" href="{html.escape(href, quote=True)}"{ext}>'
           f'<span class="qr-tile">{svg}</span>'
           f'<b>{html.escape(label)}</b><span>{html.escape(sub)}</span></a>')

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
