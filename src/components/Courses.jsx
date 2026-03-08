import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GraduationCap, Layers3, CheckCircle2, Circle } from "lucide-react";

const COURSES_DATA = [
  {
    id: "course_everyday",
    title: "English for Daily Life",
    level: "Beginner",
    description: "Conversas práticas para situações comuns do dia a dia.",
    modules: [
      {
        id: "daily_m1",
        title: "Introductions and Basics",
        lessons: [
          {
            id: "daily_m1_l1",
            title: "Presenting Yourself",
            content: `Goal:
Você vai aprender a se apresentar com naturalidade em inglês.

Key points:
- Name, age, city and occupation.
- Perguntas rápidas para iniciar conversa.
- Estrutura simples no present tense.

Practice:
1. Write 5 lines introducing yourself.
2. Pergunte o nome de uma pessoa e responda.
3. Monte um mini diálogo de 6 falas.

Checklist:
- Use "My name is..." corretamente.
- Use "I am from..." corretamente.
- Faça uma pergunta de retorno.`
          },
          {
            id: "daily_m1_l2",
            title: "Polite Interactions",
            content: `Goal:
Usar frases educadas para pedir e agradecer.

Key points:
- Please, thank you, excuse me, sorry.
- Pedidos curtos e objetivos.
- Respostas positivas e negativas com educação.

Practice:
1. Reescreva 5 pedidos deixando-os mais educados.
2. Treine variações de agradecimento.
3. Faça um diálogo de loja com 8 falas.`
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
Falar sobre rotina diária com clareza.

Key points:
- Horários e frequência (always, usually, sometimes).
- Verbos comuns de rotina.
- Conectores: then, after that, finally.

Practice:
1. Escreva sua rotina da manhã em 8 frases.
2. Grave áudio lendo as frases.
3. Transforme 3 frases em perguntas.`
          },
          {
            id: "daily_m2_l2",
            title: "Weekend Plans",
            content: `Goal:
Descrever planos usando estruturas simples de futuro.

Key points:
- be going to + verb.
- Convites e confirmações.
- Combinações de horário e local.

Practice:
1. Convide alguém para 2 atividades diferentes.
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
    description: "Comunicação profissional para reuniões e projetos.",
    modules: [
      {
        id: "work_m1",
        title: "Meetings and Updates",
        lessons: [
          {
            id: "work_m1_l1",
            title: "Status Updates",
            content: `Goal:
Dar atualizações claras e objetivas em contexto profissional.

Key points:
- What was done / what's next / blockers.
- Linguagem curta e direta.
- Verbos de ação para progresso.

Practice:
1. Escreva update de um projeto em 5 linhas.
2. Faça uma versão oral de 45 segundos.
3. Inclua 1 risco e 1 próximo passo.`
          },
          {
            id: "work_m1_l2",
            title: "Asking Clarifying Questions",
            content: `Goal:
Fazer perguntas que reduzem ruído na comunicação.

Key points:
- Scope, deadline, owner, dependencies.
- Perguntas abertas e fechadas.
- Reconfirmação de entendimento.

Practice:
1. Crie 8 perguntas úteis para kickoff.
2. Reescreva perguntas vagas em perguntas precisas.
3. Faça um roleplay de reunião.`
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
Responder mensagens de trabalho com precisão.

Key points:
- Acknowledge + action + ETA.
- Frases para alinhamento rápido.
- Evitar ambiguidades.

Practice:
1. Crie 10 respostas curtas para cenários comuns.
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
    description: "Vocabulário e frases úteis para viagens internacionais.",
    modules: [
      {
        id: "travel_m1",
        title: "Airport and Hotel",
        lessons: [
          {
            id: "travel_m1_l1",
            title: "At the Airport",
            content: `Goal:
Passar por check-in e imigração com segurança.

Key points:
- Perguntas comuns no aeroporto.
- Documentos e bagagem.
- Direções dentro do terminal.

Practice:
1. Monte diálogo de check-in com 10 falas.
2. Responda 6 perguntas de imigração.
3. Peça informação de portão e horário.`
          },
          {
            id: "travel_m1_l2",
            title: "Hotel Check-in",
            content: `Goal:
Resolver reservas e solicitações de hotel.

Key points:
- Booking details, room type, check-out.
- Pedidos extras (toalha, travesseiro, late check-out).
- Reclamação educada.

Practice:
1. Simule check-in completo.
2. Faça um pedido de troca de quarto.
3. Escreva mensagem curta para recepção.`
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
                    <span className="courses-thin-sub">Lição do módulo {selectedModule.title}</span>
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
