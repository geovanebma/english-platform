# Documentação das Tabelas do Banco

Este arquivo resume as tabelas atuais do backend do `english-platform`, o papel de cada uma e como elas se relacionam com autenticação, progresso, plano do usuário e catálogo lexical.

## Visão geral

Hoje o backend Node + PostgreSQL usa um conjunto pequeno de tabelas com foco em:

- autenticação real
- login social
- sessão persistida
- assinatura/plano
- snapshot de progresso por usuário
- catálogo de idiomas
- base lexical do `wiki-100k.txt`

## Tabelas

### `english_users`

Tabela principal de usuários.

**Função**
- guardar a conta base de cada pessoa
- centralizar nome, email e origem de autenticação

**Campos principais**
- `id`: identificador único do usuário
- `name`: nome exibido
- `email`: email único
- `password_hash`: hash da senha local
- `auth_source`: origem do login (`local`, `google`, `facebook`)
- `created_at`
- `updated_at`

**Observação**
- é a tabela-pai das demais tabelas de perfil, assinatura, sessão e progresso

### `english_user_profiles`

Tabela de preferências e perfil pedagógico inicial do usuário.

**Função**
- guardar idioma de origem, idioma estudado e contexto de aprendizado

**Campos principais**
- `user_id`: referência ao usuário
- `source_language`: idioma base do aluno
- `learning_language`: idioma aprendido
- `goal`: objetivo principal
- `estimated_level`: nível estimado
- `ui_language`: idioma da interface/site
- `referral_source`: de onde veio a descoberta do produto
- `proficiency_label`: quanto o aluno já entende do idioma
- `daily_goal_minutes`: meta diária
- `notifications_enabled`: permissão de notificações
- `start_mode`: começar do zero ou encontrar o nível
- `created_at`
- `updated_at`

**Exemplo de uso**
- onboarding pedagógico
- personalização inicial de trilha

### `english_subscriptions`

Tabela de plano e assinatura.

**Função**
- guardar o estado comercial da conta
- separar usuário `free` de `premium`

**Campos principais**
- `id`
- `user_id`
- `plan`: `free` ou `premium`
- `status`: status da assinatura
- `provider`: provedor da assinatura
- `started_at`
- `renewal_at`
- `updated_at`

**Exemplo de uso**
- travar/liberar recursos premium
- exibir plano atual no perfil

### `english_auth_identities`

Tabela de identidades sociais vinculadas.

**Função**
- ligar a conta interna ao provedor de autenticação social

**Campos principais**
- `id`
- `user_id`
- `provider`: `google` ou `facebook`
- `provider_user_id`
- `provider_email`
- `created_at`

**Exemplo de uso**
- login com Google
- login com Facebook

### `english_auth_sessions`

Tabela de sessões ativas.

**Função**
- manter a sessão real no backend
- permitir logout, expiração e rastreio de uso

**Campos principais**
- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `created_at`
- `last_seen_at`
- `user_agent`
- `ip_address`

**Exemplo de uso**
- cookie `httpOnly`
- rota `/api/auth/me`
- logout seguro

### `english_progress_snapshots`

Tabela de snapshot do progresso do usuário.

**Função**
- guardar todo o estado pedagógico da plataforma por conta
- substituir gradualmente a dependência exclusiva do `progress.json`

**Campos principais**
- `user_id`
- `progress_json`
- `updated_at`

**Exemplo de uso**
- quando o usuário autenticado abre a plataforma, o backend carrega esse snapshot
- quando a pessoa estuda e salva progresso, o backend atualiza esse JSON no PostgreSQL

**Observação importante**
- hoje essa tabela funciona como a ponte entre o estado local e a sincronização cloud por conta
- no futuro, módulos mais críticos podem ser normalizados em tabelas próprias

### `english_language_catalog`

Tabela de catálogo de idiomas por idioma-base do site.

**Função**
- controlar quais idiomas podem ser aprendidos a partir de cada idioma da interface
- abastecer a tela “Eu quero aprender...”

**Campos principais**
- `id`
- `site_language`
- `site_language_label`
- `learning_language`
- `learning_label`
- `native_label`
- `flag`
- `learners_display`
- `sort_order`

**Exemplo de uso**
- se o site estiver em `pt-BR`, o backend devolve o conjunto compatível para português
- se o site estiver em `en-US`, o backend devolve um conjunto maior de idiomas

