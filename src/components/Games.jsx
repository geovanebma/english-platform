import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";

import { ArrowLeft, Zap, Trophy, TrendingUp, RotateCcw } from "lucide-react";

import ModuleGuideButton from "./ModuleGuideButton";



const ROUND_BANK = [

  {

    id: "g1",

    sentence: "I need to ____ this report before 5 PM.",

    options: ["finish", "finishing", "finished"],

    correct: 0,

    level: 1,

  },

  {

    id: "g2",

    sentence: "She has a strong ____ in digital marketing.",

    options: ["background", "backside", "backpack"],

    correct: 0,

    level: 1,

  },

  {

    id: "g3",

    sentence: "Please ____ me know when you arrive.",

    options: ["let", "make", "allow"],

    correct: 0,

    level: 1,

  },

  {

    id: "g4",

    sentence: "The manager asked for a more ____ explanation.",

    options: ["detailed", "detailing", "detail"],

    correct: 0,

    level: 2,

  },

  {

    id: "g5",

    sentence: "We should ____ the risks before launching.",

    options: ["assess", "assessment", "assessingly"],

    correct: 0,

    level: 2,

  },

  {

    id: "g6",

    sentence: "Her argument was clear and very ____.",

    options: ["convincing", "convince", "conviction"],

    correct: 0,

    level: 2,

  },

  {

    id: "g7",

    sentence: "The final decision will ____ several factors.",

    options: ["depend on", "depend of", "depends in"],

    correct: 0,

    level: 3,

  },

  {

    id: "g8",

    sentence: "This policy aims to ____ long-term growth.",

    options: ["foster", "forster", "fosteringly"],

    correct: 0,

    level: 3,

  },

  {

    id: "g9",

    sentence: "His tone sounded polite but slightly ____.",

    options: ["detached", "detaching", "detach"],

    correct: 0,

    level: 3,

  },

];



const SESSION_ROUNDS = 10;



function ensureGames(progress) {

  const data = progress || {};

  if (!data.modules) data.modules = {};

  if (!data.modules.games) {

    data.modules.games = {

      high_score: 0,

      best_combo: 0,

      total_sessions: 0,

      total_correct: 0,

      last_level: 1,

    };

  }

  return data;

}



async function readProgress() {

  const res = await fetch("/api/progress", { cache: "no-store" });

  if (!res.ok) throw new Error("Falha ao ler progresso");

  const parsed = await res.json();

  return ensureGames(parsed);

}



async function writeProgress(nextProgress) {

  const res = await fetch("/api/progress", {

    method: "PUT",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(nextProgress),

  });

  if (!res.ok) throw new Error("Falha ao salvar progresso");

  const parsed = await res.json();

  return ensureGames(parsed);

}



function pickRound(level, usedIds, focusErrors = []) {

  const errorPool = ROUND_BANK.filter((r) => focusErrors.includes(r.id) && !usedIds.has(r.id));
  if (errorPool.length > 0) {
    return errorPool[Math.floor(Math.random() * errorPool.length)];
  }

  const pool = ROUND_BANK.filter((r) => r.level <= level && !usedIds.has(r.id));

  if (pool.length === 0) {

    const fallback = ROUND_BANK.filter((r) => r.level <= level);

    return fallback[Math.floor(Math.random() * fallback.length)];

  }

  return pool[Math.floor(Math.random() * pool.length)];

}



