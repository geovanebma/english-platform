# Personal Vocab Android

Aplicativo Android pessoal para estudar ingles com foco em vocabulario, frases, listening e revisao diaria.

## Stack

- JavaScript
- React Native
- Expo
- SQLite
- Groq API

## O que o app faz

### Words

A aba `Words` e a tela principal para gerenciar o vocabulario.

Cada linha traz:
- rank da palavra na base local
- palavra
- botao de audio
- botao de lupa para buscar traducao, meaning e exemplo
- botao de learned para marcar como aprendida
- botao `+` para incluir ou remover a palavra do study set

Comportamento atual:
- clicar na `lupa` consulta a API e salva traducao, meaning, exemplo e listening no SQLite
- clicar em `learned` marca ou desmarca a palavra como aprendida
- clicar em `+` inclui ou remove a palavra do study set
- se a palavra entrar no study set e ainda nao tiver frase, o app gera a frase automaticamente
- o `+` controla o que aparece em `Review` e `Listening`

### Review

A aba `Review` mostra flashcards baseados apenas nas palavras que estao no study set.

Fluxo atual:
- o card mostra primeiro a frase em ingles
- a palavra principal aparece destacada em outra cor
- ao tocar no card, aparece a traducao da frase
- a revisao usa a agenda simples do banco local

### Listening

A aba `Listening` usa apenas as palavras do study set.

Fluxo atual:
- lista de frases em formato vertical
- autoplay
- repeat
- pausa fixa de 3 segundos entre uma frase e outra
- paginacao
- destaque visual da palavra principal dentro da frase
- abaixo da frase aparece a traducao correta
  - se for frase, aparece a traducao da frase
  - se for palavra simples, aparece a traducao da palavra

## Persistencia local

Os dados ficam salvos em SQLite no aparelho.

O banco local guarda:
- palavra
- traducao
- meaning
- exemplo
- listeningText
- status de aprendizado
- includeInStudy
- intervalo de revisao
- historico basico de revisao

Arquivo principal da persistencia:
- `src/lib/storage.js`

## Base local de palavras

O app usa uma base local gerada em:
- `src/data/word-bank.generated.json`

Essa base hoje tem cerca de 70 mil palavras utilizaveis.

## API

O app usa a Groq API para enriquecer a palavra com:
- traducao
- meaning
- exemplo em ingles
- traducao do exemplo
- listeningText

Arquivo principal:
- `src/lib/apiClient.js`

Observacao importante:
- no Expo Go a API pode funcionar com variaveis publicas do ambiente
- no APK final e importante rebuildar sempre que a chave mudar

## Como rodar no desenvolvimento

1. Entre na pasta do app:

```powershell
cd C:\Users\Usuario\Documents\english-platform\apps\personal-vocab-android
```

2. Instale as dependencias:

```powershell
npm install
```

3. Rode o app no Expo:

```powershell
npx expo start --host lan --clear
```

## Como gerar APK

1. Fa�a login no EAS:

```powershell
npx eas login
```

2. Gere o APK:

```powershell
npm run build:android:apk
```

## Arquivos principais

- `App.js`
- `src/lib/storage.js`
- `src/lib/apiClient.js`
- `src/data/word-bank.generated.json`
- `app.json`
- `eas.json`

## O que nao subir no git

O `.gitignore` foi preparado para evitar subir:
- `node_modules`
- `.expo`
- logs
- builds de teste
- APK / AAB
- `.env`
- caches locais
- arquivos de banco local

## Resumo funcional

Hoje o app permite:
- buscar palavras na base local
- ouvir a palavra
- consultar significado e traducao com IA
- gerar frases automaticamente
- marcar palavras como aprendidas
- separar palavras no study set com o `+`
- revisar por flashcards
- ouvir frases no listening
- salvar tudo localmente no SQLite
