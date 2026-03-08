import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Clock, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

export default function ReadingComprehension({ passage, questions, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const total = questions.length;

  // Timer: increments each second; cleared on unmount or when completed
  useEffect(() => {
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Store answer for a given question
  const selectAnswer = useCallback((qId, optionId) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionId }));
  }, []);

  // Submit results
  const handleSubmit = () => {
    clearInterval(timerRef.current);
    onComplete({ answers, time });
  };

  // Current question memoized for performance
  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  // Format time mm:ss
  const formattedTime = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-lg shadow-lg dark:bg-gray-800">
      {/* Header: timer + progress */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock size={16} />
          <span>{formattedTime}</span>
        </div>
        <div className="text-sm">
          Pergunta {currentIdx + 1} de {total}
        </div>
      </div>

      {/* Passage */}
      <section className="mb-6 p-4 bg-gray-800 rounded-md overflow-y-auto max-h-48 text-sm">
        {passage}
      </section>

      {/* Question */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{currentQuestion.title}</h2>
        <p className="text-sm text-gray-300 mb-4">{currentQuestion.text}</p>

        {/* Options as accessible buttons */}
        <ul
          role="listbox"
          aria-label="Opções de resposta"
          className="space-y-2"
        >
          {currentQuestion.options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                aria-selected={answers[currentQuestion.id] === opt.id}
                className={`
                  w-full text-left p-3 rounded-md border
                  ${answers[currentQuestion.id] === opt.id
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"}
                  transition-colors
                `}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
          disabled={currentIdx === 0}
          className="flex items-center px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
        >
          <ArrowLeft size={16} className="mr-1" />
          Anterior
        </button>

        {currentIdx < total - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIdx((i) => Math.min(i + 1, total - 1))}
            className="flex items-center px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500"
          >
            Próxima
            <ArrowRight size={16} className="ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center px-4 py-2 bg-green-600 rounded hover:bg-green-500"
          >
            <CheckCircle size={16} className="mr-1" />
            Enviar
          </button>
        )}
      </div>
    </div>
  );
}