import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Heart, MessageSquare, Send, Flag, BellOff, ImagePlus, RefreshCw, Bell } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

function getLocale() {
  return window.__uiLocale || "pt-BR";
}

function formatDate(isoDate) {
  try {
    return new Intl.DateTimeFormat(getLocale(), {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isSpamContent(text, posts, authorId) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return getUiLabel("community.error.empty", "Empty content.");
  if (normalized.length < 6) {
    return getUiLabel("community.error.short", "Write something a little more complete before publishing.");
  }
  const recentOwn = posts.filter((post) => post.author_id === authorId).slice(0, 3);
  if (recentOwn.some((post) => String(post.content || "").trim().toLowerCase() === normalized)) {
    return getUiLabel("community.error.duplicate", "Repeated message detected. Try varying the content.");
  }
  return "";
}

export default function Community({ setCurrentView, color = "#333333" }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState([]);
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState("");
  const [composerMedia, setComposerMedia] = useState("");
  const [commentDraft, setCommentDraft] = useState({});
  const [mutedAuthorKeys, setMutedAuthorKeys] = useState([]);
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [stats, setStats] = useState({ total_posts: 0, total_comments: 0, total_likes: 0 });
  const [viewerId, setViewerId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0, has_more: false, filter: "all" });
  const [notifications, setNotifications] = useState({ items: [], unread_count: 0 });

  const applyPayload = (payload, append = false) => {
    const nextPosts = Array.isArray(payload?.posts) ? payload.posts : [];
    setFeed((prev) => (append ? [...prev, ...nextPosts] : nextPosts));
    setMutedAuthorKeys(Array.isArray(payload?.muted_author_keys) ? payload.muted_author_keys : []);
    setReportedPostIds(Array.isArray(payload?.reported_post_ids) ? payload.reported_post_ids : []);
    setStats(payload?.stats || { total_posts: 0, total_comments: 0, total_likes: 0 });
    setViewerId(payload?.viewer_id || "");
    setPagination(payload?.pagination || { page: 1, total_pages: 1, total: 0, has_more: false, filter: "all" });
    setNotifications(payload?.notifications || { items: [], unread_count: 0 });
  };

  const loadFeed = async (nextPage = 1, nextFilter = filter, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/feed?page=${nextPage}&limit=8&filter=${encodeURIComponent(nextFilter)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("feed");
      applyPayload(await res.json(), append);
      setPage(nextPage);
      setError("");
    } catch {
      setError(getUiLabel("community.feed_error", "Could not load the live feed right now."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed(1, filter, false);
  }, []);

  const visiblePosts = useMemo(() => {
    const notMuted = feed.filter((post) => !mutedAuthorKeys.includes(post.author_id));
    if (filter === "mine") return notMuted.filter((post) => post.author_id === viewerId);
    if (filter === "liked") return notMuted.filter((post) => post.liked_by_me);
    if (filter === "popular") return [...notMuted].sort((a, b) => Number(b.like_count || 0) - Number(a.like_count || 0));
    return [...notMuted].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [feed, mutedAuthorKeys, filter, viewerId]);

  const submitPost = async () => {
    const text = composer.trim();
    const spamReason = isSpamContent(text, feed, viewerId);
    if (spamReason) {
      setError(spamReason);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, media_url: composerMedia }),
      });
      if (!res.ok) throw new Error("post");
      applyPayload(await res.json());
      setComposer("");
      setComposerMedia("");
      setError("");
    } catch {
      setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/like`, { method: "POST" });
      if (!res.ok) throw new Error("like");
      applyPayload(await res.json());
    } catch {
      setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
    }
  };

  const sendComment = async (postId) => {
    const text = String(commentDraft[postId] || "").trim();
    const spamReason = isSpamContent(text, feed, viewerId);
    if (spamReason) {
      setError(spamReason);
      return;
    }
    try {
      const res = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("comment");
      applyPayload(await res.json());
      setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
    }
  };

  const reportPost = async (postId) => {
    try {
      const res = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "content" }),
      });
      if (!res.ok) throw new Error("report");
      applyPayload(await res.json());
    } catch {
      setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
    }
  };

  const muteAuthor = async (authorKey) => {
    try {
      const res = await fetch(`/api/community/users/${encodeURIComponent(authorKey)}/mute`, { method: "POST" });
      if (!res.ok) throw new Error("mute");
      applyPayload(await res.json());
    } catch {
      setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
    }
  };

  const attachMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setComposerMedia(String(dataUrl));
    } catch {
      setError(getUiLabel("community.error.image", "Could not load the image."));
    }
  };

  return (
    <section className="community-shell" style={{ "--community-theme": color }}>
      <header className="community-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="community-kicker">{getUiLabel("community.kicker", "COMMUNITY")}</div>
          <h1>{getUiLabel("module.community", "Community")}</h1>
          <p style={{ color: "#c7d9e6", marginTop: 6 }}>{getUiLabel("community.real_backend", "Multi-user cloud feed")}</p>
        </div>
        <ModuleGuideButton moduleKey="community" color={color} />
      </header>

      <section className="community-composer-card">
        <div className="community-top-row">
          <h2>{getUiLabel("community.share_quick", "Share quick progress")}</h2>
          <div className="community-filter-wrap">
            <label htmlFor="community-filter">{getUiLabel("community.filter", "Filter")}</label>
            <select id="community-filter" value={filter} onChange={(e) => { const nextFilter = e.target.value; setFilter(nextFilter); setFeed([]); void loadFeed(1, nextFilter, false); }}>
              <option value="all">{getUiLabel("community.filter.recent", "Recent")}</option>
              <option value="popular">{getUiLabel("community.filter.popular", "Most liked")}</option>
              <option value="liked">{getUiLabel("community.filter.liked", "Liked by me")}</option>
              <option value="mine">{getUiLabel("community.filter.mine", "My posts")}</option>
            </select>
          </div>
        </div>

        <div className="community-toolbar-row">
          <button type="button" className="community-secondary-btn" onClick={() => void loadFeed(1, filter, false)}>
            <RefreshCw size={15} /> {getUiLabel("community.refresh", "Refresh")}
          </button>
          <div className="community-notification-strip">
            <span>{getUiLabel("community.posts", "Posts")}: {stats.total_posts}</span>
            <span>{getUiLabel("community.comments", "Comments")}: {stats.total_comments}</span>
            <span>{getUiLabel("community.likes", "Likes")}: {stats.total_likes}</span>
            <span><Bell size={14} style={{ verticalAlign: "middle" }} /> {getUiLabel("community.unread", "Unread")}: {notifications.unread_count || 0}</span>
          </div>
        </div>

        <textarea
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder={getUiLabel("community.placeholder", "Write an achievement, question, or study tip...")}
          rows={3}
        />

        <div className="community-composer-footer">
          <div className="community-stats">
            <span>{getUiLabel("community.real_backend", "Multi-user cloud feed")}</span>
          </div>
          <div className="community-composer-actions">
            <label className="community-upload-btn">
              <ImagePlus size={16} />
              {getUiLabel("community.media", "Media")}
              <input type="file" accept="image/*" onChange={attachMedia} hidden />
            </label>
            <button type="button" className="community-primary-btn" onClick={() => void submitPost()} disabled={submitting}>
              <Send size={16} />
              {submitting ? getUiLabel("admin.loading", "Loading...") : getUiLabel("community.publish", "Publish")}
            </button>
          </div>
        </div>
        {composerMedia ? <img src={composerMedia} alt={getUiLabel("community.preview", "Preview")} className="community-media-preview" /> : null}
      </section>

      {error ? <p className="community-error">{error}</p> : null}
      {loading ? <p className="community-loading">{getUiLabel("community.loading", "Loading feed...")}</p> : null}
      <section className="community-composer-card" style={{ marginTop: 14, marginBottom: 18 }}>
        <div className="community-top-row">
          <h2>{getUiLabel("community.notifications", "Notifications")}</h2>
          <button type="button" className="community-secondary-btn" onClick={async () => {
            try {
              const res = await fetch("/api/community/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: (notifications.items || []).filter((item) => !item.read_at).map((item) => item.id) }) });
              if (!res.ok) throw new Error("read");
              setNotifications(await res.json());
            } catch {
              setError(getUiLabel("community.error.sync", "Could not sync the feed right now."));
            }
          }}>
            {getUiLabel("community.mark_read", "Mark as read")}
          </button>
        </div>
        <div className="community-comment-list">
          {(notifications.items || []).length ? (notifications.items || []).map((item) => (
            <div key={item.id} className="community-comment-item">
              <strong>{item.actor_name || getUiLabel("community.author_you", "You")}</strong>
              <p>{item.message}</p>
            </div>
          )) : <p style={{ color: "#c7d9e6" }}>{getUiLabel("community.no_notifications", "No new notifications.")}</p>}
        </div>
      </section>

      <section className="community-feed">
        {visiblePosts.length === 0 && !loading ? <article className="community-empty">{getUiLabel("community.empty_real", "There are no posts in this filter yet.")}</article> : null}

        {visiblePosts.map((post) => {
          const isReported = reportedPostIds.includes(post.id);
          const isMuted = mutedAuthorKeys.includes(post.author_id);

          return (
            <article key={post.id} className="community-post-card">
              <header className="community-post-head">
                <div>
                  <strong>{post.author_name}</strong>
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <div className="community-post-moderation">
                  <button type="button" onClick={() => void reportPost(post.id)}>
                    <Flag size={14} />
                    {isReported ? getUiLabel("community.reported", "Reported") : getUiLabel("community.report", "Report")}
                  </button>
                  <button type="button" onClick={() => void muteAuthor(post.author_id)} disabled={isMuted || post.author_id === viewerId}>
                    <BellOff size={14} />
                    {isMuted ? getUiLabel("community.muted", "Muted") : getUiLabel("community.mute", "Mute")}
                  </button>
                </div>
              </header>

              <p className="community-post-content">{post.content}</p>
              {post.media_url ? <img src={post.media_url} alt={getUiLabel("community.media", "Media")} className="community-post-media" /> : null}

              <footer className="community-post-actions">
                <button type="button" className={post.liked_by_me ? "is-on" : ""} onClick={() => void toggleLike(post.id)}>
                  <Heart size={16} />
                  {post.like_count}
                </button>
                <span>
                  <MessageSquare size={16} />
                  {post.comment_count}
                </span>
              </footer>

              <div className="community-comment-list">
                {(post.comments || []).map((comment) => (
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
                  onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void sendComment(post.id);
                  }}
                  placeholder={getUiLabel("community.comment_placeholder", "Comment...")}
                />
                <button type="button" onClick={() => void sendComment(post.id)}>
                  <Send size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <div className="community-toolbar-row" style={{ marginTop: 18 }}>
        <span>{getUiLabel("community.page_info", "Page {page} of {total}").replace("{page}", String(pagination.page || 1)).replace("{total}", String(pagination.total_pages || 1))}</span>
        {pagination.has_more ? (
          <button type="button" className="community-secondary-btn" onClick={() => void loadFeed((page || 1) + 1, filter, true)}>
            <RefreshCw size={15} /> {getUiLabel("community.load_more", "Load more")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
