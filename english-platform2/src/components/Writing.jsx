import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

export default function Writing() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const textareaRef = useRef(null);

  const handleSubmit = useCallback(async () => {
    if (!answer.trim()) return;
    setLoading(true);
    // Simula chamada à API de avaliação
    const result = await new Promise((res) =>
      setTimeout(
        () => res({ score: Math.round(Math.random() * 100), message: "Great job!" }),
        1500
      )
    );
    setFeedback(result);
    setLoading(false);
  }, [answer]);

  // Auto‑ajusta altura do textarea ao digitar
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [answer]);

  return (
    <section className="max-w-2xl mx-auto p-6 space-y-6 bg-gray-900 text-gray-100 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold">Writing Practice</h2>

      {/* Prompt */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <label htmlFor="prompt" className="block text-sm font-medium mb-2">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-gray-700 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          placeholder="Enter a writing prompt..."
        />
      </div>

      {/* Answer */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <label htmlFor="answer" className="block text-sm font-medium mb-2">
          Your answer
        </label>
        <textarea
          id="answer"
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full bg-gray-700 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden"
          placeholder="Start writing..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : (
            <Send className="mr-2" size={16} />
          )}
          Submit
        </button>

        {feedback && (
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="text-green-400" size={16} />
            <span>{`Score: ${feedback.score}% – ${feedback.message}`}</span>
          </div>
        )}
      </div>
    </section>
  );
}