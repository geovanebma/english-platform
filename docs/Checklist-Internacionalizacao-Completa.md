# Checklist de Internacionalizacao Completa

Atualizado em: 2026-03-30

## Objetivo

Transformar a internacionalizacao atual em um sistema realmente completo, consistente e escalavel para toda a plataforma `english-platform`, cobrindo:

- interface
- conteudo pedagogico
- mensagens dinamicas
- backend
- banco de dados
- seeds
- QA
- operacao editorial

## Definicao de Pronto

A internacionalizacao so pode ser considerada 100% concluida quando todos estes pontos forem verdadeiros:

- [ ] Nenhuma tela relevante depende de texto hardcoded fora do sistema de labels/conteudo multilocale
- [ ] Todo texto de interface visivel ao usuario usa `getUiLabel`, banco multilocale, ou fonte editorial equivalente
- [ ] Todo texto dinamico retornado por APIs respeita o locale ativo ou tem fallback seguro
- [ ] Todo conteudo pedagogico principal tem cobertura multilocale minima definida
- [ ] Os fallbacks entre idiomas sao previsiveis, documentados e testados
- [ ] O idioma do site e o idioma de aprendizagem influenciam corretamente UI, onboarding, conteudo e feedbacks
- [ ] Fluxos novos nao entram em producao sem labels/seeds nos idiomas suportados
- [ ] Existe checklist operacional para adicionar novos idiomas sem retrabalho manual caotico

## Escopo Alvo

### Idiomas de Interface

- [ ] Confirmar lista oficial de idiomas suportados no site
- [ ] Congelar prioridade dos idiomas atuais
- [ ] Definir se o escopo minimo oficial sera `pt-BR` e `en-US` ou se inclui `es-ES` e `fr-FR` como obrigatorios
- [ ] Definir politica de suporte para `it-IT`, `de-DE`, `ja-JP`, `ko-KR`, `zh-CN`

### Idiomas de Conteudo

- [ ] Definir em quais idiomas o aluno pode estudar a partir da interface
- [ ] Definir se todo modulo precisa cobrir todos os idiomas ou se havera rollout por modulo
- [ ] Definir matriz oficial `source_language -> learning_language`

## Inventario Completo

### Frontend

- [ ] Mapear todos os componentes em `src/components`
- [ ] Marcar quais componentes ja usam `getUiLabel`
- [ ] Marcar quais ainda possuem strings hardcoded
- [ ] Marcar quais componentes dependem de texto vindo de mock local
- [ ] Marcar quais componentes dependem de texto vindo da API
- [ ] Mapear tambem modais, tooltips, placeholders, mensagens vazias, estados de erro e carregamento
- [ ] Mapear textos em `src/App.jsx`, `src/main.jsx`, `src/lib` e `src/data`

### Backend

- [ ] Mapear todos os endpoints que retornam texto ao usuario
- [ ] Marcar quais endpoints recebem `locale`
- [ ] Marcar quais endpoints inferem locale do usuario autenticado
- [ ] Marcar quais endpoints ignoram locale hoje
- [ ] Mapear mensagens de erro, validacao e sucesso retornadas pelo backend

### Banco e Seeds

- [ ] Mapear tabelas de labels UI
- [ ] Mapear tabelas de conteudo pedagogico multilocale
- [ ] Mapear tabelas que ainda guardam texto em estrutura monolocale
- [ ] Mapear seeds que cobrem apenas parte dos idiomas
- [ ] Mapear lacunas de conteudo por modulo e por idioma

## Checklist Tecnico de Interface

### Labels UI

- [ ] Garantir nomenclatura consistente de chaves `getUiLabel`
- [ ] Eliminar chaves duplicadas com significados diferentes
- [ ] Eliminar textos hardcoded em botoes
- [ ] Eliminar textos hardcoded em titulos
- [ ] Eliminar textos hardcoded em subtitulos
- [ ] Eliminar textos hardcoded em CTAs
- [ ] Eliminar textos hardcoded em placeholders
- [ ] Eliminar textos hardcoded em mensagens de erro
- [ ] Eliminar textos hardcoded em estados vazios
- [ ] Eliminar textos hardcoded em toasts e confirmacoes
- [ ] Eliminar textos hardcoded em badges e chips
- [ ] Eliminar textos hardcoded em tabelas, filtros e paginacao

### Formatos Locais

- [ ] Padronizar formatacao de datas por locale
- [ ] Padronizar formatacao de horas por locale
- [ ] Padronizar formatacao de numeros por locale
- [ ] Padronizar formatacao de porcentagens por locale
- [ ] Padronizar pluralizacao basica
- [ ] Revisar textos com interpolacao (`{count}`, `{name}`, `{section}`, etc.)
- [ ] Garantir que interpolacoes funcionem em todas as ordens sintaticas dos idiomas

