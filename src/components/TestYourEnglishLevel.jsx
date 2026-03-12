import React, { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const BLOCKS = [

  {

    key: "listening",

    title: "Listening",

    questions: [

      {

        id: "l1",

        prompt: "You hear: 'The meeting starts at quarter to nine.' What time is it?",

        options: ["8:15", "8:45", "9:15"],

        answer: 1,

      },

      {

        id: "l2",

        prompt: "You hear: 'I would rather stay home tonight.' Meaning?",

        options: ["The person prefers going out", "The person prefers staying home", "The person is unsure"],

        answer: 1,

      },

    ],

  },

  {

    key: "reading",

    title: "Reading",

    questions: [

      {

        id: "r1",

        prompt: "Choose the sentence with correct grammar.",

        options: ["She don't like coffee.", "She doesn't like coffee.", "She doesn't likes coffee."],

        answer: 1,

      },

      {

        id: "r2",

        prompt: "Best synonym for 'reliable':",

        options: ["Uncertain", "Trustworthy", "Temporary"],

        answer: 1,

      },

    ],

  },

  {

    key: "speaking",

    title: "Speaking",

    questions: [

      {

        id: "s1",

        prompt: "Best response in a formal meeting:",

        options: ["Yeah, sure.", "Certainly, I can do that.", "No idea."],

        answer: 1,

      },

      {

        id: "s2",

        prompt: "Most natural request:",

        options: ["Pass me that now.", "Could you pass me that, please?", "Give that."],

        answer: 1,

      },

    ],

  },

  {

    key: "writing",

    title: "Writing",

    questions: [

      {

        id: "w1",

        prompt: "Best improved sentence:",

        options: [

          "I need help with this thing.",

          "I require assistance with this task.",

          "Help this now me.",

        ],

        answer: 1,

      },

      {

        id: "w2",

        prompt: "Choose the clearest email line:",

        options: [

          "Send maybe later.",

          "Could you send the report by 4 PM today?",

          "Report need now",

        ],

        answer: 1,

      },

    ],

  },

];



function ensureLevelTest(progress) {

  const data = progress || {};

  if (!data.modules) data.modules = {};

  if (!data.modules.test_english_level) {

    data.modules.test_english_level = {

      last_result: null,

      attempts: 0,

    };

  }

  return data;

}



async function readProgress() {

  const res = await fetch("/api/progress", { cache: "no-store" });

  if (!res.ok) throw new Error("Falha ao ler progresso");

  const parsed = await res.json();

  return ensureLevelTest(parsed);

}



async function writeProgress(nextProgress) {

  const res = await fetch("/api/progress", {

    method: "PUT",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(nextProgress),

  });

  if (!res.ok) throw new Error("Falha ao salvar progresso");

  const parsed = await res.json();

  return ensureLevelTest(parsed);

}



function estimateCEFR(scorePercent) {

  if (scorePercent < 25) return "A1";

  if (scorePercent < 40) return "A2";

  if (scorePercent < 55) return "B1";

  if (scorePercent < 70) return "B2";

  if (scorePercent < 85) return "C1";

  return "C2";

}



function downloadJson(data, filename) {

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);

}



function openPrintableReport(result) {

  const html = `

    <html>

      <head><title>English Level Report</title></head>

      <body style="font-family: DIN Round Pro, sans-serif; font-weight: 500; padding: 24px;">

        <h1>English Level Report</h1>

        <p><strong>Date:</strong> ${result.date}</p>

        <p><strong>Final Score:</strong> ${result.final_score}%</p>

        <p><strong>Estimated Level:</strong> ${result.cefr_level}</p>

        <h2>Skill Statistics</h2>

        <ul>

          <li>Listening: ${result.skills.listening}%</li>

          <li>Reading: ${result.skills.reading}%</li>

          <li>Speaking: ${result.skills.speaking}%</li>

          <li>Writing: ${result.skills.writing}%</li>

        </ul>

      </body>

    </html>`;

  const win = window.open("", "_blank");

  if (!win) return;

  win.document.write(html);

  win.document.close();

  win.focus();

  win.print();

}