export default function Games({ setCurrentView, color = "#122987" }) {

  const [stage, setStage] = useState("home");

  const [roundIdx, setRoundIdx] = useState(0);

  const [round, setRound] = useState(null);

  const [timeLeft, setTimeLeft] = useState(8);

  const [score, setScore] = useState(0);

  const [combo, setCombo] = useState(0);

  const [bestComboRun, setBestComboRun] = useState(0);

  const [level, setLevel] = useState(1);

  const [sessionCorrect, setSessionCorrect] = useState(0);

  const [usedIds, setUsedIds] = useState(new Set());

  const [record, setRecord] = useState({

    high_score: 0,

    best_combo: 0,

    total_sessions: 0,

    total_correct: 0,

    last_level: 1,

  });



  useEffect(() => {

    let mounted = true;

    (async () => {

      try {

        const progress = await readProgress();

        if (!mounted) return;

        setRecord(progress.modules.games);

      } catch {

        if (!mounted) return;

      }

    })();

    return () => {

      mounted = false;

    };

  }, []);



  useEffect(() => {

    if (stage !== "playing") return;

    if (timeLeft <= 0) {

      handleWrong();

      return;

    }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);

    return () => clearTimeout(t);

  }, [timeLeft, stage]);



  const progressPercent = useMemo(

    () => Math.round((roundIdx / SESSION_ROUNDS) * 100),

    [roundIdx]

  );



  const loadNextRound = (nextLevel, currentUsed) => {

    const nextRound = pickRound(nextLevel, currentUsed);

    setRound(nextRound);

    setTimeLeft(Math.max(4, 8 - (nextLevel - 1)));

  };



  const startGame = () => {

    const cleanUsed = new Set();

    setStage("playing");

    setRoundIdx(0);

    setScore(0);

    setCombo(0);

    setBestComboRun(0);

    setLevel(1);

    setSessionCorrect(0);

    setUsedIds(cleanUsed);

    loadNextRound(1, cleanUsed);

  };



  const advance = (nextScore, nextCombo, nextLevel, nextCorrect, nextUsed, nextErrors = errorQueue) => {

    const nextIdx = roundIdx + 1;

    if (nextIdx >= SESSION_ROUNDS) {

      finishSession(nextScore, nextCombo, nextLevel, nextCorrect);

      return;

    }

    setRoundIdx(nextIdx);

    setScore(nextScore);

    setCombo(nextCombo);

    setBestComboRun((prev) => Math.max(prev, nextCombo));

    setLevel(nextLevel);

    setSessionCorrect(nextCorrect);

    setUsedIds(nextUsed);

    loadNextRound(nextLevel, nextUsed);

  };



  const handleWrong = () => {

    const nextUsed = new Set(usedIds);

    if (round?.id) nextUsed.add(round.id);

    const nextLevel = Math.max(1, level - 1);

    advance(score, 0, nextLevel, sessionCorrect, nextUsed);

  };



  const pickOption = (optionIdx) => {

    if (!round) return;

    const correct = optionIdx === round.correct;

    const nextUsed = new Set(usedIds);

    nextUsed.add(round.id);



    if (correct) {

      const nextCombo = combo + 1;

      const gained = 10 + nextCombo * 2 + level * 3;

      const nextScore = score + gained;

      const nextCorrect = sessionCorrect + 1;

      const nextLevel = nextCombo >= 3 ? Math.min(3, level + 1) : level;

      advance(nextScore, nextCombo, nextLevel, nextCorrect, nextUsed);

      return;

    }



    const nextLevel = Math.max(1, level - 1);

    advance(score, 0, nextLevel, sessionCorrect, nextUsed);

  };



  const finishSession = async (finalScore, finalCombo, finalLevel, finalCorrect) => {

    setStage("result");

    setScore(finalScore);

    const finalBestCombo = Math.max(bestComboRun, finalCombo);

    setBestComboRun(finalBestCombo);

    setLevel(finalLevel);

    setSessionCorrect(finalCorrect);



    try {

      const progress = await readProgress();

      const prev = progress.modules.games;

      const next = {

        high_score: Math.max(Number(prev.high_score || 0), finalScore),

        best_combo: Math.max(Number(prev.best_combo || 0), finalBestCombo),

        total_sessions: Number(prev.total_sessions || 0) + 1,

        total_correct: Number(prev.total_correct || 0) + finalCorrect,

        last_level: finalLevel,

      };

      progress.modules.games = next;

      await writeProgress(progress);

      setRecord(next);

    } catch {

      // no-op

    }

  };



  return (

    <section className="games-shell" style={{ "--games-theme": color }}>

      <header className="games-head">

        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>

          <ArrowLeft size={18} />

          {getUiLabel("common.back", "Back")}

        </button>

        <div>

          <div className="games-kicker">{getUiLabel("games.kicker", "ORIGINAL GAME MODE")}</div>

          <h1>Speed Context</h1>

        </div>

              <ModuleGuideButton moduleKey="games" color={color} />

</header>



      {stage === "home" && (

        <article className="games-home-card">

          <h2>Escolha a palavra certa antes do tempo acabar.</h2>

          <p>Quanto maior o combo, maior a pontuaÃ§Ã£o. Errou, combo zera e a dificuldade reduz.</p>



          <div className="games-stats">

            <span>{getUiLabel("games.record", "Record")}: {record.high_score}</span>

            <span>{getUiLabel("games.best_combo", "Best combo")}: {record.best_combo}</span>

            <span>{getUiLabel("games.sessions", "Sessions")}: {record.total_sessions}</span>

          </div>



          <button type="button" className="games-start-btn" onClick={startGame}>

            <Zap size={18} />

            ComeÃ§ar

          </button>

        </article>

      )}



      {stage === "playing" && round && (

        <article className="games-play-card">

          <div className="games-progress">

            <div className="games-progress-track">

              <div className="games-progress-fill" style={{ width: `${progressPercent}%` }} />

            </div>

            <span>

              {roundIdx + 1}/{SESSION_ROUNDS}

            </span>

          </div>



          <div className="games-live-stats">

            <span>{getUiLabel("games.score", "Score")}: {score}</span>

            <span>{getUiLabel("games.combo", "Combo")}: {combo}</span>

            <span>{getUiLabel("games.level", "Level")}: {level}</span>

            <span>{getUiLabel("games.time", "Time")}: {timeLeft}s</span>

          </div>



          <p className="games-sentence">{round.sentence}</p>



          <div className="games-options">

            {round.options.map((opt, idx) => (

              <button key={opt} type="button" className="games-option-btn" onClick={() => pickOption(idx)}>

                {opt}

              </button>

            ))}

          </div>

        </article>

      )}



      {stage === "result" && (

        <article className="games-result-card">

          <h2>SessÃ£o concluÃ­da</h2>

          <p>{getUiLabel("games.points", "Points")}: <strong>{score}</strong></p>

          <p>{getUiLabel("games.correct", "Correct")}: <strong>{sessionCorrect}</strong> {getUiLabel("games.of", "of")} {SESSION_ROUNDS}</p>

          <p>Melhor combo da sessÃ£o: <strong>{bestComboRun}</strong></p>

          <button type="button" className="games-start-btn" onClick={startGame}>

            {getUiLabel("games.play_again", "Play again")}

          </button>

        </article>

      )}

    </section>

  );

}