### Fallbacks

- [ ] Definir fallback principal de locale
- [ ] Definir fallback quando a chave nao existir
- [ ] Definir fallback quando a traducao existir mas vier vazia
- [ ] Definir fallback quando o backend nao retornar labels
- [ ] Garantir que fallback nao quebre layout nem semantica

## Checklist por Fluxo do Produto

### Landing e Autenticacao

- [ ] WelcomeLanding 100% revisada em todos os idiomas oficiais
- [ ] Login 100% revisado em todos os idiomas oficiais
- [ ] Register 100% revisado em todos os idiomas oficiais
- [ ] Recuperacao/erros/auth states multilocale
- [ ] OAuth e mensagens de callback multilocale

### Navegacao Base

- [ ] Sidebar multilocale
- [ ] Dashboard multilocale completo
- [ ] Home cards centrais e laterais sem strings soltas
- [ ] Planos premium e premium gate sem strings soltas
- [ ] Telemetria e relatorios com labels completas
- [ ] Painel admin com labels completas

### Onboarding

- [ ] Selecao de idioma do site
- [ ] Selecao de idioma de aprendizagem
- [ ] Metas e objetivos
- [ ] Nivel inicial
- [ ] Quiz pedagogico
- [ ] Mensagens de conclusao
- [ ] Persistencia correta do locale escolhido

### Modulos

- [ ] Grammar com UI, feedback e conteudo 100% multilocale
- [ ] Flashcards com deck metadata multilocale
- [ ] My Vocabulary com labels, filtros e estados vazios multilocale
- [ ] Dictionary com meanings/examples/fallbacks coerentes por locale
- [ ] Courses com catalogo, lessons e certificados multilocale
- [ ] Speak With AI com prompts, feedbacks e erros multilocale
- [ ] Reading Comprehension com textos, perguntas e explicacoes multilocale
- [ ] Pronounce com instrucoes, feedbacks e dicas multilocale
- [ ] Writing com prompts, rubric e feedback multilocale
- [ ] Games com regras, score states e feedback multilocale
- [ ] Modern Methodologies com categorias, recomendacoes e respostas multilocale
- [ ] Listening com temas, instrucoes e finalizacoes multilocale
- [ ] Immersion com narrativas, checkpoints e CTA multilocale
- [ ] Speak With Natives com agenda, seguranca, chat e moderacao multilocale
- [ ] Translation Practice com instrucoes e feedback multilocale
- [ ] Test Your English Level com enunciados, relatorio e interpretacao multilocale
- [ ] Community com feed, acoes, moderacao e notificacoes multilocale
- [ ] Music com busca, fallback manual, letras e traducao coerentes com locale
- [ ] Profile com metas, historico, badges e configuracoes multilocale

## Conteudo Pedagogico

### Grammar

- [ ] Confirmar cobertura multilocale real de A1 a C2
- [ ] Identificar unidades que ainda so existem em ingles
- [ ] Identificar exercicios que usam feedback fixo em um idioma so
- [ ] Revisar seeds relacionais de `units`, `lessons`, `options`, `answers`, `dialogue`, `translations`
- [ ] Garantir fallback seguro quando um idioma nao tiver traducao nativa
- [ ] Garantir que explicacoes pedagogicas nao so traduzam literalmente, mas ensinem no idioma correto

### Reading / Writing / Translation / AI

- [ ] Definir politica editorial para traducao de prompts
- [ ] Definir politica para feedback gerado por IA
- [ ] Garantir que endpoints de IA recebam locale/contexto do usuario
- [ ] Garantir que respostas geradas pela IA respeitem o idioma da interface quando apropriado
- [ ] Separar o que deve ficar no idioma de estudo e o que deve ficar no idioma nativo do aluno

### Dictionary / Vocabulary

- [ ] Definir idioma principal das definicoes por locale
- [ ] Garantir consistencia entre definicao, exemplo, sinonimo e classe gramatical
- [ ] Garantir fallback editorial quando faltar definicao rica
- [ ] Garantir que o usuario nao veja mistura incoerente de idiomas no mesmo painel

## Backend e API

### Contratos

- [ ] Padronizar parametro `locale` nos endpoints relevantes
- [ ] Padronizar leitura de locale pelo perfil do usuario autenticado
- [ ] Padronizar locale para visitantes nao autenticados
- [ ] Documentar comportamento default no backend

### Respostas

