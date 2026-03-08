import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, X, ArrowRight, RefreshCw, SkipForward } from "lucide-react";

export default function TranslationPractice() {
  // ---------- Dados ----------
  const defaultPhrases = useMemo(
    () => [
      { id: 1, english: "Good morning", portuguese: "Bom dia" },
      { id: 2, english: "How are you?", portuguese: "Como você está?" },
      { id: 3, english: "I love programming", portuguese: "Eu adoro programar" },
    ],
    []
  );

  const [phrases, setPhrases] = useState(() => {
    // tenta carregar do localStorage; fallback para mock
    const saved = localStorage.getItem("tp_phrases");
    return saved ? JSON.parse(saved) : defaultPhrases;
  });

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null | true | false
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem("tp_score");
    return saved ? JSON.parse(saved) : 0;
  });

  // ---------- Efeitos ----------
  useEffect(() => {
    // limpa input e resultado ao mudar a frase
    setInput("");
    setResult(null);
  }, [index]);

  useEffect(() => {
    // persiste progresso
    localStorage.setItem("tp_score", JSON.stringify(score));
    localStorage.setItem("tp_phrases", JSON.stringify(phrases));
  }, [score, phrases]);

  // ---------- Funções ----------
  const normalize = (str) =>
    str
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  const handleCheck = useCallback(() => {
    const correct = normalize(phrases[index].portuguese);
    const userAns = normalize(input);
    const isCorrect = correct === userAns;
    setResult(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
  }, [phrases, index, input]);

  const handleNext = useCallback(() => {
    setIndex((i) => (i + 1) % phrases.length);
  }, [phrases.length]);

  const handleSkip = useCallback(() => {
    setResult(false); // marca como errada e avança
    handleNext();
  }, [handleNext]);

  const handleReset = useCallback(() => {
    setIndex(0);
    setScore(0);
    setPhrases(defaultPhrases);
  }, [defaultPhrases]);

  // ---------- Render ----------
  const progress = ((score / phrases.length) * 100).toFixed(0);

  return (
    <section className="max-w-xl mx-auto p-6 bg-gray-900 text-gray-100 rounded-lg shadow-lg dark:bg-gray-800">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Translation Practice</h2>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-gray-400 hover:text-red-400"
          aria-label="Resetar prática"
        >
          <RefreshCw size={16} />
          Reset
        </button>
      </header>

      {/* barra de progresso */}
      <div className="w-full bg-gray-700 rounded h-2 mb-4 overflow-hidden">
        <div
          className="bg-green-500 h-full transition-width duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span>
          Score: {score}/{phrases.length}
        </span>
        <span>{progress}% concluído</span>
      </div>

      <p className="text-xl font-medium mb-4">{phrases[index].english}</p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Digite a tradução..."
        className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
        disabled={result !== null}
        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        aria-label="Campo de resposta"
      />

      <div className="flex items-center mt-4 gap-4">
        {result === null ? (
          <>
            <button
              onClick={handleCheck}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
              disabled={!input.trim()}
              aria-label="Verificar resposta"
            >
              Check
              <Check size={18} />
            </button>
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
              aria-label="Pular frase"
            >
              Skip
              <SkipForward size={18} />
            </button>
          </>
        ) : (
          <>
            <span
              className={`flex items-center gap-2 ${
                result ? "text-green-400" : "text-red-400"
              }`}
            >
              {result ? <Check size={18} /> : <X size={18} />}
              {result
                ? "Correct!"
                : `Wrong. Correct: "${phrases[index].portuguese}"`}
            </span>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
              aria-label="Próxima frase"
            >
              Next
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}