import os
import re
with open('src/CreateTicketForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\bRequester,\s*', '', content)
with open('src/CreateTicketForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
