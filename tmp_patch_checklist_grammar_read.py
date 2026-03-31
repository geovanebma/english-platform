from pathlib import Path
path = Path(r'C:\Users\Geovane TI\Documents\english-platform\checklist-english-platform.md')
text = path.read_text(encoding='utf-8')
line = '- [x] API do Grammar agora prefere leitura das tabelas relacionais novas com fallback seguro\n'
if line not in text:
    text += '\n' + line
path.write_text(text, encoding='utf-8')
