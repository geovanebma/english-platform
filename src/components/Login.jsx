import React, { useMemo, useState } from "react";
import { ArrowLeft, Facebook, LogIn, Mail, Lock, Chrome } from "lucide-react";
import { loginAccount, startOAuth } from "../lib/authClient";
import { getUiLabel } from "../lib/uiLabels";

const PREMIUM_FEATURES = [
  "Sincronizacao segura do progresso em nuvem",
  "Revisao adaptativa entre todos os modulos",
  "Historico completo de conquistas e relatorios",
];

function LoginPage({ switchToRegister, switchToInitial, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [providerMessage, setProviderMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const emailHint = useMemo(() => "Seu login real agora passa por sessao no backend e usuario salvo no PostgreSQL.", []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setProviderMessage("");
    setLoading(true);
    try {
      const response = await loginAccount({ email, password });
      setMessage(`Conta carregada: ${response.user.name}. Plano atual: ${response.user.subscription.plan}.`);
      await onAuthSuccess?.();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Nao foi possivel entrar agora.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider) => {
    setMessage("");
    setProviderMessage(`Redirecionando para ${provider}...`);
    startOAuth(provider.toLowerCase());
  };

  return (
    <section className="auth-shell auth-shell-login">
      <button type="button" className="auth-back-link" onClick={switchToInitial}>
        <ArrowLeft size={16} />
        {getUiLabel("common.back", "Voltar")}
      </button>

      <div className="auth-layout">
        <div className="auth-visual-card">
          <div className="auth-brand-mark">english platform</div>
          <div className="auth-duo-visual">
            <img src="/img/persons/duo.png" alt="Duo" />
          </div>
          <h1>Entre e continue exatamente de onde parou.</h1>
          <p>
            O banco ideal aqui funciona por usuario: conta, progresso, assinatura premium e historico pedagogico,
            tudo sincronizado em uma sessao segura.
          </p>
          <div className="auth-feature-list">
            {PREMIUM_FEATURES.map((item) => (
              <article key={item}>
                <span />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-form-card">
          <div className="auth-form-head">
            <span className="auth-eyebrow">Acesso</span>
            <h2>Fazer login</h2>
            <p>{emailHint}</p>
          </div>

          <div className="auth-social-stack">
            <button type="button" className="auth-social-btn is-google" onClick={() => handleSocial("Google")}>
              <Chrome size={18} />
              Entrar com Google
            </button>
            <button type="button" className="auth-social-btn is-facebook" onClick={() => handleSocial("Facebook")}>
              <Facebook size={18} />
              Entrar com Facebook
            </button>
          </div>

          <div className="auth-divider"><span>ou use email</span></div>

          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Senha</span>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
              </div>
            </label>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              <LogIn size={18} />
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {message ? <p className="auth-feedback">{message}</p> : null}
          {providerMessage ? <p className="auth-feedback is-soft">{providerMessage}</p> : null}

          <p className="auth-switch-copy">
            Ainda nao tem conta?{' '}
            <button type="button" onClick={switchToRegister}>
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;




