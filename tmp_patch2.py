from pathlib import Path

BASE = Path(r"C:\Users\Geovane TI\Documents\english-platform")

def read_text(path):
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return Path(path).read_text(encoding=enc)
        except Exception:
            pass
    raise RuntimeError(f"Cannot read {path}")

def write_text(path, text):
    Path(path).write_text(text, encoding="utf-8", newline="\n")

# Patch server/index.js
path = BASE / "server" / "index.js"
text = read_text(path)
anchor = '''function requireAuth(handler) {
  return async (req, res) => {
    try {
      const auth = await getCurrentAuth(req);
      if (!auth) {
        res.status(401).json({ error: "Sessao invalida ou expirada." });
        return;
      }
      req.auth = auth;
      await handler(req, res);
    } catch (error) {
      res.status(500).json({ error: "Falha de autenticacao.", detail: error.message });
    }
  };
}
'''
if 'async function getCommunityFeedPayload(userId)' not in text:
    helper = '''
function parseJsonArrayInput(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return JSON.parse(value);
  }
  return [];
}

async function getCommunityFeedPayload(userId) {
  const mutedRes = await pool.query(
    `SELECT muted_author_key
     FROM english_community_user_mutes
     WHERE muter_user_id = $1`,
    [userId]
  );
  const mutedAuthorKeys = mutedRes.rows.map((row) => row.muted_author_key);

  const reportedRes = await pool.query(
    `SELECT post_id
     FROM english_community_reports
     WHERE reporter_user_id = $1`,
    [userId]
  );
  const reportedPostIds = reportedRes.rows.map((row) => row.post_id);

  const postsRes = await pool.query(
    `SELECT p.id, p.author_key, p.author_name, p.content, p.media_url, p.created_at,
            COALESCE(l.like_count, 0)::int AS like_count,
            COALESCE(c.comment_count, 0)::int AS comment_count,
            EXISTS(
              SELECT 1
              FROM english_community_post_likes viewer_like
              WHERE viewer_like.post_id = p.id AND viewer_like.user_id = $1
            ) AS liked_by_me
     FROM english_community_posts p
     LEFT JOIN (
       SELECT post_id, COUNT(*)::int AS like_count
       FROM english_community_post_likes
       GROUP BY post_id
     ) l ON l.post_id = p.id
     LEFT JOIN (
       SELECT post_id, COUNT(*)::int AS comment_count
       FROM english_community_comments
       GROUP BY post_id
     ) c ON c.post_id = p.id
     ORDER BY p.created_at DESC
     LIMIT 80`,
    [userId]
  );

  const postIds = postsRes.rows.map((row) => row.id);
  let commentsByPost = {};
  if (postIds.length) {
    const commentsRes = await pool.query(
      `SELECT id, post_id, author_key, author_name, text, created_at
       FROM english_community_comments
       WHERE post_id = ANY($1::text[])
       ORDER BY created_at ASC`,
      [postIds]
    );
    commentsByPost = commentsRes.rows.reduce((acc, row) => {
      if (!acc[row.post_id]) acc[row.post_id] = [];
      acc[row.post_id].push({
        id: row.id,
        author_id: row.author_key,
        author_name: row.author_name,
        text: row.text,
        created_at: row.created_at,
      });
      return acc;
    }, {});
  }

  const posts = postsRes.rows
    .map((row) => ({
      id: row.id,
      author_id: row.author_key,
      author_name: row.author_name,
      content: row.content,
      media_url: row.media_url || "",
      created_at: row.created_at,
      like_count: Number(row.like_count || 0),
      liked_by_me: Boolean(row.liked_by_me),
      comment_count: Number(row.comment_count || 0),
      comments: commentsByPost[row.id] || [],
    }))
    .filter((post) => !mutedAuthorKeys.includes(post.author_id));

  const statsRes = await pool.query(
    `SELECT
        (SELECT COUNT(*)::int FROM english_community_posts) AS total_posts,
        (SELECT COUNT(*)::int FROM english_community_comments) AS total_comments,
        (SELECT COUNT(*)::int FROM english_community_post_likes) AS total_likes`
  );

  return {
    viewer_id: userId,
    posts,
    muted_author_keys: mutedAuthorKeys,
    reported_post_ids: reportedPostIds,
    stats: {
      total_posts: Number(statsRes.rows[0]?.total_posts || 0),
      total_comments: Number(statsRes.rows[0]?.total_comments || 0),
      total_likes: Number(statsRes.rows[0]?.total_likes || 0),
    },
  };
}

async function getAdminDictionaryEntry(normalizedWord) {
  const { rows } = await pool.query(
    `SELECT word, normalized_word, part_of_speech, meanings, examples, synonyms, ipa, audio_url,
            meanings_verified_count, meanings_verified_at
     FROM english_wiki_words
     WHERE normalized_word = $1
     LIMIT 1`,
    [normalizedWord]
  );
  return rows[0] || null;
}
'''
    text = text.replace(anchor, anchor + helper)

