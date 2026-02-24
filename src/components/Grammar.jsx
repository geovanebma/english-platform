import { useState, useCallback, memo } from "react";
import QuizPage from "./QuizPage";
import { BookOpen, ArrowLeft } from "lucide-react";

const A1_TOPICS = [
  "Good morning, good afternoon, good evening",
  "Asking and Saying the Name",
  "Nice to meet you",
  "How are you?",
  "Personal Pronouns",
  "Verb To Be Affirmative",
  "Verb To Be Negative",
  "Verb TO BE Interrogative",
  "Numbers 0-10",
  "Alphabet",
  "Tonic Syllable",
  "Goodbye in English",
  "But I don't even know who you are",
  "Where is it? Where is it?",
  "What’s his name?",
  "Numbers 11-100",
  "How to tell AGE",
  "Classroom Objects",
  "Sound of SH and CH",
  "Personal Information",
  "HOW + Objects",
  "A / AN + \"TH\"",
  "THE/WHAT",
  "Colors + Order Adjectives",
  "People + Family",
  "Simple Present Verbs",
  "Negative/Interrogative",
  "Food/Beverage",
  "Tell time",
  "AM/PM + Morning, afternoon",
  "When and WHAT TIME",
  "Letter H + PRICE + CURRENCY",
  "WHO + Professions",
  "Places To Work",
  "MONTHS /WHEN/BIRTHDAY",
  "DO/WH/Questions",
  "Ordinal number",
  "DATE + Letter Y",
  "CAN + CAN'T",
  "Like + Dislike",
  "Adjectives + Verbs + Weather",
  "Present Continuous",
  "Present C. Interrogative",
  "MR. MRS. MS.",
  "Hotel + There is/are",
  "THERE ARE Int. + Seats",
  "ON + IN + AT",
  "SOME/ANY/HOW",
  "The lot/s + Stations",
  "BUT + VERY + J and G",
  "Object Pronouns + Directions",
];

const TopicCard = memo(function TopicCard({ index, title, onSelect }) {
  return (
    <button
      onClick={() => onSelect(title)}
      aria-label={`Abrir quiz da lição ${title}`}
      className="group w-full bg-white dark:bg-gray-800 p-5 rounded-xl border-b-4 border-red-700 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-4 text-left"
    >
      <BookOpen className="w-6 h-6 text-red-700 flex-shrink-0 group-hover:text-red-900 transition-colors" />
      <div className="flex-1">
        <span className="font-bold text-lg text-gray-600 dark:text-gray-400">
          {index + 1}.
        </span>
        <span className="font-semibold text-lg">{title}</span>
      </div>
    </button>
  );
});

export default function GrammarPage({ setCurrentView }) {
  const [view, setView] = useState("list"); // 'list' | 'quiz'
  const [topic, setTopic] = useState(null);

  // abre o quiz da lição selecionada
  const openQuiz = useCallback((t) => {
    setTopic(t);
    setView("quiz");
  }, []);

  if (view === "quiz" && topic) {
    return (
      <QuizPage
        topic={topic}
        setCurrentModuleView={setView}
      />
    );
  }

  return (
    <section className="max-w-6xl mx-auto py-12 px-6 text-gray-900 dark:text-gray-100">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-red-700 dark:text-red-400">
          Módulo: Gramática A1 (Básico)
        </h1>
        <button
          onClick={() => setCurrentView("initial")}
          className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao Início
        </button>
      </header>

      <h2 className="text-2xl font-bold mb-8">Lições Nível A1 (Introdução)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {A1_TOPICS.map((title, idx) => (
          <TopicCard
            key={title}
            index={idx}
            title={title}
            onSelect={openQuiz}
          />
        ))}
      </div>
    </section>
  );
}