tsx
import { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import {
  ArrowRight,
  CheckCircle,
  RefreshCw,
  XCircle,
  ChevronRight,
} from 'lucide-react';

const questions = [
  {
    id: 1,
    text: "Choose the correct form of the verb: 'She ____ to the store yesterday.'",
    options: [
      { id: 'a', text: 'goes' },
      { id: 'b', text: 'went' },
      { id: 'c', text: 'gone' },
      { id: 'd', text: 'going' },
    ],
    answerId: 'b',
  },
  {
    id: 2,
    text: "Select the synonym of 'happy'.",
    options: [
      { id: 'a', text: 'sad' },
      { id: 'b', text: 'joyful' },
      { id: 'c', text: 'angry' },
      { id: 'd', text: 'tired' },
    ],
    answerId: 'b',
  },
  {
    id: 3,
    text: 'Which sentence is grammatically correct?',
    options: [
      { id: 'a', text: "He don't like coffee." },
      { id: 'b', text: "He doesn't likes coffee." },
      { id: 'c', text: "He doesn't like coffee." },
      { id: 'd', text: "He not like coffee." },
    ],
    answerId: 'c',
  },
];

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  onSelect,
  showResult,
}: {
  question: typeof questions[0];
  selected: string | null;
  onSelect: (id: string) => void;
  showResult: boolean;
}) {
  // Highlight correct/incorrect after answer submission
  const getOptionStyle = (optId: string) => {
    if (!showResult) return selected === optId ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700';
    if (optId === question.answerId) return 'bg-green-600';
    if (selected === optId && optId !== question.answerId) return 'bg-red-600';
    return 'bg-gray-800';
  };

  return (
    <div className="flex-1">
      <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
      <ul className="space-y-3">
        {question.options.map((opt) => (
          <li key={opt.id}>
            <button
              onClick={() => onSelect(opt.id)}
              disabled={showResult}
              className={`
                w-full text-left px-4 py-3 rounded
                ${getOptionStyle(opt.id)} transition-colors
              `}
            >
              {opt.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultScreen({
  score,
  total,
  onRestart,
}: {
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const ratio = score / total;
  const level =
    ratio > 0.8 ? 'Advanced' : ratio > 0.5 ? 'Intermediate' : 'Beginner';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
      <p className="mb-4">
        Your score: {score} / {total}
      </p>
      <p className="mb-6">
        Estimated level:{' '}
        <span className="font-semibold underline">{level}</span>
      </p>
      <button
        onClick={onRestart}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        <RefreshCw className="w-5 h-5" />
        Restart Test
      </button>
    </div>
  );
}

export default function TestYourEnglishLevel() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false); // show feedback after selection

  const currentQuestion = useMemo(() => questions[currentIdx], [currentIdx]);

  // Handle keyboard navigation (Enter to select, ArrowRight to next)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'ArrowRight' && !showResult && selected) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler as any);
    return () => window.removeEventListener('keydown', handler as any);
  }, [selected, showResult, finished]);

  const handleOptionSelect = (id: string) => setSelected(id);

  const handleSubmit = () => {
    if (!selected) return;
    // Update score if correct
    if (selected === currentQuestion.answerId) setScore((s) => s + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelected(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setScore(0);
    setFinished(false);
    setSelected(null);
    setShowResult(false);
  };

  if (finished) {
    return <ResultScreen score={score} total={questions.length} onRestart={handleRestart} />;
  }

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-6">
      <ProgressBar progress={progress} />

      <QuestionCard
        question={currentQuestion}
        selected={selected}
        onSelect={handleOptionSelect}
        showResult={showResult}
      />

      {/* Navigation */}
      <div className="mt-6 flex justify-end space-x-3">
        {showResult && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            <ChevronRight className="w-5 h-5" />
            {currentIdx + 1 === questions.length ? 'Finish' : 'Next'}
          </button>
        )}
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className={`
              flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded
              ${selected === null ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Submit
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}