import React, { useState } from 'react';
import { A1_FLASHCARDS } from '../data/flashcardsData';
import FlashcardSession from './FlashcardSession';
import SessionResults from './FlashcardsSessionResults';
import { Layers, Star } from 'lucide-react';

/* Configurações dos decks – facilita adição futura */
const decks = [
  {
    id: 'A1',
    name: 'Nível A1 – Básico',
    icon: Layers,
    data: A1_FLASHCARDS,
    available: true,
  },
  {
    id: 'A2',
    name: 'Nível A2 – Em Breve',
    icon: Layers,
    data: [],
    available: false,
  },
  {
    id: 'my',
    name: 'Minhas Frases – Em Breve',
    icon: Star,
    data: [],
    available: false,
  },
];

/* Botão reutilizável para cada deck */
const DeckButton = ({ deck, onSelect }) => {
  const Icon = deck.icon;
  const baseCls =
    'p-6 rounded-xl shadow-md border-b-4 text-left transition-colors';
  const enabledCls =
    'bg-white dark:bg-gray-800 border-primary hover:bg-primary/5 cursor-pointer';
  const disabledCls =
    'bg-gray-100 dark:bg-gray-700 border-gray-300 text-gray-500 cursor-not-allowed opacity-50';

  return (
    <button
      type="button"
      onClick={() => deck.available && onSelect(deck.data, deck.id)}
      disabled={!deck.available}
      className={`${baseCls} ${deck.available ? enabledCls : disabledCls}`}
    >
      <Icon className="w-8 h-8 mb-3 text-primary dark:text-primary-light" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {deck.name}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">{deck.data.length} cartões</p>
    </button>
  );
};

/* Controlador principal – troca entre seleção, sessão e resultados */
export default function Flashcards({ setCurrentView, color }) {
  const [view, setView] = useState('deckSelection');
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
  };

  return (
    <>
      {view === 'deckSelection' && (
        <section className="max-w-4xl mx-auto py-12 px-6">
          <h1 className="text-4xl font-extrabold text-primary mb-8 dark:text-primary-light">
            Flashcards
          </h1>
          <p className="text-lg text-gray-600 mb-10 dark:text-gray-300">
            Selecione um conjunto de cartões para começar a revisar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {decks.map((deck) => (
              <DeckButton key={deck.id} deck={deck} onSelect={handleDeckSelect} />
            ))}
          </div>
        </section>
      )}

      {view === 'session' && (
        <FlashcardSession
          deck={selectedDeck}
          deckName={deckName}
          onSessionComplete={handleSessionComplete}
          color={color}
        />
      )}

      {view === 'results' && (
        <SessionResults
          results={sessionResults}
          deckName={deckName}
          onRestart={handleRestart}
          color={color}
        />
      )}
    </>
  );
}