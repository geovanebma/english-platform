import React, { useState } from 'react';
import LoginPage from './components/Login';
import RegisterPage from './components/Register';
import Initial from './components/Initial';

function App() {
  // O estado 'view' define qual componente será exibido
  // const [view, setView] = useState('login'); 
  const [view, setView] = useState('initial'); 

  // Funções de navegação
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
    setView('register');
  };

  return (
    <div className="App">
      {view === 'initial' ? (
        <Initial switchToRegister={switchToInitial} />
      ) : (
        <RegisterPage switchToLogin={switchToLogin} />
      )}
    </div>
  );
}

export default App;