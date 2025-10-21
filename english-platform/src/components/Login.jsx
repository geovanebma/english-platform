import React, { useState } from 'react';

function LoginPage({ switchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage(`Tentando logar com ${email}...`);

    // TODO: Aqui entra a lógica de requisição POST com Axios para o backend
    // Por enquanto, apenas simula a falha ou o sucesso
    setTimeout(() => {
        if (email === 'teste@duo.com') {
            setMessage("Login simulado com sucesso! Bem-vindo!");
        } else {
            setMessage("Erro de login: Credenciais inválidas.");
        }
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Fazer Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        <button 
          type="submit"
          style={{ width: '100%', padding: '10px', backgroundColor: '#1CB0F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px' }}
        >
          ENTRAR
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Não tem uma conta?{' '}
        <a href="#" onClick={switchToRegister} style={{ color: '#58CC02', cursor: 'pointer' }}>
          Criar Conta
        </a>
      </p>
    </div>
  );
}

export default LoginPage;