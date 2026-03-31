from pathlib import Path
path = Path(r'C:\Users\Geovane TI\Documents\english-platform\checklist-english-platform.md')
text = path.read_text(encoding='utf-8')
line = '- [x] Modelagem relacional normalizada do Grammar criada no PostgreSQL (units, translations, lessons, options, answers, dialogue)\n'
if line not in text:
    marker = '- [x] API `/api/grammar/content` ligada ao Grammar com fallback seguro\n'
    if marker in text:
        text = text.replace(marker, marker + line)
    else:
        text += '\n' + line
path.write_text(text, encoding='utf-8')
