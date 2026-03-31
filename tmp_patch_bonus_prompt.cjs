const fs = require('fs');
const path = 'C:/Users/Geovane TI/Documents/automatizador-pdf/index-pdfs.js';
let txt = fs.readFileSync(path, 'utf8');
const re = /function montarPromptImagemBonus\(tema, bonus, tituloBonus\) \{[\s\S]*?return `\$\{promptBase\}\. \$\{restricaoSemTexto\}`;\r?\n\}/;
const replacement = `function montarPromptImagemBonus(tema, bonus, tituloBonus) {
    const contexto = String(bonus?.desc || tema?.subtitulo || '').trim() || 'cena humana, atmosfera elegante, composição cinematográfica e limpa';
    const promptBase = \
        Gere apenas uma ilustração ou fotografia conceitual pura, sem design de capa, sem layout, sem elementos editoriais e sem qualquer texto embutido.
        Crie uma cena visual coerente com o material bônus do e-book "${tema.nome}".
        Interprete o assunto de forma indireta e simbólica, transformando o tema em ambiente, emoção, objetos, luz, postura, contexto e narrativa visual.
        Contexto visual: ${contexto}.
        Estilo: cinematográfico, sofisticado, realista ou semi-realista, composição limpa, foco total na cena, na atmosfera e nos elementos visuais, paleta coerente com ${tema.cor}.
        Evite qualquer coisa que pareça capa de livro, poster, anúncio, manchete, slide, thumbnail, interface, mockup, embalagem ou peça gráfica.
        Não tente escrever o título ${tituloBonus} na imagem; represente o conceito apenas por símbolos, pessoas, cenário e iluminação.
    `.trim();

    const restricaoSemTexto = \
        Regras visuais obrigatórias:
        - sem texto
        - sem letras
        - sem palavras
        - sem tipografia
        - sem números
        - sem logotipos
        - sem marcas d'água
        - sem capa de livro
        - sem poster
        - sem headline
        - sem selo
        - sem interface
        - sem qualquer caractere visível
        - imagem puramente visual, cinematográfica e limpa
    `.trim();

    return `${promptBase}. ${restricaoSemTexto}`;
}`;
if (!re.test(txt)) throw new Error('Função montarPromptImagemBonus não encontrada');
txt = txt.replace(re, replacement);
fs.writeFileSync(path, txt, 'utf8');
console.log('ok');
