const fs = require('fs');
const path = 'C:/Users/Geovane TI/Documents/automatizador-pdf/temas.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const tema = data.find(t => t.id === 2);
if (!tema) throw new Error('ID 2 não encontrado');

tema.feito = false;
if (tema.estrutura && Array.isArray(tema.estrutura.capitulos)) {
  tema.estrutura.capitulos = tema.estrutura.capitulos.map(cap => {
    if (Array.isArray(cap) && cap.length >= 3) cap[2] = false;
    return cap;
  });
}
if (Array.isArray(tema.bonus)) {
  tema.bonus = tema.bonus.map(b => ({
    ...b,
    feito: false,
    status: 'planejado'
  }));
}
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
const check = JSON.parse(fs.readFileSync(path, 'utf8')).find(t => t.id === 2);
console.log(JSON.stringify({
  id: check.id,
  feito: check.feito,
  capitulosFalse: check.estrutura.capitulos.every(c => c[2] === false),
  bonusFalse: Array.isArray(check.bonus) ? check.bonus.every(b => b.feito === false) : true,
  bonusStatus: Array.isArray(check.bonus) ? [...new Set(check.bonus.map(b => b.status))] : []
}));
