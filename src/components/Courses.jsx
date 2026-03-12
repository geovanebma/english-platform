import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GraduationCap, Layers3, CheckCircle2, Circle } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const COURSES_DATA = [
  {
    id: "course_everyday",
    title: "English for Daily Life",
    level: "Beginner",
    description: "Conversas prÃ¡ticas para situaÃ§Ãµes comuns do dia a dia.",
    modules: [
      {
        id: "daily_m1",
        title: "Introductions and Basics",
        lessons: [
          {
            id: "daily_m1_l1",
            title: "Presenting Yourself",
            content: `Goal:
VocÃª vai aprender a se apresentar com naturalidade em inglÃªs.

Key points:
- Name, age, city and occupation.
- Perguntas rÃ¡pidas para iniciar conversa.
- Estrutura simples no present tense.

Practice:
1. Write 5 lines introducing yourself.
2. Pergunte o nome de uma pessoa e responda.
3. Monte um mini diÃ¡logo de 6 falas.

Checklist:
- Use "My name is..." corretamente.
- Use "I am from..." corretamente.
- FaÃ§a uma pergunta de retorno.`
          },
          {
            id: "daily_m1_l2",
            title: "Polite Interactions",
            content: `Goal:
Usar frases educadas para pedir e agradecer.

Key points:
- Please, thank you, excuse me, sorry.
- Pedidos curtos e objetivos.
- Respostas positivas e negativas com educaÃ§Ã£o.

Practice:
1. Reescreva 5 pedidos deixando-os mais educados.
2. Treine variaÃ§Ãµes de agradecimento.
3. FaÃ§a um diÃ¡logo de loja com 8 falas.`
          },
        ],
      },
      {
        id: "daily_m2",
        title: "Routines and Time",
        lessons: [
          {
            id: "daily_m2_l1",
            title: "Talking About Your Day",
            content: `Goal:
Falar sobre rotina diÃ¡ria com clareza.

Key points:
- HorÃ¡rios e frequÃªncia (always, usually, sometimes).
- Verbos comuns de rotina.
- Conectores: then, after that, finally.

Practice:
1. Escreva sua rotina da manhÃ£ em 8 frases.
2. Grave Ã¡udio lendo as frases.
3. Transforme 3 frases em perguntas.`
          },
          {
            id: "daily_m2_l2",
            title: "Weekend Plans",
            content: `Goal:
Descrever planos usando estruturas simples de futuro.

Key points:
- be going to + verb.
- Convites e confirmaÃ§Ãµes.
- CombinaÃ§Ãµes de horÃ¡rio e local.

Practice:
1. Convide alguÃ©m para 2 atividades diferentes.
2. Responda aceitando e recusando.
3. Crie um plano de fim de semana em 6 frases.`
          },
        ],
      },
    ],
  },
  {
    id: "course_work",
    title: "English for Work",
    level: "Intermediate",
    description: "ComunicaÃ§Ã£o profissional para reuniÃµes e projetos.",
    modules: [
      {
        id: "work_m1",
        title: "Meetings and Updates",
        lessons: [
          {
            id: "work_m1_l1",
            title: "Status Updates",
            content: `Goal:
Dar atualizaÃ§Ãµes claras e objetivas em contexto profissional.

Key points:
- What was done / what's next / blockers.
- Linguagem curta e direta.
- Verbos de aÃ§Ã£o para progresso.

Practice:
1. Escreva update de um projeto em 5 linhas.
2. FaÃ§a uma versÃ£o oral de 45 segundos.
3. Inclua 1 risco e 1 prÃ³ximo passo.`
          },
          {
            id: "work_m1_l2",
            title: "Asking Clarifying Questions",
            content: `Goal:
Fazer perguntas que reduzem ruÃ­do na comunicaÃ§Ã£o.

Key points:
- Scope, deadline, owner, dependencies.
- Perguntas abertas e fechadas.
- ReconfirmaÃ§Ã£o de entendimento.

Practice:
1. Crie 8 perguntas Ãºteis para kickoff.
2. Reescreva perguntas vagas em perguntas precisas.
3. FaÃ§a um roleplay de reuniÃ£o.`
          },
        ],
      },
      {
        id: "work_m2",
        title: "Emails and Messaging",
        lessons: [
          {
            id: "work_m2_l1",
            title: "Professional Email Structure",
            content: `Goal:
Escrever e-mails profissionais claros e curtos.

Key points:
- Subject, context, request, deadline, close.
- Tom objetivo e cordial.
- Call to action simples.

Practice:
1. Escreva um e-mail pedindo feedback.
2. Escreva um follow-up de atraso.
3. Reduza 20% do tamanho mantendo clareza.`
          },
          {
            id: "work_m2_l2",
            title: "Chat Communication",
            content: `Goal:
Responder mensagens de trabalho com precisÃ£o.

Key points:
- Acknowledge + action + ETA.
- Frases para alinhamento rÃ¡pido.
- Evitar ambiguidades.

Practice:
1. Crie 10 respostas curtas para cenÃ¡rios comuns.
2. Reescreva mensagens longas em 1-2 linhas.
3. Simule conversa de suporte interno.`
          },
        ],
      },
    ],
  },
  {
    id: "course_travel",
    title: "Travel and Culture",
    level: "Beginner",
    description: "VocabulÃ¡rio e frases Ãºteis para viagens internacionais.",
    modules: [
      {
        id: "travel_m1",
        title: "Airport and Hotel",
        lessons: [
          {
            id: "travel_m1_l1",
            title: "At the Airport",
            content: `Goal:
Passar por check-in e imigraÃ§Ã£o com seguranÃ§a.

Key points:
- Perguntas comuns no aeroporto.
- Documentos e bagagem.
- DireÃ§Ãµes dentro do terminal.

Practice:
1. Monte diÃ¡logo de check-in com 10 falas.
2. Responda 6 perguntas de imigraÃ§Ã£o.
3. PeÃ§a informaÃ§Ã£o de portÃ£o e horÃ¡rio.`
          },
          {
            id: "travel_m1_l2",
            title: "Hotel Check-in",
            content: `Goal:
Resolver reservas e solicitaÃ§Ãµes de hotel.

Key points:
- Booking details, room type, check-out.
- Pedidos extras (toalha, travesseiro, late check-out).
- ReclamaÃ§Ã£o educada.

Practice:
1. Simule check-in completo.
2. FaÃ§a um pedido de troca de quarto.
3. Escreva mensagem curta para recepÃ§Ã£o.`
          },
        ],
      },
    ],
  },
];

