import os

with open('src/RequesterApp.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
if re.search(r'requesterId|activeRequesters|Dev Requester', content, re.IGNORECASE):
    print("Found mentions of dev requester")
else:
    print("No mentions of dev requester")
