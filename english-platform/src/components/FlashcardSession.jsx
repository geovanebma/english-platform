import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

function FlashcardSession({ deck, deckName, onSessionComplete, color}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answers, setAnswers] = useState([]);

  // Usamos useMemo para embaralhar o deck apenas uma vez
  const shuffledDeck = useMemo(() => deck.sort(() => Math.random() - 0.5), [deck]);
  const currentCard = shuffledDeck[currentIndex];

  const handleRating = (rating) => {
    const newAnswers = [...answers, { cardId: currentCard.id, rating }];
    setAnswers(newAnswers);

    if (currentIndex < shuffledDeck.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      onSessionComplete(newAnswers); // Sessão concluída
    }
  };

  const progress = ((currentIndex + 1) / shuffledDeck.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Barra de Progresso */}
      <div className="w-full max-w-2xl mb-4">
        <div className="bg-gray-200 rounded-full h-2.5">
          <div className="bg-[#ed5215] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-center font-bold mt-2 text-gray-600">{currentIndex + 1} / {shuffledDeck.length}</p>
      </div>

      <motion.div
            className="w-full max-w-2xl h-80 rounded-2xl shadow-xl cursor-pointer text-center flex flex-col justify-center items-center p-6"
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: 'preserve-3d', backgroundColor: isFlipped ? color : color }}
        >
            {/* FACE FRONTAL (Inglês) */}
            <motion.div 
                style={{ display: isFlipped ? 'none' : 'inline-block' }} 
                className="absolute inset-0 flex flex-col justify-center items-center p-6"
            >
                <p className="text-gray-500 text-sm mb-2">{currentCard.topic}</p>
                <p className="text-3xl font-bold text-gray-800">{currentCard.front}</p>
            </motion.div>
            
            {/* FACE TRASEIRA (Português) - PRECISA ROTACIONAR PARA MOSTRAR */}
            <motion.div 
                // Aplicamos a rotação inicial de 180 graus (para que comece virada para trás)
                // Usamos o 'isFlipped' para controlar a rotação final.
                style={{ display: isFlipped ? 'inline-block' : 'none', transform: `rotateY(${isFlipped ? 180 : 0}deg)` }} 
                className="absolute inset-0 flex justify-center items-center p-6"
            >
                <p className="text-3xl font-bold text-green-700">{currentCard.back}</p>
            </motion.div>
        </motion.div>

      {/* Botões de Dificuldade (SRS) */}
      {isFlipped && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-2xl">
          <button onClick={() => handleRating('easy')} className="p-4 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600">Fácil</button>
          <button onClick={() => handleRating('medium')} className="p-4 bg-blue-500 text-white font-bold rounded-lg shadow-md hover:bg-blue-600">Médio</button>
          <button onClick={() => handleRating('hard')} className="p-4 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600">Difícil</button>
          <button onClick={() => handleRating('too_hard')} className="p-4 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600">Repetir</button>
        </motion.div>
      )}
    </div>
  );
}

export default FlashcardSession;
