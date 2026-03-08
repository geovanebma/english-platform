# APRESENTACAO DO PROJETO - ENGLISH PLATFORM (INSPIRED BY DUOLINGO)

## 1. Introducao
Este projeto nasceu de uma hipotese pratica:
- Eu procurava uma plataforma que unisse, em um unico lugar, as principais metodologias modernas para aprender ingles.
- Nao encontrei uma solucao completa com foco em personalizacao pedagogica, pratica diaria, revisao inteligente e experiencia de produto consistente.
- Decidi entao construir minha propria plataforma, com UX inspirada no Duolingo Web, porem com escopo mais amplo de metodologias.

Objetivo central:
- Criar uma plataforma de ingles end-to-end, com trilha de aprendizado, pratica ativa, avaliacao continua e recursos de adaptacao por perfil de aluno.

## 2. Perfil do Desenvolvedor
- Nome: Geovane Barbosa de Magalhaes Assuncao
- Funcao: Programador / Desenvolvedor Senior / Automatizador
- Atuação no projeto:
  - Arquitetura de produto e visao de plataforma
  - Desenvolvimento full-stack orientado a modulos
  - Automacao de fluxos e persistencia de progresso
  - Definicao de UX inspirada em padrao de mercado (Duolingo-like)

## 3. Visao do Produto
O English Platform foi estruturado em modulos de aprendizagem complementares, com navegacao lateral e area central de estudo.
A proposta e combinar:
- estudo estruturado
- repeticao inteligente
- avaliacao por habilidade
- interacao conversacional
- componentes de comunidade e motivacao

## 4. Modulo por Modulo - O que faz e o que falta

### 4.1 Grammar
O que faz:
- Trilha em formato de licoes
- Fluxo com exercicios de gramatica e progresso
- Visual inspirado em path system

O que falta:
- Banco robusto de exercicios por nivel CEFR
- Motor de dificuldade adaptativa por topico gramatical
- Mais cobertura de speaking tasks por cenario real

### 4.2 Flashcards
O que faz:
- Trilha inicial de decks
- Sessao com flip card
- Audio automatico e controles de estudo
- Tela de resultados
- Persistencia de sessao/progresso

O que falta:
- Algoritmo SRS avancado por cartao
- Curadoria automatica de decks por lacuna de conhecimento

### 4.3 My Vocabulary
O que faz:
- Leitura de lista de alta frequencia (wiki-100k)
- Tabela com rank, palavra, audio e learned
- Filtro, busca, ordenacao e paginacao
- Persistencia de learned no progress.json

O que falta:
- Backend com banco relacional para escalar dados
- Sincronizacao multi-dispositivo em tempo real

### 4.4 Dictionary
O que faz:
- Base de palavras em ordem alfabetica (wiki-100k2)
- Exibicao de definicoes e dados lexicais
- Leitura de idioma de origem e idioma alvo via progresso

O que falta:
- Dicionario semantico completo com API confiavel
- Melhor cobertura de sinonimos, IPA e exemplos contextualizados

### 4.5 Speak With AI
O que faz:
- Chat de pratica com correcao de frase
- Sugestao de upgrade de vocabulario
- Dica de contexto
- Entrada por texto (e suporte ao fluxo de voz)

O que falta:
- Integracao com LLM em producao (latencia, custo e observabilidade)
- Guardrails e moderacao de resposta em escala
- Avaliacao automatica mais profunda por rubrica

### 4.6 Courses
O que faz:
- Navegacao em 3 niveis: cursos -> modulos -> lessons
- Progresso e percentual por trilha

O que falta:
- Authoring tool para criar cursos sem editar codigo
- Controle de pre-requisito e certificacao formal

### 4.7 Reading Comprehension
O que faz:
- Passagens com perguntas objetivas
- Feedback e progresso

O que falta:
- Biblioteca grande de textos por nivel/tema
- Glossario contextual clicavel completo

### 4.8 Pronounce
O que faz:
- Trilhas de treino auditivo (vogais/consoantes)
- Progresso por sessao

O que falta:
- Scoring fonetico real (ASR/phoneme-level)
- Feedback tecnico de pronuncia por fonema e articulacao

### 4.9 Writing
O que faz:
- Exercicios progressivos de escrita
- Feedback de melhoria

O que falta:
- Rubricas avançadas (coerencia, coesao, registro, naturalidade)
- Modo de reescrita guiada com comparacao lado a lado

### 4.10 Games
O que faz:
- Modulo de jogo para reforco de aprendizagem
- Registro de recorde/progresso

O que falta:
- Mais modos de jogo com variedade de mecanicas
- Telemetria de aprendizado por tipo de jogo

### 4.11 Modern Methodologies
O que faz:
- Painel com abordagem moderna de estudo
- Conversa e feedback com foco em eficiencia

