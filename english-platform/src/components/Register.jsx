import React, { useState } from 'react';
// Axios será instalado mais tarde para a comunicação real com o backend

function RegisterPage({ switchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    setMessage(`Tentando registrar ${email}...`);
    
    // TODO: Aqui entra a lógica de requisição POST com Axios para o backend
    // Por enquanto, apenas simula o sucesso:
    setTimeout(() => {
        setMessage("Registro simulado com sucesso! Agora, faça o login.");
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Criar Nova Conta</h2>
      <form onSubmit={handleRegister}>
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
          style={{ width: '100%', padding: '10px', backgroundColor: '#58CC02', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '15px' }}
        >
          REGISTRAR
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Já tem uma conta?{' '}
        <a href="#" onClick={switchToLogin} style={{ color: '#1CB0F6', cursor: 'pointer' }}>
          Fazer Login
        </a>
      </p>
    </div>
  );
}

export default RegisterPage;