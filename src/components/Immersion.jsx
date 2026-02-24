tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sun,
  Moon,
  BookOpen,
  Play,
  Pause,
  User,
  Search,
  X,
} from "lucide-react";

function ImmersionDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lessons = useMemo(
    () => [
      { id: "1", title: "Daily Conversation", duration: 15 },
      { id: "2", title: "Business English", duration: 20 },
      { id: "3", title: "Travel Phrases", duration: 10 },
    ],
    []
  );

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add("dark") : root.classList.remove("dark");
  }, [darkMode]);

  // Timer: start when a lesson is active, reset on stop
  useEffect(() => {
    if (activeLesson) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
    };
  }, [activeLesson]);

  const formatTime = useCallback((sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const filteredLessons = useMemo(
    () =>
      lessons.filter((l) =>
        l.title.toLowerCase().includes(search.toLowerCase())
      ),
    [lessons, search]
  );

  const handleStart = useCallback((id: string) => setActiveLesson(id), []);
  const handleStop = useCallback(() => setActiveLesson(null), []);
  const toggleDark = useCallback(() => setDarkMode((d) => !d), []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="w-6 h-6" />
          Immersion
        </h1>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar lições..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Buscar lições"
            />
            {search && (
              <X
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer text-gray-500 dark:text-gray-400"
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
              />
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Alternar modo escuro"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User profile */}
          <button
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Perfil do usuário"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Perfil</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="p-6">
        {/* Timer bar */}
        {activeLesson && (
          <section className="mb-8 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">
                {lessons.find((l) => l.id === activeLesson)?.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tempo decorrido: {formatTime(seconds)}
              </p>
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
              aria-label="Parar lição"
            >
              <Pause className="w-4 h-4" />
              Parar
            </button>
          </section>
        )}

        {/* Lessons grid */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <article
              key={lesson.id}
              className="flex flex-col justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition"
            >
              <div>
                <h3 className="text-lg font-medium">{lesson.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Duração: {lesson.duration} min
                </p>
              </div>
              <button
                onClick={() => handleStart(lesson.id)}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                aria-label={`Iniciar lição ${lesson.title}`}
              >
                <Play className="w-4 h-4" />
                Iniciar
              </button>
            </article>
          ))}

          {filteredLessons.length === 0 && (
            <p className="col-span-full text-center text-gray-600 dark:text-gray-400">
              Nenhuma lição encontrada.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default ImmersionDashboard;