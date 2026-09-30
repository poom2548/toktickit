import os
path = r'src/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import { apiFetch } from \"./utils/api.js\";', 'import { apiFetch } from \"./utils/api\";')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed import')