- [ ] Revisar `/api/i18n/labels`
- [ ] Revisar `/api/progress`
- [ ] Revisar endpoints de Grammar
- [ ] Revisar endpoints de Dictionary
- [ ] Revisar endpoints de Community
- [ ] Revisar endpoints admin
- [ ] Revisar endpoints de IA
- [ ] Revisar endpoints de telemetria/relatorios
- [ ] Garantir que erros do backend tambem possam ser localizados

## Banco de Dados

- [ ] Documentar tabela fonte oficial das labels UI
- [ ] Documentar tabela fonte oficial do conteudo editorial multilocale
- [ ] Definir chaves unicas por `label_key + locale`
- [ ] Garantir indexes adequados para lookup por locale
- [ ] Revisar colunas textuais ainda sem normalizacao por idioma
- [ ] Criar relatorio de cobertura por locale

## Seeds e Migracoes

- [ ] Garantir seed minima de labels para todos os idiomas oficiais
- [ ] Garantir seed minima de menus, dashboard e auth
- [ ] Garantir seed minima dos modulos premium
- [ ] Garantir seed minima do admin
- [ ] Criar rotina de validacao que falhe quando chaves obrigatorias estiverem faltando
- [ ] Criar diff de labels faltantes por idioma
- [ ] Criar processo de atualizacao incremental sem sobrescrever traducao editorial boa

## QA de Internacionalizacao

### Testes Automatizados

- [ ] Testes unitarios para `getUiLabel`
- [ ] Testes unitarios para fallback de locale
- [ ] Testes unitarios para interpolacao
- [ ] Testes de integracao para carregar labels por locale
- [ ] Testes de smoke para `pt-BR`
- [ ] Testes de smoke para `en-US`
- [ ] Testes de smoke para pelo menos um terceiro idioma
- [ ] Testes para telas sem label cadastrada

### Testes Manuais

- [ ] Navegar app inteiro em `pt-BR`
- [ ] Navegar app inteiro em `en-US`
- [ ] Navegar app inteiro em `es-ES`
- [ ] Navegar app inteiro em `fr-FR`
- [ ] Validar truncamento de textos grandes
- [ ] Validar quebras de linha
- [ ] Validar responsividade mobile com textos maiores
- [ ] Validar acessibilidade com leitores de tela em idiomas diferentes

## Operacao Editorial

- [ ] Definir dono do glossario de produto
- [ ] Criar guia de tom por idioma
- [ ] Criar glossario fixo de termos do produto
- [ ] Definir termos que nunca devem ser traduzidos
- [ ] Definir termos pedagogicos sensiveis
- [ ] Criar processo para revisar traducao antes de publicar
- [ ] Criar processo para auditar labels novas apos cada feature

## Ferramentas de Apoio

- [ ] Criar script para listar chaves `getUiLabel` usadas no frontend
- [ ] Criar script para listar chaves presentes no banco
- [ ] Criar script para comparar frontend vs banco
- [ ] Criar script para apontar labels orfas
- [ ] Criar script para apontar strings hardcoded suspeitas no frontend
- [ ] Criar dashboard simples de cobertura por idioma

## Entrega por Fases

### Fase 1 - Auditoria

- [ ] Inventariar labels, strings hardcoded, endpoints e tabelas
- [ ] Fechar lista oficial de idiomas suportados
- [ ] Fechar definicao de pronto

### Fase 2 - Infra

- [ ] Fechar politica de locale e fallback
- [ ] Fechar seeds e validadores
- [ ] Fechar scripts de auditoria

### Fase 3 - UI Base

- [ ] Fechar auth, landing, onboarding, dashboard, planos e admin

### Fase 4 - Modulos

- [ ] Fechar modulo por modulo com revisao funcional

### Fase 5 - Conteudo

- [ ] Fechar lacunas editoriais e pedagogicas por idioma

### Fase 6 - QA e Congelamento

- [ ] Rodar bateria de QA multilocale
- [ ] Corrigir regressos
- [ ] Atualizar checklist principal do projeto

## Criterios de Aceite Final

- [ ] O usuario consegue trocar o idioma do site e perceber a mudanca de forma consistente
- [ ] O usuario autenticado recebe labels corretas em sessoes futuras
- [ ] Os modulos nao misturam idiomas sem intencao pedagogica
- [ ] O app continua utilizavel mesmo quando faltar uma traducao isolada
- [ ] O time consegue adicionar uma nova label sem quebrar idiomas existentes
- [ ] O time consegue adicionar um novo idioma com processo repetivel

## Observacoes

- [ ] Atualizar este arquivo a cada bloco de internacionalizacao concluido
- [ ] Quando uma tela for fechada, refletir tambem no `checklist-english-platform.md`
- [ ] Nao marcar "internacionalizacao completa" no checklist principal enquanto este arquivo nao estiver realmente fechado
