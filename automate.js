import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import 'dotenv/config';

import {
  BookOpen,
  CreditCard,
  Headphones,
  MessageSquare,
  BookMarked,
  Library,
  GraduationCap,
  FileText,
  Volume2,
  Pencil,
  Gamepad2,
  Lightbulb,
  Waves,
  Users,
  Languages,
  ClipboardCheck,
  User
} from 'lucide-react';

console.log(process.env.GROQ_API_KEY)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function darkenColor(hex, percent) {
  const hsl = hexToHsl(hex);
  const newL = Math.max(0, hsl.l - percent);
  return hslToHex(hsl.h, hsl.s, newL);
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(H) {
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = parseInt(H[1] + H[1], 16);
    g = parseInt(H[2] + H[2], 16);
    b = parseInt(H[3] + H[3], 16);
  } else if (H.length === 7) {
    r = parseInt(H[1] + H[2], 16);
    g = parseInt(H[3] + H[4], 16);
    b = parseInt(H[5] + H[6], 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const categories = [
  { id: 1, color: '#b82121', label: 'Speak With AI', icon: MessageSquare, 'shadow': darkenColor('#b82121', 15) }, // -> #871818
  { id: 2, color: '#ed5215', label: 'FlashCards', icon: CreditCard, 'shadow': darkenColor('#ed5215', 15) },      // -> #b84011
  { id: 3, color: '#F1C40F', label: 'Listening', icon: Headphones, 'shadow': darkenColor('#F1C40F', 15) },       // -> #c29c0c
  { id: 4, color: '#5fd100', label: 'Grammar', icon: BookOpen, 'shadow': darkenColor('#5fd100', 15) },           // -> #4b9e00
  { id: 5, color: '#2eab15', label: 'Dictionary', icon: BookMarked, 'shadow': darkenColor('#2eab15', 15) },       // -> #238210
  { id: 6, color: '#096105', label: 'My vocabulary', icon: Library, 'shadow': darkenColor('#096105', 15) },       // -> #064904
  { id: 7, color: '#009982', label: 'Courses', icon: GraduationCap, 'shadow': darkenColor('#009982', 15) },       // -> #007666
  { id: 8, color: '#0e94b5', label: 'Reading Comprehension', icon: FileText, 'shadow': darkenColor('#0e94b5', 15) }, // -> #0b738c
  { id: 9, color: '#085163', label: 'Pronnounce', icon: Volume2, 'shadow': darkenColor('#085163', 15) },         // -> #063d4a
  { id: 10, color: '#122987', label: 'Writing', icon: Pencil, 'shadow': darkenColor('#122987', 15) },           // -> #0e1e69
  { id: 11, color: '#5902b0', label: 'Games', icon: Gamepad2, 'shadow': darkenColor('#5902b0', 15) },           // -> #440188
  { id: 12, color: '#a61b57', label: 'Modern methodologies', icon: Lightbulb, 'shadow': darkenColor('#a61b57', 15) }, // -> #7f1442
  { id: 13, color: '#b00245', label: 'Immersion', icon: Waves, 'shadow': darkenColor('#b00245', 15) },           // -> #880135
  { id: 14, color: '#ad9a6f', label: 'Speak With Natives', icon: Users, 'shadow': darkenColor('#ad9a6f', 15) },   // -> #877651
  { id: 15, color: '#573a22', label: 'Translation Practice', icon: Languages, 'shadow': darkenColor('#573a22', 15) }, // -> #422c19
  { id: 16, color: '#606160', label: 'Test Your English Level', icon: ClipboardCheck, 'shadow': darkenColor('#606160', 15) }, // -> #4a4a4a
  { id: 17, color: '#333333', label: 'Community', icon: User, 'shadow': darkenColor('#333333', 15) },           // -> #282828
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function improveOrCreateComponent(category) {
  const fileName = category.label.replace(/\s+/g, '') + '.jsx';
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  const filePath = path.join(componentsDir, fileName);

  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }

  let existingCode = '';
  
  if (fs.existsSync(filePath)) {
    existingCode = fs.readFileSync(filePath, 'utf8');
    console.log(`\x1b[36m[Otimizando]\x1b[0m ${category.label} (${fileName})`);
  } else {
    console.log(`\x1b[33m[Criando]\x1b[0m ${category.label} (${fileName})`);
  }

  const prompt = `
    Você é um desenvolvedor React Sênior. 
    Tarefa: ${existingCode ? 'Refatorar e melhorar' : 'Criar do zero'} o componente para a funcionalidade de uma plataforma de inglês chamada "${category.label}".
    Contexto: O projeto usa React, JS e CSS puros.
    Código Atual: ${existingCode || 'Não existe ainda.'}
    
    Regras:
    1. Retorne APENAS o código JSX puro, sem explicações.
    2. Use componentes do 'lucide-react' para ícones se necessário.
    3. Design moderno, clean e dark mode friendly.
    4. Adicione comentários curtos explicando lógicas complexas.
    5. Se o código estiver sem js e react puro, transforme nisso deixando puro.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let newCode = chatCompletion.choices[0].message.content;

    newCode = newCode.replace(/```jsx|```javascript|```react|```/g, '').trim();

    fs.writeFileSync(filePath, newCode);
    
    console.log(`\x1b[32m[SUCESSO]\x1b[0m ${fileName} atualizado.\n`);
  } catch (error) {
    console.error(`\x1b[31m[ERRO]\x1b[0m Falha ao processar ${category.label}:`, error.message);
  }
}

async function run() {
  console.log("\x1b[1mIniciando o Arquiteto Grok...\x1b[0m\n");

  for (const cat of categories) {
    await improveOrCreateComponent(cat);
    
    await sleep(2000);
  }

  console.log("\x1b[1m\x1b[32mProjeto atualizado com sucesso!\x1b[0m");
}

run();