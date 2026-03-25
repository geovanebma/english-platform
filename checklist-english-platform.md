# Checklist do Projeto English Platform

Atualizado em: 2026-03-25

## Status Geral

### Ja feito
- [x] Eventos de telemetria (screen_view, module_open, dictionary_lookup, premium_gate)
- [x] Painel de telemetria no dashboard
- [x] Telemetria com filtro por periodo e exportacao CSV
- [x] Estrutura base da plataforma em React
- [x] Navegacao principal entre modulos
- [x] Persistencia de progresso em PostgreSQL (`english_progress_snapshots`)
- [x] API local `/api/progress` em varios fluxos
- [x] Seed inicial de progresso movido para o backend (`buildDefaultProgress`)
- [x] Novos usuarios e snapshots vazios nao dependem mais de `progress.json`
- [x] Estilo principal inspirado no Duolingo Web
- [x] Variante visual `v2` separada com identidade propria
- [x] Retomada de estado em varios modulos
- [x] Correcoes importantes de UX, fluxo e sessao
- [x] Backend real com banco de dados
- [x] Autenticacao real e multiusuario
- [x] Seguranca de sessao e criptografia
- [x] Sincronizacao cloud por conta
- [x] Base lexical no PostgreSQL (`english_wiki_words`)
- [x] Catalogo de idiomas por idioma do site (onboarding)
- [x] Landing publica com fluxo "Comecar agora"
- [x] Onboarding com idioma, meta, nivel e objetivo
- [x] Pagina de planos premium
- [x] Bloqueio premium para modulos com IA + redirecionamento para planos
- [x] Documentacao HTML dos modulos (pt-br e en)
- [x] Documentacao das tabelas do banco

### Pendente agora
- [x] Testes automatizados
- [x] Analytics e telemetria pedagogica
- [x] Acessibilidade mais forte
- [ ] Internacionalizacao completa
- [x] Code splitting/performance
- [ ] Aplicativos mobile nativos reais
- [ ] Painel administrativo de conteudo

## Modulos

### Grammar
#### Feito
- [x] Trilha principal por nivel
- [x] Unidades A1 enriquecidas
- [x] Intro de licao
- [x] Exercicios do tipo `choice`
- [x] Exercicios do tipo `order`
- [x] Exercicios do tipo `text`
- [x] Exercicios do tipo `cloze`
- [x] Exercicios do tipo `listen_choice`
- [x] Exercicios do tipo `error_spot`
- [x] Exercicios do tipo `dictation`
- [x] Exercicios do tipo `cloze_text`
- [x] Exercicios do tipo `listen_variation`
- [x] Exercicios do tipo `fix_fragment`
- [x] Exercicios do tipo `speech`
- [x] Exercicios do tipo `roleplay`
- [x] Audio automatico em etapas
- [x] Captura de fala com Web Speech API + fallback
- [x] Feedback pedagogico mais forte
- [x] Tipo de erro no feedback
- [x] Trecho problematico no feedback
- [x] Explicacao curta no feedback
- [x] Exemplo extra no feedback
- [x] Revisao adaptativa por conceito fraco
- [x] Review recomendado
- [x] Reviews inseridos no meio da trilha
- [x] Historico de erro recorrente
- [x] Questao errada volta para o fim da fila da licao
- [x] Persistencia de sessao e retomada
- [x] Guia do modulo
- [x] Guia da unidade
- [x] Tela final de conclusao
- [x] Scoring fonetico real no exercicio de fala
- [x] Integracao com caderno de erros
- [x] Integracao com My Vocabulary
- [x] Integracao com revisao espacada global
- [x] Explicacoes ainda mais granulares por erro

