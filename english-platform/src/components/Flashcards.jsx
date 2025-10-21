import React, { useState } from 'react';
import { A1_FLASHCARDS } from '../data/flashcardsData';
import FlashcardSession from './FlashcardSession';
import SessionResults from './FlashcardsSessionResults';
import { CreditCard, Star, Layers } from 'lucide-react';

// Menu de seleção de decks (níveis)
const DeckSelection = ({ onDeckSelect }) => (
  <div className="max-w-4xl mx-auto py-12 px-6">
    <h1 className="text-4xl font-extrabold text-[#ed5215] mb-8">Flashcards</h1>
    <p className="text-lg text-gray-600 mb-10">Selecione um conjunto de cartões para começar a revisar.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button onClick={() => onDeckSelect(A1_FLASHCARDS, 'A1')} className="bg-white p-6 rounded-xl shadow-md border-b-4 border-[#ed5215] hover:bg-orange-50 transition-colors text-left">
        <Layers className="w-8 h-8 text-[#ed5215] mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">Nível A1 - Básico</h2>
        <p className="text-gray-600">{A1_FLASHCARDS.length} cartões</p>
      </button>
      <button className="bg-gray-100 p-6 rounded-xl shadow-sm border-b-4 border-gray-300 text-left cursor-not-allowed opacity-50">
        <Layers className="w-8 h-8 text-gray-400 mb-3" />
        <h2 className="text-2xl font-bold text-gray-500">Nível A2 - Em Breve</h2>
        <p className="text-gray-500">0 cartões</p>
      </button>
       <button className="bg-gray-100 p-6 rounded-xl shadow-sm border-b-4 border-gray-300 text-left cursor-not-allowed opacity-50">
        <Star className="w-8 h-8 text-gray-400 mb-3" />
        <h2 className="text-2xl font-bold text-gray-500">Minhas Frases - Em Breve</h2>
        <p className="text-gray-500">0 cartões</p>
      </button>
    </div>
  </div>
);

// Componente principal que controla a navegação
function Flashcards({ setCurrentView, color }) {
  const [view, setView] = useState('deckSelection'); // 'deckSelection', 'session', 'results'
  const [selectedDeck, setSelectedDeck] = useState([]);
  const [deckName, setDeckName] = useState('');
  const [sessionResults, setSessionResults] = useState(null);

  const handleDeckSelect = (deck, name) => {
    setSelectedDeck(deck);
    setDeckName(name);
    setView('session');
  };

  const handleSessionComplete = (results) => {
    setSessionResults(results);
    setView('results');
  };

  const handleRestart = () => {
    setView('deckSelection');
    setSessionResults(null);
  }

  // Renderização condicional
  if (view === 'session') {
    return <FlashcardSession deck={selectedDeck} deckName={deckName} onSessionComplete={handleSessionComplete} color={color} />;
  }
  
  if (view === 'results') {
    return <SessionResults results={sessionResults} deckName={deckName} onRestart={handleRestart} color={color} />;
  }

  return <DeckSelection onDeckSelect={handleDeckSelect} />;
}

export default Flashcards;
