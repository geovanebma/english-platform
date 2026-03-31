from pathlib import Path
path = Path(r'C:\Users\Geovane TI\Documents\english-platform\checklist-english-platform.md')
text = path.read_text(encoding='utf-8')
for line in [
    '- [x] API/seed do Grammar expandidos para A2-C2 com conteudo multilocale no banco\n',
    '- [x] Frontend do Grammar agora busca o nivel atual no banco, nao apenas A1\n',
]:
    if line not in text:
        text += '\n' + line
path.write_text(text, encoding='utf-8')