### Flashcards
#### Feito
- [x] Trilha de decks
- [x] Sessao com flip card
- [x] Audio automatico e por botao
- [x] Correcao do idioma do audio frente/verso
- [x] Toggle ON/OFF para atualizar My Vocabulary pela trilha
- [x] Persistencia de sessao e retomada
- [x] Logica diaria de bloqueio/desbloqueio
- [x] Deck concluido hoje fica indisponivel ate o dia seguinte
- [x] SRS melhorado por card
- [x] `interval_days`
- [x] `due_at`
- [x] `stability_days`
- [x] `difficulty`
- [x] `retrievability`
- [x] `forgetting_index`
- [x] Selecao de cards por urgencia/SRS
- [x] Correcao de nesting HTML em `FlashcardSession`
- [x] Tempo total real na tela final
- [x] Tela final redesenhada
- [x] Precisao
- [x] Ritmo medio
- [x] Revisoes prioritarias
- [x] Barras por resposta
- [x] Cards mais frageis
- [x] Agenda da proxima revisao
- [x] Modo `only difficult cards`
- [x] Indicadores de dominio por card durante a sessao
- [x] Exibir agenda de revisao tambem na trilha
- [x] Estatisticas historicas por deck
- [x] Integracao direta com revisao espacada global
- [x] FSRS/Anki-grade mais sofisticado, se desejado

### My Vocabulary
#### Feito
- [x] Leitura de `wiki-100k.txt`
- [x] Tabela com rank, palavra, ouvir e learned
- [x] Busca
- [x] Filtro
- [x] Ordenacao
- [x] Paginacao
- [x] Ignora linhas vazias
- [x] Correcao para nao pular ranks validos
- [x] Persistencia em `progress.json`
- [x] `learned_word_ids`
- [x] `learned_word_ranks`
- [x] `learned_words_csv`
- [x] Tema visual dedicado
- [x] Significado inline por palavra
- [x] Classe gramatical
- [x] Exemplo de uso
- [x] Favoritos
- [x] Recentes
- [x] Estatisticas no topo
- [x] Integracao com Flashcards
- [x] Integracao com revisao global
- [x] Busca mais semantica/tolerante

### Dictionary
#### Feito
- [x] Paginacao server-side de palavras (100 por pagina)
- [x] Cache local das paginas do Dictionary
- [x] Base a partir de `wiki-100k2.txt`
- [x] Lista alfabetica
- [x] Botao voltar
- [x] Tema visual dedicado
- [x] Leitura de idiomas do `progress.json`
- [x] Painel com significado
- [x] Sinonimos
- [x] Pronuncia basica
- [x] Ajustes de UI na lista lateral e paginacao
- [x] Exemplos de uso reais
- [x] IPA/variantes de pronuncia
- [x] Melhor fallback quando nao houver definicao

### Courses
#### Feito
- [x] Fluxo base em multiplos niveis
- [x] Lista de cursos
- [x] Modulos e lessons
- [x] Tema visual dedicado
- [x] Progresso detalhado por aula
- [x] Certificados reais
- [x] Materiais extras

### Speak With AI
#### Feito
- [x] Chat base
- [x] Entrada por texto
- [x] Base de entrada por microfone
- [x] Historico salvo em progresso
- [x] Tema visual dedicado
- [x] Correcoes e contexto exibidos
- [x] Integracao com My Vocabulary
- [x] Resposta mais natural de ponta a ponta
- [x] Integracao com IA real
- [x] Memoria de conversa mais forte
- [x] Melhor vocabulario/context-aware suggestions
- [x] Modo voz-a-voz completo

### Reading Comprehension
#### Feito
- [x] Passagens e perguntas base
- [x] Progresso e resultado
- [x] Persistencia no progresso
- [x] Glossario contextual clicavel
- [x] Explicacao por erro
- [x] Integracao com vocabulario

### Pronounce
#### Feito
- [x] Tela inicial com progresso por sons
- [x] Fluxo de exercicio auditivo
- [x] Tema visual dedicado
- [x] Feedback fonetico real
- [x] Scoring de fala
- [x] Analise de fonema/posicao da boca

### Writing
#### Feito
- [x] Trilha de exercicios
- [x] Exercicios de escrita/correcao/reescrita
- [x] Persistencia de progresso
- [x] Tema visual dedicado
- [x] Feedback mais profundo de estilo/clareza
- [x] Escrita longa guiada
- [x] Integracao com IA corretora mais forte

### Games
#### Feito
- [x] Jogo base original diferente do Duolingo
- [x] Persistencia de recorde/progresso
- [x] Tema visual dedicado
- [x] Ranking
- [x] Progressao melhor
- [x] Reaproveitamento de erros do aluno