O que falta:
- Framework pedagogico formal com experimentacao A/B
- Evidencias por metodo (impacto em retencao e fluencia)

### 4.12 Listening
O que faz:
- Temas em lista
- Autoplay, repeat e finalizacao de treino
- Logica de reset diario

O que falta:
- Variacao robusta de sotaques e velocidades
- Curadoria maior de audio realista

### 4.13 Immersion
O que faz:
- Formato de mini-livro por tema
- Introducao, contexto e exemplos
- Mini dialogo com audio

O que falta:
- Conteudo extenso por nivel
- Rota de imersao com checkpoints avaliativos

### 4.14 Speak With Natives
O que faz:
- Lista de nativos com foto, pais, rating e info
- Entrada de call com interface de video
- Preview local + area principal remota
- Chat de apoio e historico de sessao

O que falta:
- Videochamada P2P real em producao (WebRTC + signaling server)
- Matchmaking com disponibilidade real
- Sistema de agenda, pagamento e reputacao

### 4.15 Translation Practice
O que faz:
- Exercicios EN<->PT
- Validacao com normalizacao textual
- Aceite de variacoes contextuais (ex.: good evening/good night)
- Resultado de acertos/erros com persistencia

O que falta:
- Motor semantico com IA para avaliacao contextual completa
- Banco amplo de frases por dominio e nivel

### 4.16 Test Your English Level
O que faz:
- Avaliacao por blocos (listening, reading, speaking, writing)
- Nota final e nivel estimado CEFR
- Export de resultado

O que falta:
- Banco de itens calibrado estatisticamente
- Mecanismo de prova adaptativa (CAT)

### 4.17 Community
O que faz:
- Feed com posts, comentarios e likes
- Interacoes com persistencia local de progresso

O que falta:
- Moderacao real com backend dedicado
- Feed ranking e anti-spam mais robustos

### 4.18 Music
O que faz:
- Busca de musica e exibicao de video
- Letras e suporte de audio por linha

O que falta:
- Integracao oficial completa com API de catalogo e letras
- Pipeline de traducao e licenciamento de conteudo

### 4.19 Profile
O que faz:
- Perfil do aluno com dados, metas e historico
- Persistencia das preferencias

O que falta:
- Autenticacao segura com contas reais
- Dashboard de evolucao de longo prazo

## 5. Motores Tecnicos na Coluna Direita (painel pedagogico)
Hoje o projeto ja contempla motores estrategicos:
- Revisao espacada global (SRS)
- Diagnostico adaptativo continuo
- Plano de estudo semanal automatico
- Caderno de erros recorrentes
- Avaliacao de retencao de longo prazo (7/30 dias)
- Onboarding pedagogico inicial
- Relatorios pedagogicos avancados

O que falta nesses motores:
- Melhor calibracao estatistica em producao
- Persistencia em banco robusto
- Analytics com series temporais e cohorts

## 6. Gap Tecnico para Versao Enterprise
Para apresentar como produto pronto para escala (incluindo Duolingo), os principais itens pendentes sao:

1. Banco de dados de producao
- Migrar do progress.json para arquitetura com PostgreSQL/MySQL + cache.

2. Seguranca e criptografia
- Criptografia em transito (TLS), em repouso, e protecao de PII.
- Hash de senhas, controle de sessao, RBAC e auditoria.

3. Autenticacao e identidade
- Login social real (Google/Facebook/Apple) com backend seguro.

4. Infra para IA e voz
- Orquestracao de modelos, custos, fila, observabilidade e fallback.

5. WebRTC completo
- Signaling server, TURN/STUN, relatorios de qualidade e reconexao.

6. Conteudo e dados pedagogicos
- Banco amplo de itens por CEFR, dominio e objetivo.
- Revisao linguistica e pedagogica profissional.

7. Qualidade de produto
- Testes automatizados (unit, integracao, e2e), CI/CD e monitoramento.

8. Padronizacao visual 100% Duolingo-like (sem copiar assets protegidos)
- Design system proprio, tokens, motion e acessibilidade AA.

9. Aplicativos mobile nativos
- Android (Kotlin) e iOS (Swift) com sincronizacao de progresso.

10. Escalabilidade e compliance
- LGPD/GDPR, termos, consentimento e politicas de uso.

## 7. Conclusao
O English Platform ja demonstra uma base funcional e uma visao de produto ambiciosa:
- experiencia inspirada em padroes de alto engajamento
- arquitetura modular
- foco real em metodologia e personalizacao

Proximo passo estrategico:
- evoluir de prototipo funcional para plataforma escalavel, segura e orientada a dados, pronta para benchmark com players globais.

---
Documento de apresentacao gerado em: 2026-03-07
