#!/usr/bin/env python3
import os, sys

assets_dir = ".output/public/assets"
if not os.path.isdir(assets_dir):
    print("assets dir not found"); sys.exit(1)

assets = os.listdir(assets_dir)
js  = next((f for f in assets if f.startswith("index-") and f.endswith(".js")), None)
css = next((f for f in assets if f.startswith("styles-") and f.endswith(".css")), None)
if not js or not css:
    print("assets not found"); sys.exit(1)

path = ".output/server/_chunks/renderer-template.mjs"
content = open(path).read()

dev_tag = '<script type=\\"module\\" src=\\"/src/start.ts\\"><\\/script>'
prod_tags = f'<link rel=\\"stylesheet\\" href=\\"/assets/{css}\\"><script type=\\"module\\" src=\\"/assets/{js}\\"><\\/script>'

patched = content.replace(dev_tag, prod_tags)
if patched == content:
    print("already patched or pattern not found")
    # Check if already has assets
    if js in content:
        print("already patched with", js)
        sys.exit(0)
    print("ERROR: cannot find dev tag"); sys.exit(1)

open(path, 'w').write(patched)
print(f"patched: {js} + {css}")
