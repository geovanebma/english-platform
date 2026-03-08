import { useState, useMemo, useCallback } from "react";
import { Search, Video, Calendar, Star } from "lucide-react";

const nativeSpeakers = [
  {
    id: 1,
    name: "Ana Silva",
    country: "Brasil",
    language: "Português",
    rating: 4.9,
    avatar: "https://i.pravatar.cc/150?img=1",
    available: true,
  },
  {
    id: 2,
    name: "John Doe",
    country: "USA",
    language: "English",
    rating: 4.8,
    avatar: "https://i.pravatar.cc/150?img=2",
    available: false,
  },
  // ...mais usuários
];

/* Search input component */
function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full md:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por nome ou idioma..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 rounded bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

/* Card for each speaker */
function SpeakerCard({ speaker }) {
  return (
    <article className="bg-gray-800 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
      <img
        src={speaker.avatar}
        alt={speaker.name}
        className="w-24 h-24 rounded-full mb-3 border-2 border-indigo-500"
      />
      <h2 className="text-xl font-semibold">{speaker.name}</h2>
      <p className="text-sm text-gray-400">{speaker.country}</p>
      <div className="flex items-center gap-1 mt-2">
        <Star className="w-4 h-4 text-yellow-400" />
        <span>{speaker.rating}</span>
      </div>
      <button
        disabled={!speaker.available}
        className={`mt-4 w-full py-2 rounded ${
          speaker.available
            ? "bg-indigo-600 hover:bg-indigo-500"
            : "bg-gray-600 cursor-not-allowed"
        } text-white font-medium flex items-center justify-center gap-2`}
      >
        <Calendar className="w-5 h-5" />
        {speaker.available ? "Agendar sessão" : "Indisponível"}
      </button>
    </article>
  );
}

/* Main component */
export default function SpeakWithNatives() {
  const [search, setSearch] = useState("");

  // Memoize filtered list based on search term
  const filteredSpeakers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return nativeSpeakers;
    return nativeSpeakers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.language.toLowerCase().includes(term)
    );
  }, [search]);

  // Stable handler for input change
  const handleSearch = useCallback((e) => setSearch(e.target.value), []);

  return (
    <section className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Video className="w-8 h-8 text-indigo-400" />
          Speak With Natives
        </h1>
        <SearchBar value={search} onChange={handleSearch} />
      </header>

      {/* Speakers Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSpeakers.map((speaker) => (
          <SpeakerCard key={speaker.id} speaker={speaker} />
        ))}
        {filteredSpeakers.length === 0 && (
          <p className="col-span-full text-center text-gray-400">
            Nenhum falante encontrado.
          </p>
        )}
      </div>
    </section>
  );
}