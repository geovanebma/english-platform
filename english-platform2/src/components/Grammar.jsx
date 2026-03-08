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
        <div className="R7x3_ _8Iu6E" style="left: 0px; margin-bottom: 0px; margin-top: 11.8533px;">
          <div className="HPdUG fF_qH" role="button" tabindex="0">
            <svg className="_2FMGJ" viewBox="0 0 100 100">
              <g transform="translate(50, 50)">
                <path d="M3.061616997868383e-15,-50A50,50,0,1,1,-3.061616997868383e-15,50A50,50,0,1,1,3.061616997868383e-15,-50M-7.715274834628325e-15,-42A42,42,0,1,0,7.715274834628325e-15,42A42,42,0,1,0,-7.715274834628325e-15,-42Z" fill="rgb(var(--color-swan))"></path>
                <circle clip-path="url(#clip-session/ProgressRing5)" cx="-3.9949609477190866" cy="-45.82619651494328" fill="rgb(var(--color-snow))" r="4"></circle>
                <path d="M3.061616997868383e-15,-50L2.5717582782094417e-15,-42Z" fill="var(--path-unit-character-color)"></path>
              </g>
            </svg>
            <p>aaa</p>
            <div className="_1xsb4 _2t1Sd Fw74a">
              <button className="_1gEmM _7jW2t _1333i _22TV_ _3Jm09" data-test="skill-path-level-4 skill-path-level-practice" aria-label="Practice">
                <img className="_1B6UH" draggable="false" src="https://d35aaqx5ub95lt.cloudfront.net/images/path/icons/fc078bfeb8d2d1b1146e9b17d8f12d8e.svg" />
              </button>
              <div aria-hidden="true" className="_2nwbo">
                <div>
                  <div>
                    <div className="_3zpnU _37pE2 _1o3g5 _kJVz" style="z-index: 1;">
                      <div className="_36bu_ _27IMa">COMEÇAR</div><div className="_3T97b">
                        <div className="_1TMn5 YxHCU">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* {A1_TOPICS.map((title, idx) => (
          <TopicCard
            key={title}
            index={idx}
            title={title}
            onSelect={openQuiz}
          />
        ))} */}
      </div>
    </section>
  );
}