export default function TestYourEnglishLevel({ setCurrentView, color = "#606160" }) {

  const [blockIndex, setBlockIndex] = useState(0);

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selected, setSelected] = useState(null);

  const [answers, setAnswers] = useState({});

  const [result, setResult] = useState(null);



  const currentBlock = BLOCKS[blockIndex];

  const currentQuestion = currentBlock.questions[questionIndex];

  const totalQuestions = BLOCKS.reduce((acc, b) => acc + b.questions.length, 0);

  const answeredCount = Object.keys(answers).length;

  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);



  const skillPercents = useMemo(() => {

    const map = {};

    BLOCKS.forEach((block) => {

      const correct = block.questions.reduce((acc, q) => {

        return acc + (answers[q.id] === q.answer ? 1 : 0);

      }, 0);

      map[block.key] = Math.round((correct / block.questions.length) * 100);

    });

    return map;

  }, [answers]);



  const next = async (answersSnapshot) => {

    setSelected(null);



    const isLastQuestionInBlock = questionIndex >= currentBlock.questions.length - 1;

    const isLastBlock = blockIndex >= BLOCKS.length - 1;



    if (!isLastQuestionInBlock) {

      setQuestionIndex((i) => i + 1);

      return;

    }



    if (!isLastBlock) {

      setBlockIndex((i) => i + 1);

      setQuestionIndex(0);

      return;

    }



    const finalSkills = {};

    BLOCKS.forEach((block) => {

      const correct = block.questions.reduce((acc, q) => acc + (answersSnapshot[q.id] === q.answer ? 1 : 0), 0);

      finalSkills[block.key] = Math.round((correct / block.questions.length) * 100);

    });

    const finalScore = Math.round(

      Object.values(finalSkills).reduce((a, b) => Number(a) + Number(b), 0) / BLOCKS.length

    );

    const cefr = estimateCEFR(finalScore);

    const finalResult = {

      date: new Date().toISOString(),

      final_score: finalScore,

      cefr_level: cefr,

      skills: finalSkills,

    };

    setResult(finalResult);



    try {

      const progress = await readProgress();

      const prevAttempts = Number(progress.modules.test_english_level.attempts || 0);

      progress.modules.test_english_level = {

        last_result: finalResult,

        attempts: prevAttempts + 1,

      };

      await writeProgress(progress);

    } catch {

      // no-op

    }

  };



  const verify = async () => {

    if (selected === null) return;

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };

    setAnswers(nextAnswers);

    await next(nextAnswers);

  };



  if (result) {

    return (

      <section className="testlevel-shell" style={{ "--testlevel-theme": color }}>

        <header className="testlevel-head">

          <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>

            <ArrowLeft size={18} />

            Voltar

          </button>

          <div>

            <div className="testlevel-kicker">LEVEL RESULT</div>

            <h1>Your English Level</h1>

          </div>

                <ModuleGuideButton moduleKey="testlevel" color={color} />

</header>



        <article className="testlevel-result-card">

          <h2>Resultado final</h2>

          <p>

            Nota final: <strong>{result.final_score}%</strong>

          </p>

          <p>

            Nivel estimado: <strong>{result.cefr_level}</strong>

          </p>



          <div className="testlevel-skill-grid">

            {Object.entries(result.skills).map(([key, val]) => (

              <div key={key} className="testlevel-skill-item">

                <span>{key}</span>

                <strong>{val}%</strong>

              </div>

            ))}

          </div>



          <div className="testlevel-actions">

            <button

              type="button"

              className="testlevel-primary-btn"

              onClick={() => downloadJson(result, "english-level-result.json")}

            >

              <Download size={16} />

              Baixar JSON

            </button>

            <button type="button" className="testlevel-secondary-btn" onClick={() => openPrintableReport(result)}>

              Baixar PDF simples

            </button>

          </div>

        </article>

      </section>

    );

  }



  return (

    <section className="testlevel-shell" style={{ "--testlevel-theme": color }}>

      <header className="testlevel-head">

        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>

          <ArrowLeft size={18} />

          Voltar

        </button>

        <div>

          <div className="testlevel-kicker">ENGLISH LEVEL TEST</div>

          <h1>Assessment</h1>

        </div>

      </header>



      <article className="testlevel-card">

        <div className="testlevel-progress">

          <div className="testlevel-progress-track">

            <div className="testlevel-progress-fill" style={{ width: `${progressPercent}%` }} />

          </div>

          <span>

            {answeredCount}/{totalQuestions}

          </span>

        </div>



        <div className="testlevel-block-pill">{currentBlock.title}</div>

        <h2>{currentQuestion.prompt}</h2>



        <div className="testlevel-options">

          {currentQuestion.options.map((opt, idx) => (

            <button

              type="button"

              key={`${currentQuestion.id}_${idx}`}

              className={`testlevel-option-btn ${selected === idx ? "is-picked" : ""}`}

              onClick={() => setSelected(idx)}

            >

              {opt}

            </button>

          ))}

        </div>



        <div className="testlevel-actions">

          <button type="button" className="testlevel-primary-btn" onClick={verify} disabled={selected === null}>

            Verificar

          </button>

        </div>



        <div className="testlevel-skill-preview">

          <span>Listening {skillPercents.listening || 0}%</span>

          <span>Reading {skillPercents.reading || 0}%</span>

          <span>Speaking {skillPercents.speaking || 0}%</span>

          <span>Writing {skillPercents.writing || 0}%</span>

        </div>

      </article>

    </section>

  );

}