function calcCourseProgress(course, doneSet) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const total = lessons.length || 1;
  const done = lessons.filter((l) => doneSet.has(l.id)).length;
  return { total, done, percent: Math.round((done / total) * 100) };
}

function calcModuleProgress(module, doneSet) {
  const total = module.lessons.length || 1;
  const done = module.lessons.filter((l) => doneSet.has(l.id)).length;
  return { total, done, percent: Math.round((done / total) * 100) };
}

export default function Courses({ setCurrentView, color = "#096105" }) {
  const [stage, setStage] = useState("courses");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [doneLessonIds, setDoneLessonIds] = useState(new Set());

  const selectedCourse = useMemo(
    () => COURSES_DATA.find((c) => c.id === selectedCourseId) || null,
    [selectedCourseId]
  );

  const selectedModule = useMemo(
    () => selectedCourse?.modules.find((m) => m.id === selectedModuleId) || null,
    [selectedCourse, selectedModuleId]
  );

  const selectedLesson = useMemo(
    () => selectedModule?.lessons.find((l) => l.id === selectedLessonId) || null,
    [selectedModule, selectedLessonId]
  );

  const moduleUnlocked = (moduleIndex) => {
    if (moduleIndex === 0) return true;
    const previous = selectedCourse.modules[moduleIndex - 1];
    return previous.lessons.every((l) => doneLessonIds.has(l.id));
  };

  const lessonUnlocked = (lessonIndex) => {
    if (lessonIndex === 0) return true;
    const previous = selectedModule.lessons[lessonIndex - 1];
    return doneLessonIds.has(previous.id);
  };

  const markLessonDone = () => {
    if (!selectedLesson) return;
    setDoneLessonIds((prev) => {
      const next = new Set(prev);
      next.add(selectedLesson.id);
      return next;
    });
  };

  return (
    <section
      className="courses-shell"
      style={{
        "--courses-theme": color,
      }}
    >
      <header className="courses-header">
        <button
          type="button"
          className="duo-back-btn"
          onClick={() => {
            if (stage === "courses") setCurrentView("initial");
            else if (stage === "modules") setStage("courses");
            else if (stage === "lessons") setStage("modules");
            else setStage("lessons");
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="courses-kicker">COURSES TRACK</div>
          <h1>Courses</h1>
        </div>
              <ModuleGuideButton moduleKey="courses" color={color} />
</header>

      {stage === "courses" && (
        <div className="courses-list">
          {COURSES_DATA.map((course, idx) => {
            const p = calcCourseProgress(course, doneLessonIds);
            return (
              <button
                key={course.id}
                type="button"
                className={`courses-thin-btn ${idx % 2 ? "offset-right" : "offset-left"}`}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setSelectedModuleId(null);
                  setSelectedLessonId(null);
                  setStage("modules");
                }}
              >
                <span className="courses-thin-icon">
                  <GraduationCap size={18} />
                </span>
                <span className="courses-thin-body">
                  <span className="courses-thin-title">{course.title}</span>
                  <span className="courses-thin-sub">{course.level} | {course.description}</span>
                </span>
                <span className="courses-thin-meta">
                  <span>{p.done}/{p.total}</span>
                  <span>{p.percent}%</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {stage === "modules" && selectedCourse && (
        <div className="courses-list">
          {selectedCourse.modules.map((module, idx) => {
            const p = calcModuleProgress(module, doneLessonIds);
            const unlocked = moduleUnlocked(idx);
            return (
              <button
                key={module.id}
                type="button"
                className={`courses-thin-btn ${idx % 2 ? "offset-right" : "offset-left"} ${!unlocked ? "is-locked" : ""}`}
                disabled={!unlocked}
                onClick={() => {
                  setSelectedModuleId(module.id);
                  setSelectedLessonId(null);
                  setStage("lessons");
                }}
              >
                <span className="courses-thin-icon">
                  <Layers3 size={18} />
                </span>
                <span className="courses-thin-body">
                  <span className="courses-thin-title">{module.title}</span>
                  <span className="courses-thin-sub">Modulo do curso {selectedCourse.title}</span>
                </span>
                <span className="courses-thin-meta">
                  <span>{p.done}/{p.total}</span>
                  <span>{p.percent}%</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {stage === "lessons" && selectedCourse && selectedModule && (
        <div className="courses-detail-layout">
          <div className="courses-list">
            {selectedModule.lessons.map((lesson, idx) => {
              const unlocked = lessonUnlocked(idx);
              const done = doneLessonIds.has(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`courses-thin-btn ${idx % 2 ? "offset-right" : "offset-left"} ${!unlocked ? "is-locked" : ""} ${selectedLessonId === lesson.id ? "is-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setStage("content");
                  }}
                >
                  <span className="courses-thin-icon">
                    {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="courses-thin-body">
                    <span className="courses-thin-title">{lesson.title}</span>
                    <span className="courses-thin-sub">LiÃ§Ã£o do mÃ³dulo {selectedModule.title}</span>
                  </span>
                  <span className="courses-thin-meta">
                    <span>{done ? "Feita" : "Pendente"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {stage === "content" && selectedLesson && (
        <article className="courses-content-card">
          <div className="courses-content-head">
            <BookOpen size={20} />
            <h2>{selectedLesson.title}</h2>
          </div>
          <pre className="courses-content-text">{selectedLesson.content}</pre>
          <div className="courses-content-actions">
            <button type="button" className="courses-primary-btn" onClick={markLessonDone}>
              Marcar como concluida
            </button>
            <button type="button" className="courses-secondary-btn" onClick={() => setStage("lessons")}>
              Voltar para licoes
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