route_anchor = 'app.post("/api/profile/setup", requireAuth(async (req, res) => {'
if 'app.get("/api/community/feed"' not in text:
    routes = '''app.get("/api/community/feed", requireAuth(async (req, res) => {
  try {
    const payload = await getCommunityFeedPayload(req.auth.user.id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar feed da comunidade.", detail: error.message });
  }
}));

app.post("/api/community/posts", requireAuth(async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim();
    const mediaUrl = String(req.body?.media_url || "").trim();
    if (!content) {
      res.status(400).json({ error: "Conteudo obrigatorio." });
      return;
    }

    await pool.query(
      `INSERT INTO english_community_posts (id, author_user_id, author_key, author_name, content, media_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomId(), req.auth.user.id, req.auth.user.id, req.auth.user.name, content, mediaUrl]
    );

    res.status(201).json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao publicar post.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/like", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const existing = await pool.query(
      `SELECT 1 FROM english_community_post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
      [postId, req.auth.user.id]
    );

    if (existing.rows.length) {
      await pool.query(`DELETE FROM english_community_post_likes WHERE post_id = $1 AND user_id = $2`, [postId, req.auth.user.id]);
    } else {
      await pool.query(`INSERT INTO english_community_post_likes (post_id, user_id) VALUES ($1, $2)`, [postId, req.auth.user.id]);
    }

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao atualizar like.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/comments", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const textValue = String(req.body?.text || "").trim();
    if (!textValue) {
      res.status(400).json({ error: "Comentario obrigatorio." });
      return;
    }

    await pool.query(
      `INSERT INTO english_community_comments (id, post_id, author_user_id, author_key, author_name, text)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomId(), postId, req.auth.user.id, req.auth.user.id, req.auth.user.name, textValue]
    );

    res.status(201).json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao publicar comentario.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/report", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const reason = String(req.body?.reason || "general").trim() || "general";
    await pool.query(
      `INSERT INTO english_community_reports (id, post_id, reporter_user_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (post_id, reporter_user_id)
       DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()`,
      [randomId(), postId, req.auth.user.id, reason]
    );

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao reportar post.", detail: error.message });
  }
}));

app.post("/api/community/users/:authorKey/mute", requireAuth(async (req, res) => {
  try {
    const authorKey = String(req.params.authorKey || "").trim();
    if (!authorKey || authorKey == req.auth.user.id) {
      res.status(400).json({ error: "Autor invalido para mute." });
      return;
    }

    await pool.query(
      `INSERT INTO english_community_user_mutes (id, muter_user_id, muted_author_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (muter_user_id, muted_author_key) DO NOTHING`,
      [randomId(), req.auth.user.id, authorKey]
    );

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao silenciar autor.", detail: error.message });
  }
}));

app.get("/api/admin/dictionary/entries", requireAuth(async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const limit = Math.min(80, Math.max(10, Number(req.query.limit || 30)));
    const params = [];
    let where = "";
    if (search) {
      params.push(`${search}%`);
      where = `WHERE word ILIKE $${params.length}`;
    }
    params.push(limit);

    const { rows } = await pool.query(
      `SELECT word, normalized_word, part_of_speech, meanings, examples, synonyms, ipa, audio_url,
              meanings_verified_count, meanings_verified_at
       FROM english_wiki_words
       ${where}
       ORDER BY word ASC
       LIMIT $${params.length}`,
      params
    );

    res.json({ entries: rows });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar entradas do dicionario.", detail: error.message });
  }
}));

app.patch("/api/admin/dictionary/entries/:word", requireAuth(async (req, res) => {
  try {
    const rawWord = String(req.params.word || "").trim();
    const normalized = normalizeLookupWord(rawWord);
    const entry = await ensureWikiWord(normalized, rawWord);
    if (!entry) {
      res.status(404).json({ error: "Entrada nao encontrada." });
      return;
    }

    const meanings = parseJsonArrayInput(req.body?.meanings);
    const examples = parseJsonArrayInput(req.body?.examples);
    const synonyms = parseJsonArrayInput(req.body?.synonyms);
    const partOfSpeech = String(req.body?.part_of_speech || "").trim();
    const ipa = String(req.body?.ipa || "").trim();
    const audioUrl = String(req.body?.audio_url || "").trim();

    await pool.query(
      `UPDATE english_wiki_words
       SET part_of_speech = $2,
           meanings = $3::jsonb,
           examples = $4::jsonb,
           synonyms = $5::jsonb,
           ipa = $6,
           audio_url = $7
       WHERE normalized_word = $1`,
      [normalized, partOfSpeech, JSON.stringify(meanings), JSON.stringify(examples), JSON.stringify(synonyms), ipa, audioUrl]
    );

    res.json({ entry: await getAdminDictionaryEntry(normalized) });
  } catch (error) {
    res.status(400).json({ error: "Falha ao salvar entrada do dicionario.", detail: error.message });
  }
}));

app.post("/api/admin/dictionary/reverify/:word", requireAuth(async (req, res) => {
  try {
    const rawWord = String(req.params.word || "").trim();
    const normalized = normalizeLookupWord(rawWord);
    await ensureWikiWord(normalized, rawWord);
    const apiData = await fetchDictionaryFromApis(rawWord, "pt");
    if (!apiData || !Array.isArray(apiData.meanings) || !apiData.meanings.length) {
      res.status(404).json({ error: "Nao foi possivel refazer meanings para esta palavra." });
      return;
    }

    await pool.query(
      `UPDATE english_wiki_words
       SET part_of_speech = $2,
           meanings = $3::jsonb,
           examples = $4::jsonb,
           synonyms = $5::jsonb,
           ipa = $6,
           audio_url = $7,
           meanings_verified_count = meanings_verified_count + 1,
           meanings_verified_at = NOW()
       WHERE normalized_word = $1`,
      [
        normalized,
        apiData.partOfSpeech || "",
        JSON.stringify(apiData.meanings || []),
        JSON.stringify(apiData.examples || []),
        JSON.stringify(apiData.synonyms || []),
        apiData.ipa || "",
        apiData.audioUrl || "",
      ]
    );

    res.json({ entry: await getAdminDictionaryEntry(normalized) });
  } catch (error) {
    res.status(500).json({ error: "Falha ao refazer meanings.", detail: error.message });
  }
}));

app.get("/api/admin/i18n/labels", requireAuth(async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const locale = String(req.query.locale || "").trim();
    const params = [];
    const where = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`label_key ILIKE $${params.length}`);
    }
    if (locale) {
      params.push(locale);
      where.push(`locale = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT label_key, locale, text_value, updated_at
       FROM english_ui_labels
       ${whereSql}
       ORDER BY label_key ASC, locale ASC
       LIMIT 200`,
      params
    );

    res.json({ labels: rows });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar labels.", detail: error.message });
  }
}));

app.patch("/api/admin/i18n/labels/:labelKey", requireAuth(async (req, res) => {
  try {
    const labelKey = decodeURIComponent(String(req.params.labelKey || "").trim());
    const locale = String(req.body?.locale || "").trim();
    const textValue = String(req.body?.text_value || "");
    if (!labelKey || !locale) {
      res.status(400).json({ error: "Label e idioma sao obrigatorios." });
      return;
    }

    const id = `${locale}__${labelKey}`;
    await pool.query(
      `INSERT INTO english_ui_labels (id, label_key, locale, text_value, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (label_key, locale)
       DO UPDATE SET text_value = EXCLUDED.text_value, updated_at = NOW()`,
      [id, labelKey, locale, textValue]
    );

    const { rows } = await pool.query(
      `SELECT label_key, locale, text_value, updated_at
       FROM english_ui_labels
       WHERE label_key = $1 AND locale = $2
       LIMIT 1`,
      [labelKey, locale]
    );

    res.json({ label: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar label.", detail: error.message });
  }
}));

'''
    text = text.replace(route_anchor, routes + route_anchor)
