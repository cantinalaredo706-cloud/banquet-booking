"""Give the site's scripts and styles a new address so browsers fetch the new copy.
Run from the repo root before committing a change to anything in public/css or public/js:
    python3 scripts/bump-version.py
"""
import re, glob, time
new = time.strftime('%Y%m%d%H%M')
files = glob.glob('public/**/*.html', recursive=True) + glob.glob('public/js/*.js')
for f in files:
    s = open(f).read()
    t = re.sub(r'\?v=\d+', '?v=' + new, s)
    if t != s: open(f, 'w').write(t); print('updated', f)
print('version', new)
