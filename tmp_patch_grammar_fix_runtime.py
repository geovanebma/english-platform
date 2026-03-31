from pathlib import Path
path = Path(r'C:\Users\Geovane TI\Documents\english-platform\src\components\Grammar.jsx')
text = path.read_text(encoding='utf-8')
old = '''  const defaultCompletedByLevel = useMemo(() => {

    const byLevel = {};

    LEVEL_ORDER.forEach((levelId) => {

      byLevel[levelId] =

        levelId === "A1" ? (runtimeLevelUnitMap[levelId] || []).filter((u) => u.completed).map((u) => u.id) : [];

    });

    return byLevel;

  }, []);
'''
new = '''  const defaultCompletedByLevel = useMemo(() => {

    const byLevel = {};

    LEVEL_ORDER.forEach((levelId) => {

      byLevel[levelId] =

        levelId === "A1" ? GRAMMAR_UNITS.filter((u) => u.completed).map((u) => u.id) : [];

    });

    return byLevel;

  }, []);
'''
if old in text:
    text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