### english_wiki_words

Tabela lexical base do dicionário (palavras + significados).

**Função**
- armazenar no PostgreSQL as 100.000 palavras mais frequentes da base Wiki
- guardar significados, exemplos, sinonimos e pronuncia na mesma tabela

**Campos principais**
- ank_order: posição da palavra na lista de frequência
- word: palavra original do arquivo
- 
ormalized_word: forma normalizada para busca
- part_of_speech: classe gramatical principal
- meanings: array JSON com significados (cada item com partOfSpeech, english, source)
- examples: array JSON com exemplos
- synonyms: array JSON com sinonimos
- ipa: transcricao fonetica
- udio_url: link de audio (quando disponivel)
- created_at

**Exemplo de uso**
- Dictionary consulta primeiro essa tabela
- se faltar significado, o backend busca via API e grava aqui
- My Vocabulary pode reutilizar a mesma base

**Observação importante**
- a importação do wiki-100k.txt roda automaticamente se a tabela estiver vazia
- o preenchimento de significados acontece sob demanda## Relação entre as tabelas

### Fluxo de conta
1. cria conta em `english_users`
2. cria perfil em `english_user_profiles`
3. cria plano inicial em `english_subscriptions`
4. cria snapshot inicial em `english_progress_snapshots`

### Fluxo de login social
1. provedor retorna identidade
2. sistema procura em `english_auth_identities`
3. vincula/atualiza a identidade
4. abre sessão em `english_auth_sessions`

### Fluxo de progresso
1. frontend chama `/api/progress`
2. se houver sessão válida, o backend lê `english_progress_snapshots`
3. se não houver login, o app pode continuar com fallback local
4. ao salvar, o snapshot do usuário é atualizado

### Fluxo de onboarding
1. o usuário escolhe o idioma do site
2. o sistema consulta `english_language_catalog`
3. o usuário escolhe o idioma que quer aprender
4. o backend salva perfil pedagógico em `english_user_profiles`
5. o backend atualiza `english_progress_snapshots` com:
   - onboarding concluído
   - plano semanal
   - recomendação inicial de módulo
   - idioma de origem e idioma estudado

### Fluxo de base lexical
1. o backend cria a tabela `english_wiki_words`
2. se ela estiver vazia, lê `wiki-100k.txt`
3. remove comentários e linhas auxiliares
4. grava a posição, a palavra e a versão normalizada no PostgreSQL
5. outros módulos podem consultar a base sem depender diretamente do arquivo texto

## O que ainda pode virar tabela no futuro

Esses blocos hoje podem continuar dentro de `progress_json`, mas são candidatos naturais à normalização:

- progresso detalhado de `flashcards` por card
- progresso de `grammar` por unidade
- caderno de erros recorrentes
- relatórios pedagógicos históricos
- eventos de analytics
- conquistas/badges em tabela própria

## Resumo prático

Se você precisar explicar o banco em uma frase:

> O banco foi estruturado para suportar conta real, login social, plano premium, sincronização do progresso por usuário e uma base lexical reutilizável para os módulos pedagógicos.

### `english_dictionary_senses`

Tabela de sentidos/definicoes por palavra (suporta multiplos significados).

**Funcao**
- armazenar definicoes por palavra com ordem, classe gramatical e exemplos

**Campos principais**
- `id`
- `word`: referencia para `english_wiki_words.word`
- `sense_order`: ordem do significado
- `part_of_speech`: classe gramatical (noun, verb, adjective, etc.)
- `definition`: definicao em ingles
- `definition_pt`: definicao em portugues (opcional)
- `examples`: array JSON com exemplos
- `synonyms`: array JSON com sinonimos
- `created_at`

**Exemplo de uso**
- mostrar multiplos significados no Dictionary
- exibir classe gramatical por sentido

### `english_dictionary_pronunciations`

Tabela de pronuncia e IPA por palavra.

**Funcao**
- guardar IPA e link de audio por palavra

**Campos principais**
- `id`
- `word`: referencia para `english_wiki_words.word`
- `ipa`: transcricao fonetica
- `audio_url`: url para audio (se houver)
- `created_at`

**Exemplo de uso**
- exibir IPA no Dictionary
- tocar pronuncia por palavra

