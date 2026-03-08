tsx
import { useState, useEffect, useCallback, ChangeEvent, memo } from "react";
import { BookOpen, Search, Plus, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number; // 0 - 100
  image?: string;
}

/* ---------- Hook de busca com debounce ---------- */
function useDebouncedSearch<T>(items: T[], keys: (keyof T)[], delay = 300) {
  const [term, setTerm] = useState("");
  const [filtered, setFiltered] = useState<T[]>(items);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!term) {
        setFiltered(items);
        return;
      }
      const lower = term.toLowerCase();
      setFiltered(
        items.filter((item) =>
          keys.some((k) => String(item[k]).toLowerCase().includes(lower))
        )
      );
    }, delay);
    return () => clearTimeout(handler);
  }, [term, items, keys, delay]);

  return { term, setTerm, filtered };
}

/* ---------- Card de curso (memoizado) ---------- */
const CourseCard = memo(({ course }: { course: Course }) => (
  <article className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden">
    {course.image && (
      <img
        src={course.image}
        alt={course.title}
        className="w-full h-40 object-cover"
      />
    )}
    <div className="p-4">
      <h2 className="font-semibold text-lg">{course.title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {course.description}
      </p>

      {/* Barra de progresso */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progresso</span>
          <span>{course.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition">
        Continuar
      </button>
    </div>
  </article>
));

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulação de fetch (substituir por chamada real)
  useEffect(() => {
    const fetchCourses = async () => {
      const data: Course[] = [
        {
          id: "1",
          title: "Inglês Básico",
          description: "Fundamentos do idioma para iniciantes.",
          progress: 45,
          image: "https://picsum.photos/seed/1/400/200",
        },
        {
          id: "2",
          title: "Conversação Avançada",
          description: "Melhore sua fluência em situações reais.",
          progress: 20,
          image: "https://picsum.photos/seed/2/400/200",
        },
        // ...mais cursos
      ];
      setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  // Busca com debounce
  const { term, setTerm, filtered } = useDebouncedSearch<Course>(
    courses,
    ["title", "description"]
  );

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setTerm(e.target.value),
    [setTerm]
  );

  return (
    <section className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Cursos
        </h1>
        <button className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition">
          <Plus className="w-5 h-5" />
          Novo Curso
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          value={term}
          onChange={handleSearch}
          placeholder="Buscar cursos..."
          className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Grid de cursos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
            Nenhum curso encontrado.
          </p>
        )}
      </div>
    </section>
  );
}