import os
import re

files_to_patch = [
    'src/CreateTicketForm.tsx',
    'src/RequesterApp.tsx',
    'src/contexts/AuthContext.tsx',
    'src/pages/ChangePasswordPage.tsx'
]

for path in files_to_patch:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'apiFetch' not in content:
        # We need to find the right relative path for utils/api
        depth = len(path.split('/')) - 2
        prefix = '../' * depth if depth > 0 else './'
        import_stmt = f'import {{ apiFetch }} from \"{prefix}utils/api\";\n'
        content = import_stmt + content
    
    content = content.replace('await fetch(', 'await apiFetch(')
    content = content.replace(' fetch(', ' apiFetch(')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done replacing fetch')
