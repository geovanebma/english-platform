import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers3,
  CheckCircle2,
  Circle,
  Clock3,
  ClipboardList,
  BarChart3,
  Award,
  Download,
} from "lucide-react";
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

function ensureCourses(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.courses) {
    data.modules.courses = {
      done_lesson_ids: [],
      lesson_progress: {},
      last_course_id: null,
      last_module_id: null,
      last_lesson_id: null,
      last_stage: "courses",
      certificates: {},
    };
  }
  if (!Array.isArray(data.modules.courses.done_lesson_ids)) {
    data.modules.courses.done_lesson_ids = [];
  }
  if (!data.modules.courses.lesson_progress || typeof data.modules.courses.lesson_progress !== "object") {
    data.modules.courses.lesson_progress = {};
  }
  if (!data.modules.courses.certificates || typeof data.modules.courses.certificates !== "object") {
    data.modules.courses.certificates = {};
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  return ensureCourses(await res.json());
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  return ensureCourses(await res.json());
}

function extractSection(content, heading) {
  const pattern = new RegExp(`${heading}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Za-z ]+:|$)`, "i");
  const match = String(content || "").match(pattern);
  return match ? match[1].trim() : "";
}

function sectionLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-\d.\s]+/, "").trim())
    .filter(Boolean);
}

function buildLessonMaterials(lesson) {
  if (!lesson) {
    return { objective: "", keyPoints: [], practice: [], checklist: [], estimatedMinutes: 12 };
  }
  const objective = extractSection(lesson.content, "Goal");
  const keyPoints = sectionLines(extractSection(lesson.content, "Key points"));
  const practice = sectionLines(extractSection(lesson.content, "Practice"));
  const checklist = sectionLines(extractSection(lesson.content, "Checklist"));
  const estimatedMinutes = Math.max(10, Math.min(30, 8 + keyPoints.length * 2 + practice.length * 3));
  return { objective, keyPoints, practice, checklist, estimatedMinutes };
}

