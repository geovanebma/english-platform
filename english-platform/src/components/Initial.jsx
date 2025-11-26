import React, { useState } from 'react';
import ReactDOM from 'react-dom/client'
import App from '../App.jsx'
import '../initial.css'
// import { motion } from 'motion/react';
import { motion } from 'framer-motion';

// require('dotenv').config();

// // Importa a classe principal do Google GenAI
// const { GoogleGenAI } = require('@google/genai');

// // Obtém a chave de API do arquivo .env
// const apiKey = process.env.GEMINI_API_KEY;

import Grammar from '../components/Grammar.jsx';
import Flashcards from '../components/Flashcards.jsx';
import Listening from '../components/Listening.jsx';
import MyVocabulary from '../components/MyVocabulary.jsx';
import SpeakWithAI from '../components/SpeakWithAI.jsx';

// Verifica se a chave de API foi carregada
// if (!apiKey) {
//     console.error("ERRO: A chave GEMINI_API_KEY não foi encontrada. Verifique o arquivo .env.");
//     process.exit(1);
// }

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

// Importações fictícias (mantidas para manter a estrutura original)
// const MessageSquare = 'MessageSquare';
// const CreditCard = 'CreditCard';
// const Headphones = 'Headphones';
// const BookOpen = 'BookOpen';
// const BookMarked = 'BookMarked';
// const Library = 'Library';
// const GraduationCap = 'GraduationCap';
// const FileText = 'FileText';
// const Volume2 = 'Volume2';
// const Pencil = 'Pencil';
// const Gamepad2 = 'Gamepad2';
// const Lightbulb = 'Lightbulb';
// const Waves = 'Waves';
// const Users = 'Users';
// const Languages = 'Languages';
// const ClipboardCheck = 'ClipboardCheck';
// const User = 'User';

/**
 * Função utilitária para converter uma cor Hexadecimal para HSL.
 * @param {string} H - Cor Hexadecimal (ex: #b82121)
 * @returns {object} {h, s, l}
 */
