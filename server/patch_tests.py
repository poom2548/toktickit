import os

for path in ['tests/lab-03/requester-regression.api.test.ts', 'tests/lab-03/comments-notes.api.test.ts']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace(\"'MEDIUM'\", \"'Medium'\")
    content = content.replace(\"'LOW'\", \"'Low'\")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done test priority fixes')
