import os
import re

source_file = r"c:\Users\admin\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\1F11EF984C5A3F48AEEC02BBFB21E77AA97FE937\transfers\2026-16\MediaDNA_AI_Final.html"
dest_dir = r"d:\OneDrive\Desktop\AntiGravity"

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
css_content = css_match.group(1).strip() if css_match else ""

js_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
js_content = js_match.group(1).strip() if js_match else ""

os.makedirs(os.path.join(dest_dir, 'src', 'css'), exist_ok=True)
os.makedirs(os.path.join(dest_dir, 'src', 'js'), exist_ok=True)

with open(os.path.join(dest_dir, 'src', 'css', 'style.css'), 'w', encoding='utf-8') as f:
    f.write(css_content)

sections = {
    'config.js': r'/\* ═══════════════ FIREBASE CONFIG ═══════════════.*?(?=\/\* ═══════════════════════════════════════════════\s*UTILITIES)',
    'utils.js': r'/\* ═══════════════════════════════════════════════\s*UTILITIES.*?(?=\/\* ═══════════════════════════════════════════════\s*LAYER 1)',
    'stego.js': r'/\* ═══════════════════════════════════════════════\s*LAYER 1.*?(?=\/\* ═══════════════════════════════════════════════\s*LAYER 3)',
    'api.js': r'/\* ═══════════════════════════════════════════════\s*LAYER 3.*?(?=\/\* ═══════════════════════════════════════════════\s*FIRESTORE OPERATIONS)',
    'db.js': r'/\* ═══════════════════════════════════════════════\s*FIRESTORE OPERATIONS.*?(?=\/\* ═══════════════════════════════════════════════\s*APP STATE)',
    'app_state.js': r'/\* ═══════════════════════════════════════════════\s*APP STATE.*?(?=\/\* ═══════════════════════════════════════════════\s*████████████  UI COMPONENTS  ████████████)',
    'ui.js': r'/\* ═══════════════════════════════════════════════\s*████████████  UI COMPONENTS  ████████████.*?(?=\/\* ═══════════════════════════════════════════════\s*CORE ACTION HANDLERS)',
    'actions.js': r'/\* ═══════════════════════════════════════════════\s*CORE ACTION HANDLERS.*?(?=\/\* ═══════════════════════════════════════════════\s*AUTH)',
    'auth_main.js': r'/\* ═══════════════════════════════════════════════\s*AUTH.*'
}

js_files = {}
for name, pattern in sections.items():
    match = re.search(pattern, js_content, re.DOTALL)
    if match:
        js_files[name] = match.group(0).strip()

# Create a monolithic main.js for Vite to avoid global scoping issues right now,
# but nicely organized. We will assign functions to window so inline onclicks still work.

main_js_content = """import './css/style.css';

// We must assign variables to window because the HTML heavily relies on inline event handlers like onclick="go('protect')"
"""

for name in ['config.js', 'app_state.js', 'utils.js', 'db.js', 'stego.js', 'api.js', 'ui.js', 'actions.js', 'auth_main.js']:
    main_js_content += "\n\n// =================================== " + name + " ===================================\n\n"
    main_js_content += js_files.get(name, '')

# We need to expose ALL functions/vars to window since this is now an ES Module.
# The easiest way is to wrap the original js in a non-module context, but Vite uses modules.
# Let's fix the inline HTML issues by replacing `function fnName` with `window.fnName = function fnName`
# This is a bit hacky, but safer than manually refactoring 100 functions.

def expose_to_window(code):
    code = re.sub(r'^async function ([a-zA-Z0-9_]+)\(', r'window.\1 = async function \1(', code, flags=re.MULTILINE)
    code = re.sub(r'^function ([a-zA-Z0-9_]+)\(', r'window.\1 = function \1(', code, flags=re.MULTILINE)
    # Expose vars
    code = re.sub(r'^const ([a-zA-Z0-9_]+) = ', r'window.\1 = ', code, flags=re.MULTILINE)
    code = re.sub(r'^let ([a-zA-Z0-9_]+) = ', r'window.\1 = ', code, flags=re.MULTILINE)
    code = re.sub(r'^let ([a-zA-Z0-9_]+);', r'window.\1 = undefined;', code, flags=re.MULTILINE)
    return code

main_js_content = expose_to_window(main_js_content)

with open(os.path.join(dest_dir, 'src', 'main.js'), 'w', encoding='utf-8') as f:
    f.write(main_js_content)

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>MediaDNA AI — Digital Sports Media Protection</title>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
</head>
<body>
<canvas id="wm-canvas" style="display:none"></canvas>
<div id="notif-wrap" class="notif-wrap"></div>
<div id="root"></div>

<script type="module" src="/src/main.js"></script>
</body>
</html>
"""

with open(os.path.join(dest_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html_template)
    
print("Done reconstructing for Vite!")