function hexToHsl(H) {
  let r = 0, g = 0, b = 0;
  // 3 dígitos
  if (H.length === 4) {
    r = parseInt(H[1] + H[1], 16);
    g = parseInt(H[2] + H[2], 16);
    b = parseInt(H[3] + H[3], 16);
  } else if (H.length === 7) {
    // 6 dígitos
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
    h = s = 0; // monocromático
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

/**
 * Função utilitária para converter HSL de volta para Hexadecimal.
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Cor Hexadecimal
 */
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

/**
 * Escurece uma cor Hexadecimal em uma porcentagem de luminosidade.
 * @param {string} hex - Cor Hexadecimal.
 * @param {number} percent - Porcentagem para reduzir a Luminosidade (ex: 15).
 * @returns {string} Novo Hexadecimal escurecido.
 */
function darkenColor(hex, percent) {
  const hsl = hexToHsl(hex);
  // Reduz a luminosidade (L), garantindo que não fique abaixo de zero
  const newL = Math.max(0, hsl.l - percent);
  return hslToHex(hsl.h, hsl.s, newL);
}

// --- Array Final com shadow ---

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
  { id: 14, color: '#ad9a6f', label: 'Speak With natives', icon: Users, 'shadow': darkenColor('#ad9a6f', 15) },   // -> #877651
  { id: 15, color: '#573a22', label: 'Translation Practice', icon: Languages, 'shadow': darkenColor('#573a22', 15) }, // -> #422c19
  { id: 16, color: '#606160', label: 'Test Your English Level', icon: ClipboardCheck, 'shadow': darkenColor('#606160', 15) }, // -> #4a4a4a
  { id: 17, color: '#333333', label: 'Community', icon: User, 'shadow': darkenColor('#333333', 15) },           // -> #282828
];

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App /> {/* CORRIGIDO: Use o componente 'App' */}
//   </React.StrictMode>,
// )

export default function InitialPage() {
  const [currentView, setCurrentView] = useState('initial');

  const handleCategoryClick = (type) => {
    console.log(type)
    // Apenas mude o estado. Isso é tudo!
    setCurrentView(type);
  };

  if (currentView === 'Grammar') {
    return <Grammar setCurrentView={setCurrentView} color={"#b82121"} />;
  }

  if (currentView === 'FlashCards') { // Use o 'label' do seu array de categorias
    return <Flashcards setCurrentView={setCurrentView} color={"#ed5215"} />;
  }

  if (currentView === 'Listening') { // Use o 'label' do seu array de categorias
    return <Listening setCurrentView={setCurrentView} color={"#F1C40F"} />;
  }

  if (currentView === 'My vocabulary') { // Use o 'label' do seu array de categorias
    return <MyVocabulary setCurrentView={setCurrentView} color={"#096105"} />;
  }
  
  if (currentView === 'SpeakWithAI') { // Use o 'label' do seu array de categorias
    return <SpeakWithAI setCurrentView={setCurrentView} color={"#096105"}/>;
  }

  // return (
  //     <div className="min-h-screen bg-white">
  //         {/* Navigation Bar */}
  //         <nav className="bg-black text-white px-6 py-4 sticky top-0 z-50">
  //             <div className="max-w-7xl mx-auto flex items-center justify-between">
  //                 <h1 className="text-white">English Learning Platform</h1>
  //                 <div className="flex gap-6">
  //                     <button className="text-white hover:text-gray-300 transition-colors">Home</button>
  //                     <button className="text-white hover:text-gray-300 transition-colors">Progress</button>
  //                     <button className="text-white hover:text-gray-300 transition-colors">Profile</button>
  //                 </div>
  //             </div>
  //         </nav>

  //         {/* Main Content */}
  //         <main className="max-w-7xl mx-auto px-6 py-12">
  //             <div className="text-center mb-12">
  //                 <h2 className="text-gray-900 mb-3">Choose Your Learning Path</h2>
  //                 <p className="text-gray-600">Select a category to start improving your English skills</p>
  //             </div>

  //             {/* Innovative Button Grid */}
  //             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  //                 {categories.map((category, index) => {
  //                     const Icon = category.icon;
  //                     return (
  //                         <motion.button
  //                             key={category.id}
  //                             onClick={() => handleCategoryClick(category.label)}
  //                             initial={{ opacity: 0, y: 20 }}
  //                             animate={{ opacity: 1, y: 0 }}
  //                             transition={{
  //                                 duration: 0.4,
  //                                 delay: index * 0.05,
  //                                 ease: "easeOut"
  //                             }}
  //                             whileHover={{
  //                                 scale: 1.05,
  //                                 rotate: 1,
  //                                 transition: { duration: 0.2 }
  //                             }}
  //                             whileTap={{ scale: 0.95 }}
  //                             className="group relative overflow-hidden rounded-2xl p-6 aspect-square flex flex-col items-center justify-center gap-4 transition-all duration-300 shadow-lg hover:shadow-2xl"
  //                             style={{
  //                                 backgroundColor: category.color,
  //                             }}
  //                         >
  //                             {/* Gradient Overlay on Hover */}
  //                             <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  //                             {/* Icon */}
  //                             <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
  //                                 <Icon className="w-12 h-12 text-white drop-shadow-lg" />
  //                             </div>

  //                             {/* Label */}
  //                             <span className="relative z-10 text-white text-center drop-shadow-md">
  //                                 {category.label}
  //                             </span>

  //                             {/* Animated Border */}
  //                             <motion.div
  //                                 className="absolute inset-0 rounded-2xl"
  //                                 style={{
  //                                     border: '3px solid rgba(255, 255, 255, 0.3)',
  //                                 }}
  //                                 initial={{ opacity: 0 }}
  //                                 whileHover={{ opacity: 1 }}
  //                                 transition={{ duration: 0.3 }}
  //                             />
  //                         </motion.button>
  //                     );
  //                 })}
  //             </div>
  //         </main>
  //     </div>
  // );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="menu-container">
        <div className="menu-content">
          <div className="menu-group">
            <span>Fale com IA</span>
            <span>FlashCards</span>
            <span>Gramática</span>
            <span>Reading</span>
            <span>Writing</span>
          </div>
          <div className="menu-group">
            <span>Fale com IA</span>
            <span>FlashCards</span>
            <span>Gramática</span>
            <span>Reading</span>
            <span>Writing</span>
          </div>
        </div>
      </div>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-gray-900">English Learning Platform</h1>
          <nav className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors hover:bg-gray-800">
              Home
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg transition-colors hover:bg-gray-200">
              Progress
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg transition-colors hover:bg-gray-200">
              Profile
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-2">Choose Your Learning Path</h2>
          <p className="text-gray-600">Select a category to start improving your English skills</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <button key={index} className={`botao-color`} style={{ color: '#FFF', backgroundColor: category.color, boxShadow: "0 4px 0 " + category.shadow }} title={category.label} onClick={() => handleCategoryClick(category.label.replaceAll(' ', ''))}>
                <Icon className="w-8 h-8" />
                <span className="text-center">{category.name}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}