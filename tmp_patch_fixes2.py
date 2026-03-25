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

# server/index.js fixes
path = BASE / "server" / "index.js"
text = read_text(path)
if 'async function syncAdminRoles()' not in text:
    text = text.replace('function resolveUserRole(email = "") {\n  const normalized = String(email || "").trim().toLowerCase();\n  return ADMIN_EMAILS.includes(normalized) ? "admin" : "user";\n}\n', 'function resolveUserRole(email = "") {\n  const normalized = String(email || "").trim().toLowerCase();\n  return ADMIN_EMAILS.includes(normalized) ? "admin" : "user";\n}\n\nasync function syncAdminRoles() {\n  if (!ADMIN_EMAILS.length) return;\n  await pool.query(`UPDATE english_users SET role = CASE WHEN LOWER(email) = ANY($1::text[]) THEN \'admin\' ELSE role END`, [ADMIN_EMAILS]);\n}\n')
text = text.replace('  await ensureDatabase();\n  await ensurePortAvailable(PORT);', '  await ensureDatabase();\n  await syncAdminRoles();\n  await ensurePortAvailable(PORT);')
write_text(path, text)

# Initial.jsx fixes
path = BASE / "src" / "components" / "Initial.jsx"
text = read_text(path)
if 'if (activeScreen === "admin" && !isAdminUser)' in text:
    text = text.replace('  if (activeScreen === "admin") {\n    if (!isAdminUser) {\n      setActiveScreen("home");\n      return null;\n    }\n    return (\n      <ContentAdmin\n        onBack={() => setActiveScreen("home")}\n        color="#4b7bec"\n      />\n    );\n  }\n', '  if (activeScreen === "admin") {\n    if (!isAdminUser) {\n      return (\n        <section className="duo-module-shell">\n          <div className="duo-module-shell-head">\n            <button type="button" className="duo-back-btn" onClick={() => setActiveScreen("home")}>\n              {getUiLabel("common.back", "Back")}\n            </button>\n            <div>\n              <div className="duo-page-kicker">{getUiLabel("menu.content_admin", "Content admin")}</div>\n              <h1>{getUiLabel("admin.denied", "Access restricted to administrators.")}</h1>\n            </div>\n          </div>\n        </section>\n      );\n    }\n    return (\n      <ContentAdmin\n        onBack={() => setActiveScreen("home")}\n        color="#4b7bec"\n      />\n    );\n  }\n')
write_text(path, text)
