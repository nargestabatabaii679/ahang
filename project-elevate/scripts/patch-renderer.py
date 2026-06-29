#!/usr/bin/env python3
import os, sys, re

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

# 2. Patch index.mjs — wire SSR + dynamic media handler
index_path = ".output/server/index.mjs"
idx = open(index_path).read()

if "ssrHandler" in idx:
    print("index.mjs already patched with SSR handler")
else:
    # Match: var <anyname> = defineLazyEventHandler(() => import("./_chunks/renderer-template.mjs"));
    # The variable name is a hash that may differ between environments.
    pattern = re.compile(
        r'(var\s+(\S+)\s*=\s*defineLazyEventHandler\(\(\)\s*=>\s*import\("\./_chunks/renderer-template\.mjs"\)\);)'
    )
    m = pattern.search(idx)
    if not m:
        # Dump first 3000 chars to help debug
        print("ERROR: index.mjs pattern not found. First 3000 chars:"); print(idx[:3000]); sys.exit(1)
    old_handler = m.group(1)
    lazy_var = m.group(2)   # e.g. _lazy_l4O20E or whatever the build produced
    new_handler = (
        '// Dynamic media file server for runtime-generated files\n'
        'import { createReadStream, statSync } from "node:fs";\n'
        'import { join as pathJoin, extname } from "node:path";\n'
        'var RUNTIME_MEDIA_DIR = process.env.MEDIA_DIR || pathJoin(process.cwd(), "public", "media");\n'
        'var MIME = { ".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",\n'
        '  ".gif":"image/gif",".mp3":"audio/mpeg",".wav":"audio/wav",".ogg":"audio/ogg",\n'
        '  ".webm":"audio/webm",".m4a":"audio/mp4",".mp4":"video/mp4",".flac":"audio/flac",\n'
        '  ".aac":"audio/aac" };\n'
        'var mediaHandler = defineHandler((event) => {\n'
        '  var filename = event.url.pathname.replace(/^\\/media\\//, "");\n'
        '  if (!filename || filename.includes("..")) return new NodeResponse(null, { status: 404 });\n'
        '  var filePath = pathJoin(RUNTIME_MEDIA_DIR, filename);\n'
        '  try {\n'
        '    var stat = statSync(filePath);\n'
        '    var ct = MIME[extname(filename).toLowerCase()] || "application/octet-stream";\n'
        '    var stream = createReadStream(filePath);\n'
        '    return new NodeResponse(stream, {\n'
        '      status: 200,\n'
        '      headers: { "content-type": ct, "content-length": String(stat.size),\n'
        '        "cache-control": "public, max-age=31536000, immutable" }\n'
        '    });\n'
        '  } catch { return new NodeResponse(null, { status: 404 }); }\n'
        '});\n'
        '\n'
        + f'var {lazy_var} = defineLazyEventHandler(async () => {{\n'
        '  const { default: renderTemplate } = await import("./_chunks/renderer-template.mjs");\n'
        '  return defineHandler(async (event) => {\n'
        '    if (event.url.pathname.startsWith("/media/")) return mediaHandler(event);\n'
        '    try {\n'
        '      return await services.ssr.fetch(event.req, {}, {});\n'
        '    } catch (err) {\n'
        '      console.error("[SSR Error]", err);\n'
        '      return renderTemplate(event);\n'
        '    }\n'
        '  });\n'
        '});'
    )
    open(index_path, 'w').write(idx.replace(old_handler, new_handler))
    print("index.mjs patched — SSR + dynamic media handler wired (var: " + lazy_var + ")")
