from pathlib import Path
import re
root = Path('src')
for path in root.rglob('*.jsx'):
    text = path.read_text(encoding='utf-8')
    orig = text
    text = re.sub(r"import React, \{([^}]*)\} from ['\"]react['\"];?\n", r"import {\1} from 'react'\n", text)
    text = re.sub(r"import React from ['\"]react['\"];?\n", '', text)
    if text != orig:
        path.write_text(text, encoding='utf-8')