function formatDateTime(value) {
  if (!value) return "Ainda nao concluida";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getUiLabel("courses.not_completed_yet", "Not completed yet");
  return date.toLocaleString((window.__ep_ui_language || "pt-BR"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Courses({ setCurrentView, color = "#096105" }) {
  const [stage, setStage] = useState("courses");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [doneLessonIds, setDoneLessonIds] = useState(new Set());
  const [lessonProgress, setLessonProgress] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

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

  const lessonMaterials = useMemo(() => buildLessonMaterials(selectedLesson), [selectedLesson]);
  const selectedLessonStats = selectedLesson ? lessonProgress[selectedLesson.id] || null : null;
  const selectedCourseProgress = useMemo(
    () => (selectedCourse ? calcCourseProgress(selectedCourse, doneLessonIds) : null),
    [doneLessonIds, selectedCourse]
  );
  const selectedCourseCertificate = useMemo(() => {
    if (!selectedCourse || !selectedCourseProgress || selectedCourseProgress.percent < 100) return null;
    const totalVisits = selectedCourse.modules
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + (lessonProgress[lesson.id]?.visits || 0), 0);
    const completedLessons = selectedCourse.modules.flatMap((module) => module.lessons);
    const latestCompletion = completedLessons
      .map((lesson) => lessonProgress[lesson.id]?.completed_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];
    return {
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      level: selectedCourse.level,
      completedAt: latestCompletion || new Date().toISOString(),
      lessons: selectedCourseProgress.total,
      visits: totalVisits,
      progress: selectedCourseProgress.percent,
    };
  }, [lessonProgress, selectedCourse, selectedCourseProgress]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const progress = await readProgress();
        const block = progress.modules.courses;
        if (!active) return;
        setDoneLessonIds(new Set(block.done_lesson_ids || []));
        setLessonProgress(block.lesson_progress || {});
        setSelectedCourseId(block.last_course_id || null);
        setSelectedModuleId(block.last_module_id || null);
        setSelectedLessonId(block.last_lesson_id || null);
        setStage(block.last_stage || "courses");
      } catch {
        // no-op
      } finally {
        if (active) setIsLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(async () => {
      try {
        const progress = await readProgress();
        const block = progress.modules.courses || {};
        progress.modules.courses = {
          ...block,
          done_lesson_ids: [...doneLessonIds],
          lesson_progress: lessonProgress,
          last_course_id: selectedCourseId,
          last_module_id: selectedModuleId,
          last_lesson_id: selectedLessonId,
          last_stage: stage,
          certificates: {
            ...(block.certificates || {}),
            ...(selectedCourseCertificate ? { [selectedCourseCertificate.courseId]: selectedCourseCertificate } : {}),
          },
        };
        await writeProgress(progress);
      } catch {
        // no-op
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [
    doneLessonIds,
    isLoaded,
    lessonProgress,
    selectedCourseCertificate,
    selectedCourseId,
    selectedLessonId,
    selectedModuleId,
    stage,
  ]);

  const moduleUnlocked = (moduleIndex) => {
    if (!selectedCourse || moduleIndex === 0) return true;
    const previous = selectedCourse.modules[moduleIndex - 1];
    return previous.lessons.every((l) => doneLessonIds.has(l.id));
  };

  const lessonUnlocked = (lessonIndex) => {
    if (!selectedModule || lessonIndex === 0) return true;
    const previous = selectedModule.lessons[lessonIndex - 1];
    return doneLessonIds.has(previous.id);
  };

  const openCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId(null);
    setSelectedLessonId(null);
    setStage("modules");
  };

  const openModule = (moduleId) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId(null);
    setStage("lessons");
  };

  const openLesson = (lesson) => {
    setSelectedLessonId(lesson.id);
    setLessonProgress((prev) => ({
      ...prev,
      [lesson.id]: {
        ...(prev[lesson.id] || {}),
        visits: (prev[lesson.id]?.visits || 0) + 1,
        last_opened_at: new Date().toISOString(),
      },
    }));
    setStage("content");
  };

  const markLessonDone = () => {
    if (!selectedLesson) return;
    const completedAt = new Date().toISOString();
    setDoneLessonIds((prev) => {
      const next = new Set(prev);
      next.add(selectedLesson.id);
      return next;
    });
    setLessonProgress((prev) => ({
      ...prev,
      [selectedLesson.id]: {
        ...(prev[selectedLesson.id] || {}),
        completed: true,
        completed_at: completedAt,
        estimated_minutes: lessonMaterials.estimatedMinutes,
        checklist_items: lessonMaterials.checklist.length,
        practice_items: lessonMaterials.practice.length,
      },
    }));
  };

  const downloadCertificate = () => {
    if (!selectedCourseCertificate) return;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Certificado - ${selectedCourseCertificate.courseTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#0f1720; margin:0; padding:40px; color:#fff; }
    .sheet { max-width:900px; margin:0 auto; background:linear-gradient(135deg,#0f2230,#132d1b); border:4px solid ${color}; border-radius:28px; padding:48px; }
    .kicker { color:#b9d8ff; font-size:14px; letter-spacing:0.2em; text-transform:uppercase; }
    h1 { margin:12px 0 6px; font-size:48px; }
    h2 { margin:0 0 24px; font-size:22px; color:#dff7d5; font-weight:normal; }
    .course { font-size:36px; margin:26px 0 12px; color:#fff; }
    .meta { display:grid; grid-template-columns:repeat(2,minmax(180px,1fr)); gap:16px; margin-top:28px; }
    .box { background:rgba(255,255,255,0.06); border-radius:18px; padding:18px 20px; }
    .box strong { display:block; color:#d7f8c7; margin-bottom:6px; }
    .seal { margin-top:30px; display:inline-block; padding:14px 20px; border-radius:999px; background:${color}; color:#fff; font-weight:bold; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="kicker">${getUiLabel("courses.certificate_title", "English Platform Certificate")}</div>
    <h1>${getUiLabel("courses.certificate_completion", "Certificate of completion")}</h1>
    <h2>${getUiLabel("courses.certificate_issued", "Issued to demonstrate academic progress")}</h2>
    <div>${getUiLabel("courses.certificate_recognizes", "This document recognizes the completion of the course:")}</div>
    <div class="course">${selectedCourseCertificate.courseTitle}</div>
    <div>${getUiLabel("games.level", "Level")}: ${selectedCourseCertificate.level}</div>
    <div class="meta">
      <div class="box"><strong>${getUiLabel("courses.completed_lessons", "Completed lessons")}</strong>${selectedCourseCertificate.lessons}</div>
      <div class="box"><strong>${getUiLabel("courses.final_progress", "Final progress")}</strong>${selectedCourseCertificate.progress}%</div>
      <div class="box"><strong>${getUiLabel("courses.registered_visits", "Registered visits")}</strong>${selectedCourseCertificate.visits}</div>
      <div class="box"><strong>${getUiLabel("courses.completion_date", "Completion date")}</strong>${formatDateTime(selectedCourseCertificate.completedAt)}</div>
    </div>
    <div class="seal">${getUiLabel("courses.validated_by_track", "Validated by the platform course track")}</div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCourseCertificate.courseTitle.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_certificate.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="courses-shell" style={{ "--courses-theme": color }}>
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
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="courses-kicker">{getUiLabel("courses.kicker", "COURSES TRACK")}</div>
          <h1>{getUiLabel("module.courses", "Courses")}</h1>
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
                onClick={() => openCourse(course.id)}
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
        <div className="courses-detail-layout">
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
                  onClick={() => openModule(module.id)}
                >
                  <span className="courses-thin-icon">
                    <Layers3 size={18} />
                  </span>
                  <span className="courses-thin-body">
                    <span className="courses-thin-title">{module.title}</span>
                    <span className="courses-thin-sub">{getUiLabel("courses.module_of_course", "Module of course {course}").replace("{course}", selectedCourse.title)}</span>
                  </span>
                  <span className="courses-thin-meta">
                    <span>{p.done}/{p.total}</span>
                    <span>{p.percent}%</span>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedCourseCertificate ? (
            <aside className="courses-certificate-card">
              <div className="courses-certificate-badge">
                <Award size={20} />
                {getUiLabel("courses.certificate_ready", "Certificate ready")}
              </div>
              <h3>{selectedCourseCertificate.courseTitle}</h3>
              <p>
                {getUiLabel("courses.certificate_summary", "Course completed with {progress}% progress and {lessons} registered lessons.").replace("{progress}", selectedCourseCertificate.progress).replace("{lessons}", selectedCourseCertificate.lessons)}
              </p>
              <div className="courses-certificate-meta">
                <span>{getUiLabel("games.level", "Level")}: {selectedCourseCertificate.level}</span>
                <span>{getUiLabel("courses.date", "Date")}: {formatDateTime(selectedCourseCertificate.completedAt)}</span>
              </div>
              <button type="button" className="courses-primary-btn" onClick={downloadCertificate}>
                <Download size={16} />
                {getUiLabel("courses.download_certificate", "Download certificate")}
              </button>
            </aside>
          ) : null}
        </div>
      )}

      {stage === "lessons" && selectedCourse && selectedModule && (
        <div className="courses-detail-layout">
          <div className="courses-list">
            {selectedModule.lessons.map((lesson, idx) => {
              const unlocked = lessonUnlocked(idx);
              const done = doneLessonIds.has(lesson.id);
              const progressEntry = lessonProgress[lesson.id] || {};
              return (
                <button
                  key={lesson.id}
                  type="button"
                  className={`courses-thin-btn ${idx % 2 ? "offset-right" : "offset-left"} ${!unlocked ? "is-locked" : ""} ${selectedLessonId === lesson.id ? "is-active" : ""}`}
                  disabled={!unlocked}
                  onClick={() => openLesson(lesson)}
                >
                  <span className="courses-thin-icon">
                    {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="courses-thin-body">
                    <span className="courses-thin-title">{lesson.title}</span>
                    <span className="courses-thin-sub">{done ? getUiLabel("courses.completed", "Completed") : getUiLabel("courses.in_study", "In study")} | {getUiLabel("courses.visits", "Visits")}: {progressEntry.visits || 0}</span>
                  </span>
                  <span className="courses-thin-meta">
                    <span>{done ? getUiLabel("courses.done", "Done") : getUiLabel("courses.pending", "Pending")}</span>
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

          <div className="courses-progress-grid">
            <div className="courses-progress-box">
              <Clock3 size={18} />
              <div>
                <strong>{getUiLabel("courses.estimated_time", "Estimated time")}</strong>
                <span>{lessonMaterials.estimatedMinutes} min</span>
              </div>
            </div>
            <div className="courses-progress-box">
              <BarChart3 size={18} />
              <div>
                <strong>{getUiLabel("courses.visits", "Visits")}</strong>
                <span>{selectedLessonStats?.visits || 0}</span>
              </div>
            </div>
            <div className="courses-progress-box">
              <CheckCircle2 size={18} />
              <div>
                <strong>{getUiLabel("courses.status", "Status")}</strong>
                <span>{doneLessonIds.has(selectedLesson.id) ? getUiLabel("courses.completed", "Completed") : getUiLabel("courses.in_progress", "In progress")}</span>
              </div>
            </div>
            <div className="courses-progress-box">
              <ClipboardList size={18} />
              <div>
                <strong>{getUiLabel("courses.last_completion", "Last completion")}</strong>
                <span>{formatDateTime(selectedLessonStats?.completed_at)}</span>
              </div>
            </div>
          </div>

          <pre className="courses-content-text">{selectedLesson.content}</pre>

          <section className="courses-materials-card">
            <h3>{getUiLabel("courses.extra_materials", "Extra materials")}</h3>
            {lessonMaterials.objective ? (
              <div className="courses-material-block">
                <strong>{getUiLabel("courses.objective", "Objective")}</strong>
                <p>{lessonMaterials.objective}</p>
              </div>
            ) : null}
            {lessonMaterials.keyPoints.length ? (
              <div className="courses-material-block">
                <strong>{getUiLabel("courses.key_points", "Key points")}</strong>
                <ul>
                  {lessonMaterials.keyPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lessonMaterials.practice.length ? (
              <div className="courses-material-block">
                <strong>{getUiLabel("courses.guided_practice", "Guided practice")}</strong>
                <ul>
                  {lessonMaterials.practice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {lessonMaterials.checklist.length ? (
              <div className="courses-material-block">
                <strong>{getUiLabel("courses.mastery_checklist", "Mastery checklist")}</strong>
                <ul>
                  {lessonMaterials.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="courses-content-actions">
            <button type="button" className="courses-primary-btn" onClick={markLessonDone}>
              {getUiLabel("courses.mark_completed", "Mark as completed")}
            </button>
            <button type="button" className="courses-secondary-btn" onClick={() => setStage("lessons")}>
              {getUiLabel("common.back_to_lessons", "Back to lessons")}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}