### Modern Methodologies
#### Feito
- [x] Tela base com IA/mentor
- [x] Historico e metricas salvos
- [x] Tema visual dedicado
- [x] IA mais forte por categoria
- [x] Plano adaptativo por objetivo
- [x] Sessoes personalizadas mais profundas

### Listening
#### Feito
- [x] Lista de temas
- [x] Autoplay e repeat
- [x] Finalizar e salvar progresso
- [x] Tema visual dedicado
- [x] Sotaques diferentes
- [x] Velocidades diferentes
- [x] Reset diario mais refinado

### Immersion
#### Feito
- [x] Tela estilo livro por tema
- [x] Mini dialogo
- [x] Finalizacao com progresso
- [x] Tema visual dedicado
- [x] Checkpoints internos
- [x] Integracao com Reading/Listening

### Speak With Natives
#### Feito
- [x] Mock UI de videochamada
- [x] Lista de nativos
- [x] Preview/chat lateral
- [x] Historico salvo
- [x] Tema visual dedicado
- [x] WebRTC real
- [x] Matchmaking/agenda real
- [x] Status online real
- [x] Moderacao e seguranca

### Translation Practice
#### Feito
- [x] Trilha do modulo
- [x] Estrutura base de pratica
- [x] Mistura EN->PT e PT->EN
- [x] Persistencia de acertos/erros
- [x] Tema visual dedicado
- [x] Corretor semantico mais inteligente
- [x] Validacao por contexto com IA
- [x] Mais niveis funcionais

### Test Your English Level
#### Feito
- [x] Fluxo base por blocos
- [x] Resultado final e estatisticas
- [x] Tema visual dedicado
- [x] Avaliacao mais robusta por habilidade
- [x] Speaking real
- [x] Listening mais forte
- [x] PDF/relatorio melhor
- [x] Escala de nivel mais calibrada

### Community
#### Feito
- [x] Feed base
- [x] Posts/comentarios/likes mock
- [x] Tema visual dedicado
- [x] Backend real
- [x] Notificacoes
- [x] Moderacao real
- [x] Upload de midia
- [x] Anti-spam
- [x] Feed com paginacao real
- [x] Notificacoes reais persistidas em tabela propria

### Music
#### Feito
- [x] Estrutura do modulo
- [x] Busca/base de exibicao
- [x] Tema visual dedicado
- [x] Integracao real com YouTube API
- [x] Letras reais + traducao robusta
- [x] Linha a linha com audio
- [x] Fallback melhor sem API key

### Profile
#### Feito
- [x] Tela base de perfil
- [x] Tema visual dedicado
- [x] Estatisticas completas
- [x] Metas pessoais
- [x] Historico por modulo
- [x] Avatar/configuracoes
- [x] Badges/conquistas

## Motores Pedagogicos Transversais

### Feito parcialmente
- [x] Estrutura inicial de revisao espacada global
- [x] Estrutura inicial de diagnostico adaptativo continuo
- [x] Estrutura inicial de plano semanal automatico
- [x] Estrutura inicial de sistema de erro recorrente
- [x] Estrutura inicial de retencao 7/30 dias
- [x] Estrutura inicial de onboarding pedagogico inicial
- [x] Estrutura inicial de relatorios pedagogicos avancados

### Pendente agora
- [x] Integrar esses motores com todos os modulos
- [ ] Fazer a logica influenciar de fato os fluxos do aluno
- [x] Exibir relatorios/utilidade para o usuario final

## Fazer Futuramente

Esses pontos foram movidos para depois. Eles aumentam escala, profundidade de conteudo ou volume operacional, mas nao bloqueiam a demonstracao funcional da plataforma agora.

- [ ] Conteudo manual forte de A2 a C2
- [ ] Mais cenarios de conversacao
- [ ] Mais audio e vozes/sotaques no Grammar em larga escala
- [ ] Mais cursos reais
- [ ] Conteudo completo em escala
- [ ] Mais textos por nivel
- [ ] Perguntas em maior volume no Reading
- [ ] Mais exercicios e relatorios por som
- [ ] Mais conteudo por nivel no Writing
- [ ] Mais variedade de jogos
- [ ] Mais temas no Listening
- [ ] Mais frases no Listening
- [ ] Mais profundidade de conteudo no Immersion
- [ ] Banco maior de frases no Translation Practice
- [ ] Definicoes mais ricas e consistentes no Dictionary
- [ ] Mais significados por palavra em toda a base

