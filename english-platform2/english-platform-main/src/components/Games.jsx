tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Play, Star } from "lucide-react";

type Game = {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
};

const mockGames: Game[] = [
  {
    id: "1",
    title: "Word Puzzle",
    description: "Arrange letters to form words.",
    level: "Beginner",
    rating: 4.5,
  },
  {
    id: "2",
    title: "Grammar Quest",
    description: "Choose the correct verb tense.",
    level: "Intermediate",
    rating: 4.2,
  },
  {
    id: "3",
    title: "Listening Challenge",
    description: "Identify spoken words.",
    level: "Advanced",
    rating: 4.8,
  },
];

/* ------------------- Filter Bar ------------------- */
function FilterBar({
  filterLevel,
  setFilterLevel,
  search,
  setSearch,
}: {
  filterLevel: "All" | Game["level"];
  setFilterLevel: (v: "All" | Game["level"]) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  // debounce search input to avoid excessive renders
  const timeoutRef = useRef<NodeJS.Timeout>();
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSearch(value), 300);
  };

  return (
    <div className="flex items-center mt-4 md:mt-0 space-x-2">
      {/* Level filter */}
      <select
        aria-label="Filter by level"
        value={filterLevel}
        onChange={(e) => setFilterLevel(e.target.value as typeof filterLevel)}
        className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
      >
        <option value="All">All Levels</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
      </select>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder="Search games..."
          defaultValue={search}
          onChange={handleSearch}
          className="pl-8 pr-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

/* ------------------- Game Card ------------------- */
function GameCard({ game }: { game: Game }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(game.rating) ? "fill-current" : "stroke-current"
          }`}
        />
      )),
    [game.rating]
  );

  return (
    <article className="flex flex-col justify-between rounded-lg shadow-lg bg-white dark:bg-gray-800 p-4 hover:shadow-xl transition-shadow">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {game.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {game.description}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {/* Rating */}
        <div className="flex items-center space-x-1 text-yellow-400">
          {stars}
          <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
            {game.rating.toFixed(1)}
          </span>
        </div>
        {/* Play button */}
        <button
          aria-label={`Play ${game.title}`}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1 transition-colors"
        >
          <Play className="w-4 h-4" />
          Play
        </button>
      </div>
    </article>
  );
}

/* ------------------- Main Component ------------------- */
export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<"All" | Game["level"]>("All");

  // Simulate async fetch
  useEffect(() => {
    const fetchGames = async () => {
      await new Promise((r) => setTimeout(r, 500));
      setGames(mockGames);
    };
    fetchGames();
  }, []);

  // Memoize filtered list for performance
  const displayedGames = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return games.filter((g) => {
      const levelMatch = filterLevel === "All" || g.level === filterLevel;
      const searchMatch = g.title.toLowerCase().includes(lowerSearch);
      return levelMatch && searchMatch;
    });
  }, [games, filterLevel, search]);

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Games
        </h1>
        <FilterBar
          filterLevel={filterLevel}
          setFilterLevel={setFilterLevel}
          search={search}
          setSearch={setSearch}
        />
      </header>

      {/* Games grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {displayedGames.length === 0 && (
          <p className="col-span-full text-center text-gray-600 dark:text-gray-400">
            No games found.
          </p>
        )}
      </div>
    </section>
  );
}