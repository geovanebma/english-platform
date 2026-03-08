// src/components/QuizPage.jsx
import React from 'react';

// Recebe o tópico selecionado e a função para voltar
function QuizPage({ topic, setCurrentModuleView }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <button 
        onClick={() => setCurrentModuleView('lessonList')} // Volta para a lista de lições
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors mb-8"
      >
        ← Voltar para A1 - Lições
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{topic}</h1>
      <p className="text-gray-600 mb-8">
        Teste seus conhecimentos sobre "{topic}"! Escolha a melhor opção para cada pergunta.
      </p>

      {/* Área de Questões (Simulação) */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <p className="font-semibold text-lg mb-4">Questão 1: Complete a frase:</p>
            <p className="font-bold mb-4">"I ____ a teacher."</p>
            
            <div className="space-y-3">
                <button className="w-full text-left p-3 border border-duo-green-light rounded-lg hover:bg-duo-green-lighter transition-colors">am</button>
                <button className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">is</button>
                <button className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">are</button>
            </div>
        </div>
        {/* Adicione mais questões aqui no futuro */}
      </div>

    </div>
  );
}

export default QuizPage;