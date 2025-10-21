// src/components/Grammar.jsx
import React, { useState } from 'react';
import QuizPage from './QuizPage'; // Importe a nova tela
import { BookOpen } from 'lucide-react'; // Ícone para os botões
import { div } from 'framer-motion/client';

// 44 TÓPICOS DO NÍVEL A1
const A1_TOPICS = [
    'Good morning, good afternoon, good evening', 'Asking and Saying the Name',
    'Nice to meet you', 'How are you?', 'Personal Pronouns',
    'Verb To Be Affirmative', 'Verb To Be Negative', 'Verb TO BE Interrogative',
    'Numbers 0-10', 'Alphabet', 'Tonic Syllable', 'Goodbye in English',
    "But I don't even know who you are", 'Where is it? Where is it?',
    'What’s his name?', 'Numbers 11-100', 'How to tell AGE',
    'Classroom Objects', 'Sound of SH and CH', 'Personal Information',
    'HOW + Objects', 'A / AN + "TH"', 'THE/WHAT', 'Colors + Order Adjectives',
    'People + Family', 'Simple Present Verbs', 'Negative/Interrogative',
    'Food/Beverage', 'Tell time', 'AM/PM + Morning, afternoon',
    'When and WHAT TIME', 'Letter H + PRICE + CURRENCY', 'WHO + Professions',
    'Places To Work', 'MONTHS /WHEN/BIRTHDAY', 'DO/WH/Questions',
    'Ordinal number', 'DATE + Letter Y', "CAN + CAN'T", 'Like + Dislike',
    'Adjectives + Verbs + Weather', 'Present Continuous',
    'Present C. Interrogative', 'MR. MRS. MS.', 'Hotel + There is/are',
    'THERE ARE Int. + Seats', 'ON + IN + AT', 'SOME/ANY/HOW',
    'The lot/s + Stations', 'BUT + VERY + J and G', 'Object Pronouns + Directions',
];


function GrammarPage({ setCurrentView }) { // setCurrentView é a função para voltar à tela principal
  // 1. ESTADO INTERNO: Controla se estamos na lista ou no quiz
  const [currentModuleView, setCurrentModuleView] = useState('lessonList');
  // 2. ESTADO DO TÓPICO: Rastreia qual lição foi selecionada
  const [selectedTopic, setSelectedTopic] = useState(null);
  

  const handleLessonClick = (topic) => {
    setSelectedTopic(topic);
    setCurrentModuleView('quiz'); // Mudar para a tela de quiz
  };

  // -----------------------------------------------------------
  // RENDERIZAÇÃO CONDICIONAL INTERNA
  // -----------------------------------------------------------
  if (currentModuleView === 'quiz' && selectedTopic) {
    return (
      <QuizPage 
        topic={selectedTopic} 
        setCurrentModuleView={setCurrentModuleView} // Passa função para voltar para a lista
      />
    );
  }

  // Se currentModuleView for 'lessonList', renderiza a lista de botões
  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-[#b82121]">Módulo: Gramática A1 (Básico)</h1>
        <button 
          onClick={() => setCurrentView('initial')} // Volta para a grade de módulos principal
          className="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
        >
          ← Voltar ao Início
        </button>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-8">Lições Nível A1 (Introdução)</h2>

      {/* GRID DE BOTÕES DE LIÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {A1_TOPICS.map((topic, index) => (
          <div>
            <button
                key={topic}
                onClick={() => handleLessonClick(topic)} // CLIQUE AQUI
                className="bg-white p-5 rounded-xl shadow-md border-b-4 border-[#b82121] text-left hover:bg-red-50 transition-colors flex items-center gap-4"
            >
                <BookOpen className="w-6 h-6 text-[#b82121]" />
                <div className="flex-1">
                    <span className="font-bold block text-lg text-gray-800">{index + 1}.</span>
                    <span className="font-semibold block text-lg text-gray-800">{topic}</span>
                </div>
            </button>
            <br />
          </div>
        ))}
      </div>
      
    </div>
  );
}

export default GrammarPage;