write_text(path, text)

# Patch Initial.jsx
path = BASE / "src" / "components" / "Initial.jsx"
text = read_text(path)
if 'import ContentAdmin from "./ContentAdmin";' not in text:
    text = text.replace('import PlansPage from "./Plans";\n', 'import PlansPage from "./Plans";\nimport ContentAdmin from "./ContentAdmin";\n')
if 'if (activeScreen === "admin")' not in text:
    text = text.replace('  if (activeScreen === "module") {\n\n    return (\n\n      <PlaceholderScreen', '  if (activeScreen === "admin") {\n    return (\n      <ContentAdmin\n        onBack={() => setActiveScreen("home")}\n        color="#4b7bec"\n      />\n    );\n  }\n\n  if (activeScreen === "module") {\n\n    return (\n\n      <PlaceholderScreen')
if 'dashboard.open_admin' not in text:
    text = text.replace('        <div className="duo-info-card duo-srs-card">', '        <div className="duo-info-card">\n          <div className="duo-info-head">\n            <span>{getUiLabel("menu.content_admin", "Content admin")}</span>\n            <button type="button" onClick={() => setActiveScreen("admin")}>CMS</button>\n          </div>\n          <p className="duo-onboarding-copy">{getUiLabel("dashboard.admin_copy", "Edit app labels and review dictionary entries from one internal panel.")}</p>\n          <div className="duo-report-actions">\n            <button type="button" onClick={() => setActiveScreen("admin")}>\n              <NotebookPen size={14} />\n              {getUiLabel("dashboard.open_admin", "Open admin")}\n            </button>\n            <button type="button" className="is-secondary" onClick={() => openModuleByKey("community")}>\n              <Users size={14} />\n              {getUiLabel("module.community", "Community")}\n            </button>\n          </div>\n        </div>\n\n        <div className="duo-info-card duo-srs-card">')
write_text(path, text)

# Patch checklist
path = BASE / "checklist-english-platform.md"
text = read_text(path)
text = text.replace('- [ ] Backend real', '- [x] Backend real')
if '### Admin de Conteudo' not in text:
    text += '\n\n### Admin de Conteudo\n#### Feito\n- [x] Painel interno para revisar Dictionary\n- [x] Painel interno para editar labels do app\n- [x] Endpoint de revalidacao manual de meanings\n'
extra = '\n- [x] Community backend real com posts/comentarios/likes/report/mute em tabelas PostgreSQL\n- [x] Dictionary com endpoints admin para editar e refazer meanings\n- [x] Painel de conteudo ligado na home para Dictionary e labels\n'
if 'Community backend real com posts/comentarios/likes/report/mute em tabelas PostgreSQL' not in text:
    text += extra
write_text(path, text)
