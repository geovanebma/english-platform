import React, { useMemo, useState } from "react";
import { ArrowLeft, Facebook, UserPlus, Mail, Lock, UserRound, Chrome } from "lucide-react";
import { registerAccount, startOAuth } from "../lib/authClient";
import { getUiLabel } from "../lib/uiLabels";

const PREMIUM_TIERS = [
  "Plano Free: progresso local e acesso base aos modulos",
  "Plano Premium: sincronizacao cloud, IA ampliada e revisao mais profunda",
  "Assinatura vinculada a usuario, pagamento e direitos de acesso",
];

function RegisterPage({ switchToLogin, switchToInitial, onAuthSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [providerMessage, setProviderMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const helper = useMemo(
    () => "No backend real, este cadastro agora cria usuario, perfil inicial, sessao segura e plano free no PostgreSQL.",
    []
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    setProviderMessage("");
    setLoading(true);
    try {
      const response = await registerAccount({ name, email, password });
      setMessage(`Conta criada para ${response.user.name}. Plano inicial: ${response.user.subscription.plan}.`);
      await onAuthSuccess?.();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Nao foi possivel criar a conta agora.");
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
    <section className="auth-shell auth-shell-register">
      <button type="button" className="auth-back-link" onClick={switchToInitial}>
        <ArrowLeft size={16} />
        {getUiLabel("common.back", "Voltar")}
      </button>

      <div className="auth-layout">
        <div className="auth-visual-card">
          <div className="auth-brand-mark">english platform</div>
          <h1>Crie sua conta e desbloqueie o progresso sincronizado.</h1>
          <p>
            O fluxo ideal e: autenticacao, perfil pedagogico, plano do usuario e depois as permissoes premium
            controladas por assinatura no banco.
          </p>
          <div className="auth-feature-list is-register">
            {PREMIUM_TIERS.map((item) => (
              <article key={item}>
                <span />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="auth-form-card">
          <div className="auth-form-head">
            <span className="auth-eyebrow">Cadastro</span>
            <h2>Criar conta</h2>
            <p>{helper}</p>
          </div>

          <div className="auth-social-stack">
            <button type="button" className="auth-social-btn is-google" onClick={() => handleSocial("Google")}>
              <Chrome size={18} />
              Inscrever-se com Google
            </button>
            <button type="button" className="auth-social-btn is-facebook" onClick={() => handleSocial("Facebook")}>
              <Facebook size={18} />
              Inscrever-se com Facebook
            </button>
          </div>

          <div className="auth-divider"><span>ou use cadastro manual</span></div>

          <form className="auth-form" onSubmit={handleRegister}>
            <label className="auth-field">
              <span>Nome</span>
              <div className="auth-input-wrap">
                <UserRound size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            </label>

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
                  placeholder="Crie uma senha"
                  required
                />
              </div>
            </label>

            <button type="submit" className="auth-primary-btn is-register" disabled={loading}>
              <UserPlus size={18} />
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          {message ? <p className="auth-feedback">{message}</p> : null}
          {providerMessage ? <p className="auth-feedback is-soft">{providerMessage}</p> : null}

          <p className="auth-switch-copy">
            Ja tem conta?{' '}
            <button type="button" onClick={switchToLogin}>
              Entrar agora
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;




