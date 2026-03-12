import React, { useEffect, useState } from 'react';
import LoginPage from './components/Login';
import RegisterPage from './components/Register';
import Initial from './components/Initial';

function ensureAppNavigation(progress) {
  const data = progress || {};
  if (!data.app_navigation) {
    data.app_navigation = {
      root_view: 'initial',
    };
  }
  return data;
}

async function readAppNavigation() {
  const res = await fetch('/api/progress', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao ler progresso');
  return ensureAppNavigation(await res.json());
}

async function writeAppNavigation(rootView) {
  const progress = await readAppNavigation();
  progress.app_navigation = {
    ...(progress.app_navigation || {}),
    root_view: rootView,
  };

  const res = await fetch('/api/progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  });
  if (!res.ok) throw new Error('Falha ao salvar progresso');
}

function App() {
  const [view, setView] = useState('initial');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const progress = await readAppNavigation();
        const restoredView = progress?.app_navigation?.root_view;
        if (!mounted || !restoredView) return;
        setView(restoredView);
      } catch {
        // no-op
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void writeAppNavigation(view).catch(() => {
      // no-op
    });
  }, [view]);

  const switchToLogin = (e) => {
    if (e) e.preventDefault();
    setView('login');
  };

  const switchToRegister = (e) => {
    if (e) e.preventDefault();
    setView('register');
  };

  const switchToInitial = (e) => {
    if (e) e.preventDefault();
    setView('initial');
  };

  return (
    <div className="App">
      {view === 'initial' && <Initial switchToRegister={switchToRegister} />}
      {view === 'login' && <LoginPage switchToRegister={switchToRegister} switchToInitial={switchToInitial} />}
      {view === 'register' && <RegisterPage switchToLogin={switchToLogin} switchToInitial={switchToInitial} />}
    </div>
  );
}

export default App;
