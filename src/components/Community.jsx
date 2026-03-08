import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Send, Flag, BellOff } from "lucide-react";

const YOU_ID = "you";

const SEED_POSTS = [
  {
    id: "post_1",
    author_id: "user_ana",
    author_name: "Ana",
    content: "Today I learned 12 new words with context sentences. Huge difference.",
    created_at: "2026-03-05T12:15:00.000Z",
    likes_by: ["user_caio"],
    comments: [
      {
        id: "c_1",
        author_id: "user_caio",
        author_name: "Caio",
        text: "Nice progress. Context helps a lot.",
        created_at: "2026-03-05T13:00:00.000Z",
      },
    ],
  },
  {
    id: "post_2",
    author_id: "user_lu",
    author_name: "Lu",
    content: "Anyone wants to practice short speaking drills tonight?",
    created_at: "2026-03-05T17:05:00.000Z",
    likes_by: ["you", "user_ana"],
    comments: [],
  },
  {
    id: "post_3",
    author_id: "user_noah",
    author_name: "Noah",
    content: "Tip: shadowing for 10 minutes a day improved my listening speed.",
    created_at: "2026-03-06T07:30:00.000Z",
    likes_by: [],
    comments: [],
  },
];

function ensureCommunity(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.community) {
    data.modules.community = {
      posts: [...SEED_POSTS],
      muted_author_ids: [],
      reported_post_ids: [],
      total_posts: SEED_POSTS.length,
      total_comments: SEED_POSTS.reduce((sum, post) => sum + post.comments.length, 0),
      total_likes: SEED_POSTS.reduce((sum, post) => sum + post.likes_by.length, 0),
      last_filter: "all",
      last_sync: null,
    };
  }
  if (!Array.isArray(data.modules.community.posts)) data.modules.community.posts = [...SEED_POSTS];
  if (!Array.isArray(data.modules.community.muted_author_ids)) data.modules.community.muted_author_ids = [];
  if (!Array.isArray(data.modules.community.reported_post_ids)) data.modules.community.reported_post_ids = [];
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureCommunity(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureCommunity(parsed);
}

