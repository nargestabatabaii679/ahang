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

# 1. Patch renderer-template.mjs — inject production CSS/JS
path = ".output/server/_chunks/renderer-template.mjs"
content = open(path).read()
dev_tag = '<script type=\\"module\\" src=\\"/src/start.ts\\"><\\/script>'
prod_tags = '<link rel=\\"stylesheet\\" href=\\"/assets/' + css + '\\"><script type=\\"module\\" src=\\"/assets/' + js + '\\"><\\/script>'
patched = content.replace(dev_tag, prod_tags)
if patched == content:
    if js in content:
        print("renderer-template already patched")
    else:
        print("ERROR: dev tag not found in renderer-template.mjs"); sys.exit(1)
else:
    open(path, 'w').write(patched)
    print("patched renderer-template: " + js + " + " + css)

# 2. Patch index.mjs — wire SSR service to handle ALL routes (including /api/*)
index_path = ".output/server/index.mjs"
idx = open(index_path).read()

if "ssrHandler" in idx:
    print("index.mjs already patched with SSR handler")
else:
    old_handler = 'var _lazy_l4O20E = defineLazyEventHandler(() => import("./_chunks/renderer-template.mjs"));'
    new_handler = (
        'var _lazy_l4O20E = defineLazyEventHandler(async () => {\n'
        '  const { default: ssrHandler } = await import("./_ssr/ssr.mjs");\n'
        '  const { default: rendererTemplate } = await import("./_chunks/renderer-template.mjs");\n'
        '  return defineHandler(async (event) => {\n'
        '    try {\n'
        '      const req = event.req instanceof Request ? event.req : new Request(\n'
        '        "http://" + (event.req.headers.host || "localhost") + event.req.url,\n'
        '        { method: event.req.method, headers: event.req.headers,\n'
        '          body: ["GET","HEAD"].includes(event.req.method) ? undefined : event.req,\n'
        '          duplex: "half" }\n'
        '      );\n'
        '      return await ssrHandler.fetch(req, {}, {});\n'
        '    } catch (err) {\n'
        '      console.error("[SSR Error]", err);\n'
        '      return rendererTemplate(event.req);\n'
        '    }\n'
        '  });\n'
        '});'
    )
    if old_handler not in idx:
        print("ERROR: index.mjs pattern not found"); sys.exit(1)
    open(index_path, 'w').write(idx.replace(old_handler, new_handler))
    print("index.mjs patched — SSR service wired for all routes")