## Observacoes
- [x] A pasta raiz `english-platform` continua sendo a versao principal inspirada no Duolingo
- [x] A pasta `v2` foi criada como alternativa com identidade visual propria
- [x] Todas as chaves atuais de `getUiLabel` usadas no app estao semeadas no BD ao menos em `pt-BR` e `en-US`
- [ ] Atualizar este checklist a cada bloco importante concluido

## Internacionalizacao por Tela (revisao completa)

Marcar conforme cada tela for 100% traduzida por `getUiLabel` e obedecer `source_language`.

- [x] WelcomeLanding (landing publica)
- [x] LanguageSelection (escolha de idioma)
- [x] OnboardingSignup (objetivo/meta/perfil)
- [x] Onboarding modal (inicial pedagogico)
- [x] Initial (Home/Dashboard - cards centrais)
- [x] Initial (Home/Dashboard - cards direita)
- [x] Initial (Home/Dashboard - textos de progresso/CTA no centro)
- [x] Initial (Home/Dashboard - quiz de onboarding dinamico)
- [x] Initial (Home/Dashboard - plano semanal e revisoes dinamicas)
- [x] Initial (Home/Dashboard - labels dinamicas de SRS/weekly/retention por idioma)
- [x] Initial (Home/Dashboard - cabecalho e status)
- [x] Grammar
- [x] Grammar (chrome, feedback e voz)
- [x] Grammar (conteudo base A1 com fallback por idioma)
- [x] Grammar (review adaptativo e mensagens dinamicas por idioma)
- [x] Grammar (topo, trilha, progresso e revisao recomendada por idioma)
- [x] Flashcards
- [x] My Vocabulary
- [x] Dictionary
- [x] Speak With AI
- [x] Courses
- [x] Reading Comprehension
- [x] Pronounce
- [x] Writing
- [x] Games
- [x] Modern Methodologies
- [x] Listening
- [x] Immersion
- [x] Speak With Natives
- [x] Translation Practice
- [x] Translation Practice com feedbacks, tooltip de inicio e chips de notas via `getUiLabel` + seed `pt-BR`/`en-US`/`es-ES`/`fr-FR`
- [x] Test Your English Level
- [x] Community
- [x] Music
- [x] Profile
- [x] Plans
- [x] Modern Methodologies, Music e Profile com labels restantes semeadas em `english_ui_labels` (pt-BR/en-US)
- [x] Speak With Natives, Community e Plans com labels restantes semeadas em `english_ui_labels` (pt-BR/en-US)

### Admin de Conteudo
#### Feito
- [x] Painel interno para revisar Dictionary
- [x] Painel interno para editar labels do app
- [x] Endpoint de revalidacao manual de meanings
- [x] Community backend real com posts/comentarios/likes/report/mute em tabelas PostgreSQL
- [x] Dictionary com endpoints admin para editar e refazer meanings
- [x] Painel de conteudo ligado na home para Dictionary e labels
- [x] Regras de admin/roles aplicadas no backend e no painel interno
- [x] Dictionary com status, score e notas de qualidade para meanings
- [x] Conteudo base do Grammar migrado para PostgreSQL (`english_grammar_content`) com seed multilocale
- [x] API `/api/grammar/content` ligada ao Grammar com fallback seguro
- [x] Modelagem relacional normalizada do Grammar criada no PostgreSQL (units, translations, lessons, options, answers, dialogue)
- [x] A1 do Grammar semeado nas tabelas relacionais novas em 10 idiomas
- [x] Campos textuais de licao do Grammar tambem modelados por idioma nas tabelas relacionais
- [x] API do Grammar agora prefere leitura das tabelas relacionais novas com fallback seguro
- [x] API/seed do Grammar expandidos para A2-C2 com conteudo multilocale no banco
- [x] Frontend do Grammar agora busca o nivel atual no banco, nao apenas A1
- [x] Grammar A1 agora usa mapa nativo inicial no seed relacional para frases-base visiveis em es-ES/fr-FR, com fallback seguro para os demais locales
