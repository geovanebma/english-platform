import React, { useState, useCallback } from "react";
import { Search, Loader2, X, Volume2 } from "lucide-react";

/* Sub‑component: Input with search/clear icons */
function SearchBar({ query, setQuery, onSearch, loading, onClear }) {
  return (
    <form onSubmit={onSearch} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a word..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Word to search"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>

      {query && (
        <button
          type="button"
          onClick={onClear}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
          aria-label="Clear search"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}

/* Sub‑component: Render a single definition */
function DefinitionItem({ def }) {
  return (
    <li className="text-gray-800 dark:text-gray-200">
      {def.definition}
      {def.example && (
        <blockquote className="ml-4 border-l-2 border-indigo-300 dark:border-indigo-600 pl-2 italic text-gray-600 dark:text-gray-400">
          “{def.example}”
        </blockquote>
      )}
      {def.synonyms?.length > 0 && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Synonyms: {def.synonyms.join(", ")}
        </p>
      )}
    </li>
  );
}

/* Sub‑component: Render meanings (part of speech + definitions) */
function MeaningCard({ meaning }) {
  return (
    <div className="mt-4">
      <p className="font-medium text-indigo-600 dark:text-indigo-400">
        {meaning.partOfSpeech}
      </p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        {meaning.definitions.map((def, i) => (
          <DefinitionItem key={i} def={def} />
        ))}
      </ul>
    </div>
  );
}

/* Main component */
export default function Dictionary() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!query.trim()) return;
      setLoading(true);
      setError("");
      setData(null);
      try {
        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${query}`
        );
        const json = await res.json();
        if (res.ok) setData(json[0]); // usa o primeiro resultado
        else throw new Error(json.title || "Error fetching word");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const clearSearch = () => {
    setQuery("");
    setData(null);
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Search bar */}
      <SearchBar
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        loading={loading}
        onClear={clearSearch}
      />

      {/* Error feedback */}
      {error && (
        <p className="mt-4 text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Result card */}
      {data && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.word}
            </h2>
            {/* Play pronunciation if audio exists */}
            {data.phonetics?.[0]?.audio && (
              <button
                onClick={() => new Audio(data.phonetics[0].audio).play()}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                aria-label="Play pronunciation"
              >
                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            {data.phonetics?.[0]?.text && (
              <span className="text-gray-600 dark:text-gray-400">
                {data.phonetics[0].text}
              </span>
            )}
          </div>

          {/* Meanings list */}
          {data.meanings.map((meaning, idx) => (
            <MeaningCard key={idx} meaning={meaning} />
          ))}
        </div>
      )}
    </div>
  );
}