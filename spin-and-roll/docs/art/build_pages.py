"""Builds the prompt list two ways: art-prompts.md (plain text, for the repo) and the HTML page."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import prompts as P

data = []
for key, title, folder, blurb, rows in P.SECTIONS:
    size, _ = P.SPECS[key]
    data.append({'key': key, 'title': title, 'folder': folder, 'blurb': blurb, 'size': size,
                 'items': [{'id': i, 'name': n, 'file': P.file_for(key, i), 'prompt': P.full_prompt(key, t)} for i, n, t in rows]})

# ---- Markdown
md = ['# Spin & Roll: image prompts for The Hollow Heir', '',
      'Every picture the players see. Paste a prompt into your image tool, save the result with the exact file name shown, '
      'and put it in that folder inside `spin-and-roll/`. Anything without a picture keeps its emoji, so add them in any order.', '',
      'Check what you have on the GM screen: **Media** tab, file checklist.', '']
for s in data:
    md += [f'## {s["title"]} ({len(s["items"])})', '', f'{s["blurb"]}', '', f'Folder: `{s["folder"]}/`  ·  Size: {s["size"]}', '']
    for it in s['items']:
        md += [f'### {it["name"]}', f'`{it["file"]}`', '', it['prompt'], '']
open(os.path.join(HERE, 'art-prompts.md'), 'w').write('\n'.join(md))

# ---- HTML page
tpl = open(os.path.join(HERE, 'page_template.html')).read()
total = sum(len(s['items']) for s in data)
html = tpl.replace('/*DATA*/null', json.dumps(data, ensure_ascii=False)).replace('{{TOTAL}}', str(total))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'art-prompts.html')
open(out, 'w').write(html)
print('sections', len(data), 'prompts', total, '->', out)
