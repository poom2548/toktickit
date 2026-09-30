import os

path = r'src/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'apiFetch' not in content:
    content = 'import { apiFetch } from \"./utils/api.js\";\n' + content

# Replace fetch with apiFetch
content = content.replace('await fetch(', 'await apiFetch(')

# Remove getRequesterHeaders
import re
content = re.sub(r'/\*\* localStorage key.*?export function getRequesterHeaders.*?}\n', '', content, flags=re.DOTALL)
content = re.sub(r'headers: \{ \.\.\.getRequesterHeaders\(\) \},?', '', content)

# Remove getActiveRequesters
content = re.sub(r'/\*\* Fetch all active requesters.*?export async function getActiveRequesters.*?\n}', '', content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done src/api.ts')
