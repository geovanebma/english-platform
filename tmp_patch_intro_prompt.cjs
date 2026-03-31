const fs = require('fs');
const path = 'C:/Users/Geovane TI/Documents/automatizador-pdf/index-pdfs.js';
let txt = fs.readFileSync(path, 'utf8');
const old = '        - Termine com uma frase de incentivo.\n        ${instrucoesPtBrExtras()}\n    `;';
const neu = '        - Termine com uma frase de incentivo.\n        ${tema.introducao_prompt ? `- Diretrizes específicas deste tema: ${tema.introducao_prompt}` : \'\'}\n        ${instrucoesPtBrExtras()}\n    `;';
if (!txt.includes(old)) throw new Error('Trecho-alvo da introdução não encontrado');
txt = txt.replace(old, neu);
fs.writeFileSync(path, txt, 'utf8');
console.log('ok');
