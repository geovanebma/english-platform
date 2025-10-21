import React from 'react';

function FlashcardsSessionResults({ results, deckName, onRestart }) {
  const summary = results.reduce((acc, answer) => {
    acc[answer.rating] = (acc[answer.rating] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-center">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Sessão Concluída!</h1>
      <p className="text-xl text-gray-600 mb-8">Ótimo trabalho na revisão do deck <strong>{deckName}</strong>.</p>
      
      <div className="bg-white p-8 rounded-xl shadow-lg border w-full max-w-md mx-auto mb-10">
        <h2 className="text-2xl font-bold mb-6">Seu Desempenho:</h2>
        <div className="space-y-3 text-left">
          <p className="text-lg font-medium"><span className="text-green-500 font-bold">Fácil:</span> {summary.easy || 0} cartões</p>
          <p className="text-lg font-medium"><span className="text-blue-500 font-bold">Médio:</span> {summary.medium || 0} cartões</p>
          <p className="text-lg font-medium"><span className="text-orange-500 font-bold">Difícil:</span> {summary.hard || 0} cartões</p>
          <p className="text-lg font-medium"><span className="text-red-500 font-bold">Repetir:</span> {summary.too_hard || 0} cartões</p>
        </div>
      </div>

      <button onClick={onRestart} className="bg-[#ed5215] text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-md">
        Voltar ao Menu
      </button>
    </div>
  );
}

export default FlashcardsSessionResults;