function formatDate(isoDate) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export default function Community({ setCurrentView, color = "#333333" }) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState([]);
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState("");
  const [commentDraft, setCommentDraft] = useState({});
  const [mutedAuthorIds, setMutedAuthorIds] = useState([]);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [stats, setStats] = useState({ total_posts: 0, total_comments: 0, total_likes: 0 });

  const persistState = async (
    nextPosts,
    nextMuted = mutedAuthorIds,
    nextReported = reportedPostIds,
    nextFilter = filter
  ) => {
    setSyncing(true);
    try {
      const progress = await readProgress();
      const totalPosts = nextPosts.length;
      const totalComments = nextPosts.reduce(
        (sum, post) => sum + (Array.isArray(post.comments) ? post.comments.length : 0),
        0
      );
      const totalLikes = nextPosts.reduce(
        (sum, post) => sum + (Array.isArray(post.likes_by) ? post.likes_by.length : 0),
        0
      );

      progress.modules.community = {
        posts: nextPosts,
        muted_author_ids: nextMuted,
        reported_post_ids: nextReported,
        total_posts: totalPosts,
        total_comments: totalComments,
        total_likes: totalLikes,
        last_filter: nextFilter,
        last_sync: new Date().toISOString(),
      };

      const saved = await writeProgress(progress);
      const block = saved.modules.community;
      setFeed(block.posts);
      setMutedAuthorIds(block.muted_author_ids);
      setReportedPostIds(block.reported_post_ids);
      setFilter(block.last_filter || "all");
      setStats({
        total_posts: Number(block.total_posts || 0),
        total_comments: Number(block.total_comments || 0),
        total_likes: Number(block.total_likes || 0),
      });
      setError("");
    } catch {
      setError("Nao foi possivel sincronizar o feed agora.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.community;
        setFeed(block.posts);
        setMutedAuthorIds(block.muted_author_ids);
        setReportedPostIds(block.reported_post_ids);
        setFilter(block.last_filter || "all");
        setStats({
          total_posts: Number(block.total_posts || 0),
          total_comments: Number(block.total_comments || 0),
          total_likes: Number(block.total_likes || 0),
        });
      } catch {
        if (!mounted) return;
        setFeed([...SEED_POSTS]);
        setError("Falha ao carregar feed, usando modo local temporario.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const visiblePosts = useMemo(() => {
    const notMuted = feed.filter((post) => !mutedAuthorIds.includes(post.author_id));
    if (filter === "mine") return notMuted.filter((post) => post.author_id === YOU_ID);
    if (filter === "liked") return notMuted.filter((post) => post.likes_by.includes(YOU_ID));
    if (filter === "popular") {
      return [...notMuted].sort((a, b) => b.likes_by.length - a.likes_by.length);
    }
    return [...notMuted].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [feed, mutedAuthorIds, filter]);

  const submitPost = async () => {
    const text = composer.trim();
    if (!text) return;
    const nextPosts = [
      {
        id: `post_${Date.now()}`,
        author_id: YOU_ID,
        author_name: "You",
        content: text,
        created_at: new Date().toISOString(),
        likes_by: [],
        comments: [],
      },
      ...feed,
    ];
    setComposer("");
    await persistState(nextPosts);
  };

  const toggleLike = async (postId) => {
    const nextPosts = feed.map((post) => {
      if (post.id !== postId) return post;
      const alreadyLiked = post.likes_by.includes(YOU_ID);
      return {
        ...post,
        likes_by: alreadyLiked
          ? post.likes_by.filter((id) => id !== YOU_ID)
          : [...post.likes_by, YOU_ID],
      };
    });
    await persistState(nextPosts);
  };

  const sendComment = async (postId) => {
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;
    const nextPosts = feed.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: [
          ...(post.comments || []),
          {
            id: `c_${Date.now()}`,
            author_id: YOU_ID,
            author_name: "You",
            text,
            created_at: new Date().toISOString(),
          },
        ],
      };
    });
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    await persistState(nextPosts);
  };

  const toggleReport = async (postId) => {
    const nextReported = reportedPostIds.includes(postId)
      ? reportedPostIds.filter((id) => id !== postId)
      : [...reportedPostIds, postId];
    await persistState(feed, mutedAuthorIds, nextReported);
  };

  const muteAuthor = async (authorId) => {
    if (authorId === YOU_ID) return;
    if (mutedAuthorIds.includes(authorId)) return;
    const nextMuted = [...mutedAuthorIds, authorId];
    await persistState(feed, nextMuted, reportedPostIds);
  };

  const onFilterChange = async (nextFilter) => {
    setFilter(nextFilter);
    await persistState(feed, mutedAuthorIds, reportedPostIds, nextFilter);
  };

  return (
    <section className="community-shell" style={{ "--community-theme": color }}>
      <header className="community-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="community-kicker">COMMUNITY</div>
          <h1>Community Feed</h1>
        </div>
      </header>

      <section className="community-composer-card">
        <div className="community-top-row">
          <h2>Compartilhe progresso rapido</h2>
          <div className="community-filter-wrap">
            <label htmlFor="community-filter">Filtro</label>
            <select
              id="community-filter"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="all">Recentes</option>
              <option value="popular">Mais curtidos</option>
              <option value="liked">Curtidos por mim</option>
              <option value="mine">Meus posts</option>
            </select>
          </div>
        </div>

        <textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="Escreva uma conquista, duvida ou dica de estudo..."
          rows={3}
        />

        <div className="community-composer-footer">
          <div className="community-stats">
            <span>Posts: {stats.total_posts}</span>
            <span>Comentarios: {stats.total_comments}</span>
            <span>Curtidas: {stats.total_likes}</span>
          </div>
          <button type="button" className="community-primary-btn" onClick={submitPost}>
            <Send size={16} />
            Publicar
          </button>
        </div>
      </section>

      {error ? <p className="community-error">{error}</p> : null}
      {loading ? <p className="community-loading">Carregando feed...</p> : null}
      {syncing ? <p className="community-syncing">Sincronizando interacoes...</p> : null}

      <section className="community-feed">
        {visiblePosts.length === 0 && !loading ? (
          <article className="community-empty">Nenhum post encontrado para este filtro.</article>
        ) : null}

        {visiblePosts.map((post) => {
          const isReported = reportedPostIds.includes(post.id);
          const isMuted = mutedAuthorIds.includes(post.author_id);
          const isLiked = post.likes_by.includes(YOU_ID);

          return (
            <article key={post.id} className="community-post-card">
              <header className="community-post-head">
                <div>
                  <strong>{post.author_name}</strong>
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <div className="community-post-moderation">
                  <button type="button" onClick={() => toggleReport(post.id)}>
                    <Flag size={14} />
                    {isReported ? "Reportado" : "Reportar"}
                  </button>
                  <button type="button" onClick={() => muteAuthor(post.author_id)} disabled={isMuted}>
                    <BellOff size={14} />
                    {isMuted ? "Silenciado" : "Silenciar"}
                  </button>
                </div>
              </header>

              <p className="community-post-content">{post.content}</p>

              <footer className="community-post-actions">
                <button
                  type="button"
                  className={isLiked ? "is-on" : ""}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart size={16} />
                  {post.likes_by.length}
                </button>
                <span>
                  <MessageSquare size={16} />
                  {post.comments.length}
                </span>
              </footer>

              <div className="community-comment-list">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="community-comment-item">
                    <strong>{comment.author_name}:</strong>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>

              <div className="community-comment-input">
                <input
                  type="text"
                  value={commentDraft[post.id] || ""}
                  onChange={(e) =>
                    setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendComment(post.id);
                  }}
                  placeholder="Comentar..."
                />
                <button type="button" onClick={() => sendComment(post.id)}>
                  <Send size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
