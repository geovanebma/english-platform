import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Headphones,
  MessageCircleMore,
  PenSquare,
  Volume2,
  X,
} from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const GRAMMAR_EN_TEXT = {
  "Cumprimentos basicos em diferentes momentos do dia, com foco em contexto e naturalidade.": "Basic greetings for different times of day, with focus on context and naturalness.",
  "Use good morning ate o inicio da tarde.": "Use good morning until early afternoon.",
  "Good afternoon cobre a tarde.": "Good afternoon covers the afternoon.",
  "Good evening costuma ser usado ao chegar ou cumprimentar a noite.": "Good evening is usually used when arriving or greeting someone at night.",
  "Voce escolhe o cumprimento correto sem depender de traducao literal.": "You choose the correct greeting without depending on literal translation.",
  "Selecione a traducao correta para 'Good morning'.": "Select the correct translation for 'Good morning'.",
  "Good morning corresponde ao cumprimento usado pela manha.": "Good morning matches the greeting used in the morning.",
  "Toque no que voce escutar.": "Tap what you hear.",
  "Neste contexto, good evening aponta para um cumprimento noturno.": "In this context, good evening points to a nighttime greeting.",
  "Monte a frase: 'Good evening, Maria.'": "Build the sentence: 'Good evening, Maria.'",
  "A ordem correta reforca a traducao completa da saudacao.": "The correct order reinforces the full translation of the greeting.",
  "Complete a frase com a melhor opcao.": "Complete the sentence with the best option.",
  "A manha pede good morning, nao evening nem night.": "Morning calls for good morning, not evening or night.",
  "Escreva em portugues: 'Good afternoon, teacher.'": "Write in Portuguese: 'Good afternoon, teacher.'",
  "Good afternoon e usado na parte da tarde.": "Good afternoon is used in the afternoon.",
  "Fale em ingles: 'Good morning, everyone.'": "Say in English: 'Good morning, everyone.'",
  "Repita a saudacao completa em voz alta para consolidar a pronuncia.": "Repeat the full greeting out loud to reinforce pronunciation.",
  "Perguntar e responder nomes com estrutura simples e educada.": "Ask and answer names with a simple and polite structure.",
  "Qual frase significa 'Qual e o seu nome?'": "Which sentence means 'What is your name?'",
  "What is your name e a forma padrao para perguntar o nome de alguem.": "What is your name is the standard way to ask someone's name.",
  "Qual opcao corrige a frase abaixo?": "Which option corrects the sentence below?",
  "Com my name, o verbo correto e is.": "With my name, the correct verb is is.",
  "Monte a resposta em ingles para 'Meu nome e Julia'.": "Build the answer in English for 'My name is Julia'.",
  "A estrutura completa da resposta e My name is Julia.": "The full answer structure is My name is Julia.",
  "Complete em ingles com sua propria resposta.": "Complete in English with your own answer.",
  "A lacuna exige a forma correta do verbo to be para apresentacao.": "The blank requires the correct form of the verb to be for introductions.",
  "Introducoes sociais com resposta curta, escuta e escrita guiada.": "Social introductions with short responses, listening, and guided writing.",
  "Escolha a traducao de 'Nice to meet you'.": "Choose the translation of 'Nice to meet you'.",
  "A expressao indica prazer ao conhecer alguem.": "The expression shows pleasure when meeting someone.",
  "Escute e selecione a melhor resposta em portugues.": "Listen and select the best answer in Portuguese.",
  "O too indica reciprocidade: tambem.": "The too indicates reciprocity: too.",
  "Escreva em ingles: 'Prazer em conhecer voce tambem.'": "Write in English: 'Nice to meet you too.'",
  "A resposta padrao usa too ao final.": "The standard response uses too at the end.",
  "Fale a resposta em ingles para 'Prazer em conhecer voce tambem.'": "Say the answer in English for 'Nice to meet you too.'",
  "A resposta falada ajuda a automatizar a troca social completa.": "The spoken response helps automate the full social exchange.",
  "Respostas curtas para perguntar e responder como alguem esta.": "Short answers to ask and respond how someone is.",
  "Escolha a melhor resposta para 'How are you?'": "Choose the best answer for 'How are you?'.",
  "A resposta adequada informa como voce esta e pode incluir um agradecimento.": "An appropriate answer says how you are and may include thanks.",
  "Escreva exatamente o que voce escutar.": "Write exactly what you hear.",
  "A frase usa uma resposta curta e natural para how are you.": "The sentence uses a short and natural response to how are you.",
  "Afirmacoes basicas com am, is e are em contexto simples.": "Basic affirmative sentences with am, is and are in simple contexts.",
  "Com I, usamos am.": "With I, we use am.",
  "Escolha a forma correta do verbo.": "Choose the correct verb form.",
  "Com she, a forma correta e is.": "With she, the correct form is is.",
  "Corrija o trecho errado da frase.": "Correct the wrong part of the sentence.",
  "Com they, usamos are.": "With they, we use are.",
  "Numeros basicos para idade, telefone, quarto de hotel e horario.": "Basic numbers for age, phone number, hotel room and time.",
  "Qual e o numero 'seven'?": "Which number is 'seven'?",
  "Seven corresponde ao numero 7.": "Seven corresponds to number 7.",
  "Escute o numero e selecione a opcao correta.": "Listen to the number and select the correct option.",
  "Ten corresponde ao numero 10.": "Ten corresponds to number 10.",
  "Ouca o numero em velocidades diferentes e selecione o numero correto.": "Listen to the number at different speeds and select the correct number.",
  "A mesma palavra deve ser reconhecida mesmo com variacao de velocidade.": "The same word should be recognized even with speed variation.",
  "Rotina diaria com verbos frequentes e horarios simples.": "Daily routine with common verbs and simple times.",
  "Escolha a traducao correta para 'I brush my teeth'.": "Select the correct translation for 'I brush my teeth'.",
  "Brush my teeth indica a acao de escovar os dentes.": "Brush my teeth indicates the action of brushing your teeth.",
  "Escreva em ingles: 'Eu acordo as sete.'": "Write in English: 'I wake up at seven.'",
  "Wake up e a estrutura esperada para acordar.": "Wake up is the expected structure for waking up.",
  "Escolha a frase correta.": "Choose the correct sentence.",
  "Na terceira pessoa do singular, o verbo recebe s.": "In the third person singular, the verb takes s.",
  "Escreva o que voce escutar sobre rotina.": "Write what you hear about routine.",
  "O ditado reforca a terceira pessoa e o horario na frase completa.": "The dictation reinforces third person and time in the full sentence.",
  "Pedidos simples em restaurante, menu e preferencia de comida.": "Simple requests in a restaurant, menu use and food preference.",
  "Pizza e contavel aqui, entao usamos a.": "Pizza is countable here, so we use a.",
  "A estrutura educada para pedir o menu comeca com Can I see...": "The polite structure for asking for the menu starts with Can I see...",
  "A fala do cliente informa claramente os dois itens pedidos.": "The customer's line clearly states the two requested items.",
  "Complete a lacuna com a palavra correta em ingles.": "Complete the blank with the correct word in English.",
  "A palavra-chave do pedido continua sendo menu.": "The key word in the request is still menu."
  ,"Uso em contexto real": "Use in real context."
  ,"Memorizacao isolada": "Isolated memorization"
  ,"Traducao literal sem contexto": "Literal translation without context"
};

function translateGrammarText(text, locale = "pt-BR") {
  if (!text || String(locale || "").toLowerCase().startsWith("pt")) return text;
  const normalized = String(locale || "").toLowerCase();
  const levelPromptMatch = String(text).match(/^Tema\s+([A-Z0-9]+):\s+(.+)\.\s+Qual opcao representa o foco correto da licao\?$/);
  if (levelPromptMatch) {
    return `Theme ${levelPromptMatch[1]}: ${levelPromptMatch[2]}. Which option best represents the lesson focus?`;
  }
  if (normalized.startsWith("en")) {
    return GRAMMAR_EN_TEXT[text] || text;
  }
  return GRAMMAR_EN_TEXT[text] || text;
}

function grammarLocaleText(locale = "pt-BR", ptText, enText) {
  return String(locale || "").toLowerCase().startsWith("pt") ? ptText : enText;
}

function localizeGrammarUnit(unit, locale = "pt-BR") {
  return {
    ...unit,
    summary: translateGrammarText(unit.summary, locale),
    masterySignal: translateGrammarText(unit.masterySignal, locale),
    guidePoints: Array.isArray(unit.guidePoints) ? unit.guidePoints.map((item) => translateGrammarText(item, locale)) : unit.guidePoints,
    lessons: Array.isArray(unit.lessons)
      ? unit.lessons.map((lesson) => ({
          ...lesson,
          prompt: translateGrammarText(lesson.prompt, locale),
          explanation: translateGrammarText(lesson.explanation, locale),
          options: Array.isArray(lesson.options) ? lesson.options.map((item) => translateGrammarText(item, locale)) : lesson.options,
          answer: translateGrammarText(lesson.answer, locale),
          acceptedAnswers: Array.isArray(lesson.acceptedAnswers) ? lesson.acceptedAnswers.map((item) => translateGrammarText(item, locale)) : lesson.acceptedAnswers,
          answerTokens: Array.isArray(lesson.answerTokens) ? lesson.answerTokens.map((item) => translateGrammarText(item, locale)) : lesson.answerTokens,
          bank: Array.isArray(lesson.bank) ? lesson.bank.map((item) => translateGrammarText(item, locale)) : lesson.bank,
        }))
      : unit.lessons,
  };
}




const BASE_EXERCISE_UNITS = [

  {

    id: "u1",

    title: "Good morning / afternoon / evening",

    summary: "Cumprimentos basicos em diferentes momentos do dia, com foco em contexto e naturalidade.",

    focusSkills: ["greeting", "listening", "translation"],

    guidePoints: [
      "Use good morning ate o inicio da tarde.",
      "Good afternoon cobre a tarde.",
      "Good evening costuma ser usado ao chegar ou cumprimentar a noite.",
    ],

    masterySignal: "Voce escolhe o cumprimento correto sem depender de traducao literal.",

    conceptKey: "greetings_time_of_day",

    lessons: [

      {

        id: "greet-1",

        type: "choice",

        prompt: "Selecione a traducao correta para 'Good morning'.",

        options: ["Boa noite", "Bom dia", "Boa tarde"],

        answer: "Bom dia",

        explanation: "Good morning corresponde ao cumprimento usado pela manha.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-2",

        type: "listen_choice",

        prompt: "Toque no que voce escutar.",

        audioText: "Good evening, Maria.",

        options: ["Boa tarde, Maria.", "Boa noite, Maria.", "Bom dia, Maria."],

        answer: "Boa noite, Maria.",

        explanation: "Neste contexto, good evening aponta para um cumprimento noturno.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-3",

        type: "order",

        prompt: "Monte a frase: 'Good evening, Maria.'",

        answerTokens: ["Boa", "noite,", "Maria."],

        bank: ["Maria.", "Boa", "tarde", "noite,", "Bom"],

        explanation: "A ordem correta reforca a traducao completa da saudacao.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-4",

        type: "cloze",

        prompt: "Complete a frase com a melhor opcao.",

        sentence: "When I arrive at the office at 8 a.m., I say ___ to everyone.",

        options: ["good morning", "good evening", "good night"],

        answer: "good morning",

        explanation: "A manha pede good morning, nao evening nem night.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-5",

        type: "text",

        prompt: "Escreva em portugues: 'Good afternoon, teacher.'",

        answer: "Boa tarde, professor.",

        acceptedAnswers: ["Boa tarde, professora."],

        explanation: "Good afternoon e usado na parte da tarde.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-6",

        type: "speech",

        prompt: "Fale em ingles: 'Good morning, everyone.'",

        audioText: "Good morning, everyone.",

        answer: "Good morning, everyone.",

        acceptedAnswers: ["good morning everyone"],

        explanation: "Repita a saudacao completa em voz alta para consolidar a pronuncia.",

        conceptKey: "greetings_time_of_day",

      },

    ],

  },

  {

    id: "u2",

    title: "Asking and saying the name",

    summary: "Perguntar e responder nomes com estrutura simples e educada.",

    focusSkills: ["introduction", "question forms"],

    conceptKey: "asking_names",

    lessons: [

      {

        id: "name-1",

        type: "choice",

        prompt: "Qual frase significa 'Qual e o seu nome?'",

        options: ["Where are you?", "What is your name?", "How old are you?"],

        answer: "What is your name?",

        explanation: "What is your name e a forma padrao para perguntar o nome de alguem.",

        conceptKey: "asking_names",

      },

      {

        id: "name-2",

        type: "error_spot",

        prompt: "Qual opcao corrige a frase abaixo?",

        sentence: "My name are Julia.",

        options: ["My name is Julia.", "My name am Julia.", "My name be Julia."],

        answer: "My name is Julia.",

        explanation: "Com my name, o verbo correto e is.",

        conceptKey: "asking_names",

      },

      {

        id: "name-3",

        type: "order",

        prompt: "Monte a resposta em ingles para 'Meu nome e Julia'.",

        answerTokens: ["My", "name", "is", "Julia."],

        bank: ["My", "is", "Julia.", "name", "your"],

        explanation: "A estrutura completa da resposta e My name is Julia.",

        conceptKey: "asking_names",

      },

      {

        id: "name-4",

        type: "cloze_text",

        prompt: "Complete em ingles com sua propria resposta.",

        sentence: "My name ___ Julia.",

        answer: "is",

        acceptedAnswers: ["'s"],

        explanation: "A lacuna exige a forma correta do verbo to be para apresentacao.",

        conceptKey: "asking_names",

      },

    ],

  },

  {

    id: "u3",

    title: "Nice to meet you",

    summary: "Introducoes sociais com resposta curta, escuta e escrita guiada.",

    focusSkills: ["social", "response", "writing"],

    conceptKey: "meeting_people",

    lessons: [

      {

        id: "meet-1",

        type: "choice",

        prompt: "Escolha a traducao de 'Nice to meet you'.",

        options: ["Prazer em conhecer voce", "Vejo voce amanha", "Com licenca"],

        answer: "Prazer em conhecer voce",

        explanation: "A expressao indica prazer ao conhecer alguem.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-2",

        type: "listen_choice",

        prompt: "Escute e selecione a melhor resposta em portugues.",

        audioText: "Nice to meet you too.",

        options: ["Prazer em conhecer voce tambem.", "Ate amanha.", "Eu estou bem."],

        answer: "Prazer em conhecer voce tambem.",

        explanation: "O too indica reciprocidade: tambem.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-3",

        type: "text",

        prompt: "Escreva em ingles: 'Prazer em conhecer voce tambem.'",

        answer: "Nice to meet you too.",

        acceptedAnswers: ["Nice to meet you, too."],

        explanation: "A resposta padrao usa too ao final.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-4",

        type: "speech",

        prompt: "Fale a resposta em ingles para 'Prazer em conhecer voce tambem.'",

        audioText: "Nice to meet you too.",

        answer: "Nice to meet you too.",

        acceptedAnswers: ["nice to meet you, too"],

        explanation: "A resposta falada ajuda a automatizar a troca social completa.",

        conceptKey: "meeting_people",

      },

    ],

  },

  {

    id: "u4",

    title: "How are you?",

    summary: "Respostas curtas para perguntar e responder como alguem esta.",

    focusSkills: ["conversation", "listening", "response"],

    conceptKey: "basic_wellbeing_responses",

    lessons: [

      {

        id: "hru-1",

        type: "choice",

        prompt: "Escolha a melhor resposta para 'How are you?'",

        options: ["I am fine, thanks.", "My name is Ana.", "Good night."],

        answer: "I am fine, thanks.",

        explanation: "A resposta adequada informa como voce esta e pode incluir um agradecimento.",

        conceptKey: "basic_wellbeing_responses",

      },

      {

        id: "hru-2",

        type: "dictation",

        prompt: "Escreva exatamente o que voce escutar.",

        audioText: "I am fine, thanks.",

        answer: "I am fine, thanks.",

        acceptedAnswers: ["I am fine thanks"],

        explanation: "A frase usa uma resposta curta e natural para how are you.",

        conceptKey: "basic_wellbeing_responses",

      },

    ],

  },

  {

    id: "u5",

    title: "Verb to be - affirmative",

    summary: "Afirmacoes basicas com am, is e are em contexto simples.",

    focusSkills: ["verb to be", "accuracy"],

    conceptKey: "verb_to_be_affirmative",

    lessons: [

      {

        id: "be-1",

        type: "choice",

        prompt: "Complete: 'I ___ a student.'",

        options: ["am", "is", "are"],

        answer: "am",

        explanation: "Com I, usamos am.",

        conceptKey: "verb_to_be_affirmative",

      },

      {

        id: "be-2",

        type: "cloze",

        prompt: "Escolha a forma correta do verbo.",

        sentence: "She ___ my teacher.",

        options: ["am", "is", "are"],

        answer: "is",

        explanation: "Com she, a forma correta e is.",

        conceptKey: "verb_to_be_affirmative",

      },

      {

        id: "be-3",

        type: "fix_fragment",

        prompt: "Corrija o trecho errado da frase.",

        before: "They ",

        wrongFragment: "is",

        after: " ready for class.",

        options: ["am", "is", "are"],

        answer: "are",

        explanation: "Com they, usamos are.",

        conceptKey: "verb_to_be_affirmative",

      },

    ],

  },

  {

    id: "u6",

    title: "Numbers 0-10",

    summary: "Numeros basicos para idade, telefone, quarto de hotel e horario.",

    focusSkills: ["numbers", "listening"],

    conceptKey: "numbers_zero_ten",

    lessons: [

      {

        id: "num-1",

        type: "choice",

        prompt: "Qual e o numero 'seven'?",

        options: ["5", "7", "9"],

        answer: "7",

        explanation: "Seven corresponde ao numero 7.",

        conceptKey: "numbers_zero_ten",

      },

      {

        id: "num-2",

        type: "listen_choice",

        prompt: "Escute o numero e selecione a opcao correta.",

        audioText: "ten",

        options: ["2", "8", "10"],

        answer: "10",

        explanation: "Ten corresponde ao numero 10.",

        conceptKey: "numbers_zero_ten",

      },

      {

        id: "num-3",

        type: "listen_variation",

        prompt: "Ouca o numero em velocidades diferentes e selecione o numero correto.",

        audioText: "seven",

        options: ["7", "6", "9"],

        answer: "7",

        explanation: "A mesma palavra deve ser reconhecida mesmo com variacao de velocidade.",

        conceptKey: "numbers_zero_ten",

      },

    ],

  },

  {

    id: "u7",

    title: "Daily routines",

    summary: "Rotina diaria com verbos frequentes e horarios simples.",

    focusSkills: ["routine", "writing", "translation"],

    conceptKey: "daily_routines",

    lessons: [

      {

        id: "routine-1",

        type: "choice",

        prompt: "Escolha a traducao correta para 'I brush my teeth'.",

        options: ["Eu escovo meus dentes", "Eu vou para escola", "Eu faco jantar"],

        answer: "Eu escovo meus dentes",

        explanation: "Brush my teeth indica a acao de escovar os dentes.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-2",

        type: "text",

        prompt: "Escreva em ingles: 'Eu acordo as sete.'",

        answer: "I wake up at seven.",

        acceptedAnswers: ["I wake up at 7."],

        explanation: "Wake up e a estrutura esperada para acordar.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-3",

        type: "error_spot",

        prompt: "Escolha a frase correta.",

        sentence: "She wake up at six every day.",

        options: ["She wakes up at six every day.", "She waking up at six every day.", "She wake at six every day."],

        answer: "She wakes up at six every day.",

        explanation: "Na terceira pessoa do singular, o verbo recebe s.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-4",

        type: "dictation",

        prompt: "Escreva o que voce escutar sobre rotina.",

        audioText: "She wakes up at six every day.",

        answer: "She wakes up at six every day.",

        acceptedAnswers: ["She wakes up at 6 every day."],

        explanation: "O ditado reforca a terceira pessoa e o horario na frase completa.",

        conceptKey: "daily_routines",

      },

    ],

  },

  {

    id: "u8",

    title: "Food and restaurant",

    summary: "Pedidos simples em restaurante, menu e preferencia de comida.",

    focusSkills: ["restaurant", "ordering", "conversation"],

    conceptKey: "food_restaurant",

    lessons: [

      {

        id: "food-1",

        type: "choice",

        prompt: "Complete: 'I would like ___ pizza, please.'",

        options: ["a", "an", "the"],

        answer: "a",

        explanation: "Pizza e contavel aqui, entao usamos a.",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-2",

        type: "order",

        prompt: "Monte: 'Can I see the menu?'",

        answerTokens: ["Can", "I", "see", "the", "menu?"],

        bank: ["menu?", "I", "Can", "see", "the", "you"],

        explanation: "A estrutura educada para pedir o menu comeca com Can I see...",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-3",

        type: "roleplay",

        scenarioTitle: "Cafe order",

        context: "You are ordering in a cafe and want something simple and polite.",

        dialogue: [
          { speaker: "Server", text: "Good afternoon. What would you like?" },
          { speaker: "Customer", text: "I would like a sandwich and a coffee, please." },
          { speaker: "Server", text: "Sure. Would you like anything else?" },
        ],

        question: "What does the customer order first?",

        options: ["A sandwich and a coffee", "A pizza and water", "Only dessert"],

        answer: "A sandwich and a coffee",

        explanation: "A fala do cliente informa claramente os dois itens pedidos.",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-4",

        type: "cloze_text",

        prompt: "Complete a lacuna com a palavra correta em ingles.",

        sentence: "Can I see the ___?",

        answer: "menu",

        acceptedAnswers: ["menu?"],

        explanation: "A palavra-chave do pedido continua sendo menu.",

        conceptKey: "food_restaurant",

      },

    ],

  },

];



const ROLEPLAY_SCENARIOS = [

  {

    id: "c1",

    title: "Scenario: The Pizza Critic",

    scenarioTitle: "The Pizza Critic",

    context:

      "Oscar is preparing his classroom for an art exhibition. Eddy arrives carrying a pizza box.",

    dialogue: [

      { speaker: "Eddy", text: "Hey Oscar! I brought you lunch! Pizza always helps me when I am nervous." },

      { speaker: "Oscar", text: "I do not eat pizza, Eddy. And I am not nervous. I expect great things today." },

    ],

    question: "What does Eddy bring?",

    options: ["A pizza", "A notebook", "A coffee"],

    answer: "A pizza",

  },

  {

    id: "c2",

    title: "Scenario: Hotel Check-in",

    scenarioTitle: "Hotel Check-in",

    context: "You arrive at a hotel late at night and need to confirm your reservation quickly.",

    dialogue: [

      { speaker: "Guest", text: "Good evening. I have a reservation under Maria Silva." },

      { speaker: "Reception", text: "Welcome, Maria. May I see your passport, please?" },

    ],

    question: "What does the receptionist ask for?",

    options: ["A passport", "A pizza menu", "A taxi number"],

    answer: "A passport",

  },

  {

    id: "c3",

    title: "Scenario: Job Interview",

    scenarioTitle: "Job Interview",

    context: "A recruiter asks you about your strengths and teamwork experience.",

    dialogue: [

      { speaker: "Recruiter", text: "Can you tell me one of your strengths?" },

      { speaker: "Candidate", text: "I communicate clearly and I like solving problems with the team." },

    ],

    question: "Which strength is mentioned?",

    options: ["Communication", "Cooking", "Driving"],

    answer: "Communication",

  },

  {

    id: "c4",

    title: "Scenario: Team Meeting",

    scenarioTitle: "Team Meeting",

    context: "You need to align priorities and delivery dates with your team.",

    dialogue: [

      { speaker: "Lead", text: "Can we prioritize the login feature for this sprint?" },

      { speaker: "Developer", text: "Yes, I can deliver it by Friday if we reduce scope on reports." },

    ],

    question: "What is the proposed condition?",

    options: ["Reduce report scope", "Hire more people", "Change product name"],

    answer: "Reduce report scope",

  },

];



function buildGrammarUnits(baseExerciseUnits = BASE_EXERCISE_UNITS, roleplayScenarios = ROLEPLAY_SCENARIOS) {

  const roleplayEvery = 3;

  const units = [];

  let exerciseCount = 0;

  let scenarioCursor = 0;



  baseExerciseUnits.forEach((exerciseUnit, index) => {

    units.push({

      ...exerciseUnit,

      mode: "exercise",

      completed: index < 2,

    });



    exerciseCount += 1;

    const shouldInsertScenario = exerciseCount % roleplayEvery === 0 && scenarioCursor < roleplayScenarios.length;



    if (shouldInsertScenario) {

      const scenario = roleplayScenarios[scenarioCursor++];

      units.push({

        id: scenario.id,

        title: scenario.title,

        completed: false,

        mode: "conversation",

        lessons: [

          {

            id: `${scenario.id}-roleplay`,

            type: "roleplay",

            ...scenario,

          },

        ],

      });

    }

  });



  return units;

}



const GRAMMAR_UNITS = buildGrammarUnits(BASE_EXERCISE_UNITS, ROLEPLAY_SCENARIOS);



function buildLevelUnits(levelId, topics) {

  return topics.map((topic, index) => ({

    id: `${levelId.toLowerCase()}-u${index + 1}`,

    title: topic,

    mode: index % 3 === 2 ? "conversation" : "exercise",

    completed: false,

    lessons: [

      {

        id: `${levelId.toLowerCase()}-${index + 1}-1`,

        type: "choice",

        prompt: `Tema ${levelId}: ${topic}. Qual opcao representa o foco correto da licao?`,

        options: ["Uso em contexto real", "Memorizacao isolada", "Traducao literal sem contexto"],

        answer: "Uso em contexto real",

      },

    ],

  }));

}



const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];



const LEVEL_UNIT_MAP = {

  A1: GRAMMAR_UNITS,

  A2: buildLevelUnits("A2", [

    "Simple present review",

    "Questions with do/does",

    "Time and frequency adverbs",

    "Travel basics and directions",

    "Daily life conversations",

    "Future plans with going to",

  ]),

  B1: buildLevelUnits("B1", [

    "Past simple vs present perfect",

    "Comparatives and superlatives",

    "Workplace communication",

    "Problem solving dialogues",

    "Conditionals type 1 and 2",

    "Opinion and argument structure",

  ]),

  B2: buildLevelUnits("B2", [

    "Passive voice in context",

    "Reported speech",

    "Formal email and meetings",

    "Negotiation roleplay",

    "Advanced connectors",

    "Cause and consequence language",

  ]),

  C1: buildLevelUnits("C1", [

    "Nuanced meaning and tone",

    "Inversion and emphasis",

    "Academic style responses",

    "Complex discussion roleplay",

    "Idiomatic fluency",

    "Precision in argumentation",

  ]),

  C2: buildLevelUnits("C2", [

    "Near-native reformulation",

    "Advanced discourse markers",

    "Pragmatics and intent",

    "Leadership communication roleplay",

    "High-level writing accuracy",

    "C2 mastery consolidation",

  ]),

};



function ensureGrammar(progress) {

  const data = progress || {};

  if (!data.modules) data.modules = {};

  if (!data.modules.grammar) {

    data.modules.grammar = {

      completed_units: [],

      completed_units_by_level: {},

      current_level: "A1",

      last_unit: null,

      concept_scores: {},

      lesson_history: [],

      unit_attempts: {},

      weak_concepts: [],

      session_resume: null,

      recommended_review_unit: null,

      recurring_errors: {},
    };
  }

  if (!Array.isArray(data.modules.grammar.completed_units)) {

    data.modules.grammar.completed_units = [];

  }

  if (!data.modules.grammar.completed_units_by_level || typeof data.modules.grammar.completed_units_by_level !== "object") {

    data.modules.grammar.completed_units_by_level = {};

  }

  if (!data.modules.grammar.concept_scores || typeof data.modules.grammar.concept_scores !== "object") {

    data.modules.grammar.concept_scores = {};

  }

  if (!Array.isArray(data.modules.grammar.lesson_history)) {

    data.modules.grammar.lesson_history = [];

  }

  if (!data.modules.grammar.unit_attempts || typeof data.modules.grammar.unit_attempts !== "object") {

    data.modules.grammar.unit_attempts = {};

  }

  if (!Array.isArray(data.modules.grammar.weak_concepts)) {

    data.modules.grammar.weak_concepts = [];

  }

  if (!data.modules.grammar.session_resume || typeof data.modules.grammar.session_resume !== "object") {

    data.modules.grammar.session_resume = null;

  }

  if (!data.modules.grammar.recommended_review_unit) {

    data.modules.grammar.recommended_review_unit = null;

  }

  if (!data.modules.grammar.recurring_errors || typeof data.modules.grammar.recurring_errors !== "object") {

    data.modules.grammar.recurring_errors = {};

  }

  if (!data.modules.grammar.current_level) data.modules.grammar.current_level = "A1";
  if (!data.modules.my_vocabulary) {
    data.modules.my_vocabulary = {
      saved_words_custom: [],
    };
  }
  if (!Array.isArray(data.modules.my_vocabulary.saved_words_custom)) {
    data.modules.my_vocabulary.saved_words_custom = [];
  }
  return data;
}



async function readProgress() {

  const res = await fetch("/api/progress", { cache: "no-store" });

  if (!res.ok) throw new Error(getUiLabel("common.load_error", "Failed to load data"));

  const parsed = await res.json();

  return ensureGrammar(parsed);

}



async function writeProgress(nextProgress) {

  const res = await fetch("/api/progress", {

    method: "PUT",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(nextProgress),

  });

  if (!res.ok) throw new Error(getUiLabel("common.save_error", "Failed to save data"));

  const parsed = await res.json();

  return ensureGrammar(parsed);

}



function themeVars(color = "#58cc02") {

  return {

    "--grammar-theme": color,

    "--grammar-theme-shadow": darken(color, 28),

    "--grammar-theme-soft": alpha(color, 0.2),

    "--grammar-theme-border": alpha(color, 0.35),

  };

}



function hexToRgb(hex) {

  const cleaned = hex.replace("#", "");

  const int = Number.parseInt(cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned, 16);

  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };

}



function alpha(hex, value) {

  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${value})`;

}



function darken(hex, amount) {

  const { r, g, b } = hexToRgb(hex);

  return `rgb(${Math.max(0, r - amount)}, ${Math.max(0, g - amount)}, ${Math.max(0, b - amount)})`;

}



const GRAMMAR_VOCAB_STOPWORDS = new Set([
  "the","a","an","and","or","but","so","to","of","in","on","at","for","with","from","by","is","am","are","was","were","be","been","being",
  "do","does","did","have","has","had","will","would","can","could","should","may","might","must","i","you","he","she","it","we","they",
  "me","him","her","us","them","my","your","his","their","our","this","that","these","those","what","when","where","why","how"
]);

function extractGrammarVocabulary(unit, payload = {}) {
  const bag = new Map();
  const texts = [
    unit?.title,
    unit?.summary,
    ...(unit?.guidePoints || []),
    ...(unit?.lessons || []).flatMap((lesson) => [
      lesson?.prompt,
      lesson?.sentence,
      lesson?.audioText,
      lesson?.answer,
      ...(lesson?.acceptedAnswers || []),
      ...(lesson?.options || []),
      ...(lesson?.answerTokens || []),
      ...(lesson?.bank || []),
    ]),
  ];

  texts.map((text) => String(text || "")).forEach((text) => {
    text.toLowerCase().replace(/[^a-z'\s-]/g, " ").split(/\s+/).map((word) => word.replace(/^'+|'+$/g, "")).filter((word) => word.length >= 3 && !GRAMMAR_VOCAB_STOPWORDS.has(word)).forEach((word) => {
      if (!bag.has(word)) {
        bag.set(word, {
          word: word.charAt(0).toUpperCase() + word.slice(1),
          source: "grammar",
          unit_id: unit?.id,
          added_at: new Date().toISOString(),
        });
      }
    });
  });

  const weakTokens = (payload?.attemptLog || []).filter((entry) => !entry?.correct).flatMap((entry) => String(entry?.expected || "").toLowerCase().split(/\s+/));
  weakTokens.map((word) => word.replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "")).filter((word) => word.length >= 3 && !GRAMMAR_VOCAB_STOPWORDS.has(word)).forEach((word) => {
    if (!bag.has(word)) {
      bag.set(word, {
        word: word.charAt(0).toUpperCase() + word.slice(1),
        source: "grammar_review",
        unit_id: unit?.id,
        added_at: new Date().toISOString(),
      });
    }
  });

  return [...bag.values()].slice(0, 18);
}

function mergeGrammarVocabulary(existing = [], incoming = []) {
  const map = new Map();
  [...existing, ...incoming].forEach((entry) => {
    if (!entry?.word) return;
    const key = String(entry.word).toLowerCase();
    if (!map.has(key)) map.set(key, entry);
  });
  return [...map.values()].slice(0, 400);
}
function speakText(text, lang = "en-US", options = {}) {
  if (!window.speechSynthesis || !text) return;

  const utter = new SpeechSynthesisUtterance(text);

  utter.lang = lang;

  utter.rate = options.rate || 0.95;
  utter.pitch = options.pitch || 1;
  window.speechSynthesis.cancel();

  window.speechSynthesis.speak(utter);

}



function normalize(text) {

  return (text || "")

    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .replace(/[^a-z0-9\s]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function formatConceptLabel(key) {

  return (key || "grammar").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

}



function computeConceptStatus(score = 0) {

  if (score >= 80) return "stable";

  if (score >= 55) return "attention";

  return "weak";

}



function buildQuestionFeedback(question, isCorrect, submittedValue, resultMeta = {}, locale = "pt-BR") {

  const answerSource =

    question.acceptedAnswers?.[0] ||

    question.answerTokens?.join(" ") ||

    question.answer ||

    question.correction ||

    "";

  const normalizedAnswer = normalize(answerSource);

  const normalizedSubmitted = normalize(submittedValue || "");

  const answerTokens = normalizedAnswer.split(" ").filter(Boolean);

  const submittedTokens = normalizedSubmitted.split(" ").filter(Boolean);

  const conceptLabel = formatConceptLabel(question.conceptKey);

  const uniqueAnswerTokens = [...new Set(answerTokens)];

  const missingTokens = uniqueAnswerTokens.filter((token) => !submittedTokens.includes(token));

  const unexpectedTokens = [...new Set(submittedTokens)].filter((token) => !answerTokens.includes(token));

  const sameTokenSet =

    uniqueAnswerTokens.length > 0 &&

    missingTokens.length === 0 &&

    unexpectedTokens.length === 0 &&

    submittedTokens.length === answerTokens.length;

  const orderMismatch = sameTokenSet && normalizedSubmitted !== normalizedAnswer;

  let errorType = "gramatical";

  if (

    question.type === "order" ||

    question.type === "fix_fragment" ||

    question.type === "error_spot" ||

    orderMismatch

  ) {

    errorType = "ordem";

  } else if (

    question.type === "choice" ||

    question.type === "listen_choice" ||

    question.type === "listen_variation" ||

    question.type === "speech"

  ) {

    errorType = "lexical";

  } else if (missingTokens.length > 0 || unexpectedTokens.length > 0) {

    errorType = "lexical";

  }

  const problemFragment =

    errorType === "ordem"

      ? submittedValue || grammarLocaleText(locale, "A estrutura da frase ficou fora da ordem esperada.", "The sentence structure was outside the expected order.")

      : missingTokens[0]

        ? grammarLocaleText(locale, `Faltou ou foi trocado o trecho "${missingTokens[0]}".`, `The fragment "${missingTokens[0]}" is missing or was replaced.`)

        : unexpectedTokens[0]

          ? grammarLocaleText(locale, `O trecho "${unexpectedTokens[0]}" nao encaixa neste contexto.`, `The fragment "${unexpectedTokens[0]}" does not fit this context.`)

          : submittedValue || grammarLocaleText(locale, "A resposta nao seguiu o padrao esperado.", "The answer did not follow the expected pattern.");

    if (question.type === "speech" && resultMeta?.speechAnalysis) {
    const analysis = resultMeta.speechAnalysis;
    if (isCorrect) {
      return {
        tone: "correct",
        title: getUiLabel("grammar.feedback.good_answer", "Good answer"),
        summary: grammarLocaleText(locale, `Sua fala atingiu ${analysis.overallScore}% de proximidade com o modelo.`, `Your speech reached ${analysis.overallScore}% similarity to the model.`),
        correctAnswer: answerSource,
        microRule: `${getUiLabel("grammar.feedback.concept", "Concept")}: ${conceptLabel}`,
        explanation: getUiLabel("grammar.feedback.speech_good", "Your speech stayed recognizable and close to the model."),
        extraExample,
        speechAnalysis: analysis,
      };
    }
    return {
      tone: "wrong",
      title: getUiLabel("grammar.feedback.pronunciation_unstable", "Pronunciation still unstable"),
      summary: grammarLocaleText(locale, `Sua fala ficou em ${analysis.overallScore}% de proximidade. Vamos ajustar os pontos fracos antes de seguir.`, `Your speech stayed at ${analysis.overallScore}% similarity. Let's adjust the weak points before moving on.`),
      correctAnswer: answerSource,
      submittedValue,
      microRule: `${getUiLabel("grammar.feedback.reinforce", "Reinforce")}: ${conceptLabel}`,
      errorTypeLabel: getUiLabel("grammar.feedback.phonetic", "phonetic"),
      explanation: getUiLabel("grammar.feedback.speech_wrong", "The sentence is not yet clear enough in pronunciation or completeness."),
      problemFragment: analysis.weakWords.length ? grammarLocaleText(locale, `Palavras criticas: ${analysis.weakWords.join(", ")}`, `Critical words: ${analysis.weakWords.join(", ")}`) : submittedValue || grammarLocaleText(locale, "A producao oral ainda precisa de mais nitidez.", "Your spoken production still needs more clarity."),
      extraExample,
      detailBullets: [
        `${getUiLabel("grammar.score.pronunciation", "Pronunciation")}: ${analysis.pronunciationScore}%`,
        `${getUiLabel("grammar.score.completeness", "Completeness")}: ${analysis.completenessScore}%`,
        `${getUiLabel("grammar.score.rhythm", "Rhythm")}: ${analysis.rhythmScore}%`,
        ...(analysis.soundHints || []),
      ],
      speechAnalysis: analysis,
    };
  }

  const explanationByType = {

    ordem: grammarLocaleText(locale, `A ideia principal esta correta, mas a ordem das palavras precisa seguir o padrao de ${conceptLabel}.`, `The main idea is correct, but the word order needs to follow the ${conceptLabel} pattern.`),

    lexical: grammarLocaleText(locale, `O significado central mudou ou ficou incompleto. Revise a palavra-chave de ${conceptLabel}.`, `The core meaning changed or became incomplete. Review the key word in ${conceptLabel}.`),

    gramatical: grammarLocaleText(locale, `A estrutura gramatical nao bate com o padrao esperado para ${conceptLabel}.`, `The grammatical structure does not match the expected ${conceptLabel} pattern.`),

  };

  const extraExampleByConcept = {

    greetings_time_of_day: "Exemplo: Good evening, everyone.",

    introducing_yourself: "Exemplo: My name is Lucas.",

    polite_conversation_openers: "Exemplo: Nice to meet you.",

    asking_how_people_are: "Exemplo: How are you today?",

    verb_to_be_affirmative: "Exemplo: She is a doctor.",

    numbers_0_10: "Exemplo: I have three books.",

    daily_routines_present_simple: "Exemplo: I wake up at seven.",

    food_and_restaurant_requests: "Exemplo: I would like some water, please.",

  };

  const extraExample =

    extraExampleByConcept[question.conceptKey] ||

    grammarLocaleText(locale, `Exemplo: ${answerSource || "Use the target structure in a short sentence."}`, `Example: ${answerSource || "Use the target structure in a short sentence."}`);

  if (isCorrect) {

    return {

      tone: "correct",

      title: getUiLabel("grammar.feedback.good_answer", "Good answer"),

      summary: question.explanation || grammarLocaleText(locale, "Resposta consistente com o conceito desta etapa.", "Answer consistent with the concept of this step."),

      correctAnswer: answerSource,

      microRule: `${getUiLabel("grammar.feedback.concept", "Concept")}: ${conceptLabel}`,

      explanation: grammarLocaleText(locale, `Voce aplicou corretamente o padrao de ${conceptLabel}.`, `You applied the ${conceptLabel} pattern correctly.`),

      extraExample,

    };

  }

  return {

    tone: "wrong",

    title: getUiLabel("grammar.feedback.wrong_answer", "Incorrect answer"),

    summary: question.explanation || grammarLocaleText(locale, "Revise a regra principal antes de continuar.", "Review the main rule before continuing."),

    correctAnswer: answerSource,

    submittedValue,

    microRule: `${getUiLabel("grammar.feedback.reinforce", "Reinforce")}: ${conceptLabel}`,

    errorTypeLabel: errorType,

    explanation: explanationByType[errorType],

    problemFragment,

    extraExample,

    detailBullets: [
      errorType === "ordem" ? grammarLocaleText(locale, "Reorganize a frase mantendo sujeito, verbo e complemento na sequencia esperada.", "Reorganize the sentence keeping subject, verb and complement in the expected sequence.") : null,
      missingTokens[0] ? grammarLocaleText(locale, `Inclua o termo-chave ${missingTokens[0]} para preservar o sentido.`, `Include the key term ${missingTokens[0]} to preserve the meaning.`) : null,
      unexpectedTokens[0] ? grammarLocaleText(locale, `Remova ou substitua ${unexpectedTokens[0]} porque ele desloca a ideia principal.`, `Remove or replace ${unexpectedTokens[0]} because it shifts the main idea.`) : null,
    ].filter(Boolean),

  };

}

function buildReviewUnits(units, conceptScores, recurringErrors = {}, locale = "pt-BR") {

  const now = Date.now();

  const dueReviews = Object.entries(conceptScores || {})

    .map(([conceptKey, score]) => {

      const recurring = recurringErrors?.[conceptKey] || {};

      const count = Number(recurring.count || 0);

      const lastWrongAt = recurring.last_wrong_at ? new Date(recurring.last_wrong_at).getTime() : 0;

      const lastReviewAt = recurring.last_reviewed_at ? new Date(recurring.last_reviewed_at).getTime() : 0;

      const hoursSinceWrong = lastWrongAt ? (now - lastWrongAt) / 36e5 : 999;

      const hoursSinceReview = lastReviewAt ? (now - lastReviewAt) / 36e5 : 999;

      const urgency = (100 - Number(score || 0)) + count * 14 + (hoursSinceWrong < 24 ? 12 : 0);

      const isDue = (Number(score || 0) < 68 || count >= 2) && hoursSinceReview >= 12;

      return { conceptKey, urgency, isDue };

    })

    .filter((item) => item.isDue)

    .sort((a, b) => b.urgency - a.urgency)

    .slice(0, 4)

    .map((item, index) => ({

      id: `review-${item.conceptKey}-${index + 1}`,

      title: grammarLocaleText(locale, `Revisao: ${formatConceptLabel(item.conceptKey)}`, `Review: ${formatConceptLabel(item.conceptKey)}`),

      concept: formatConceptLabel(item.conceptKey),

      summary: grammarLocaleText(locale, "Revisao curta e direcionada com base em desempenho fraco e erros recorrentes.", "Short targeted review based on weak performance and recurring errors."),

      focusSkills: ["review", "accuracy", "recovery"],

      guidePoints: [

        grammarLocaleText(locale, "Esta revisao foi inserida automaticamente porque o conceito esta instavel.", "This review was inserted automatically because the concept is unstable."),

        grammarLocaleText(locale, "Foque no padrao exato que voce errou antes de seguir.", "Focus on the exact pattern you missed before moving on."),

      ],

      masterySignal: grammarLocaleText(locale, "Voce responde corretamente duas vezes seguidas apos revisar o ponto fraco.", "You answer correctly twice in a row after revisiting the weak point."),

      mode: "exercise",

      adaptiveReview: true,

      conceptKey: item.conceptKey,

      lessons: [

        {

          id: `review-${item.conceptKey}-1`,

          type: "choice",

          prompt: grammarLocaleText(locale, `Revisao rapida: qual opcao combina melhor com ${formatConceptLabel(item.conceptKey)}?`, `Quick review: which option best matches ${formatConceptLabel(item.conceptKey)}?`),

          options: ["Correct usage in context", "Literal translation only", "Random memorization"],

          answer: "Correct usage in context",

          explanation: grammarLocaleText(locale, "A revisao reforca o uso contextual do conceito fraco.", "The review reinforces contextual use of the weak concept."),

          conceptKey: item.conceptKey,

        },

      ],

    }));

  if (!Array.isArray(units) || units.length === 0) {

    return dueReviews;

  }

  const merged = [];

  let reviewIndex = 0;

  units.forEach((unit, index) => {

    merged.push(unit);

    if ((index + 1) % 2 === 0 && reviewIndex < dueReviews.length) {

      merged.push(dueReviews[reviewIndex]);

      reviewIndex += 1;

    }

  });

  while (reviewIndex < dueReviews.length) {

    merged.push(dueReviews[reviewIndex]);

    reviewIndex += 1;

  }

  return merged;

}

function slugify(value) {

  return normalize(value).replace(/\s+/g, "_") || "grammar";

}

function enrichLesson(lesson, unit, locale = "pt-BR") {

  return {

    explanation: lesson.explanation || grammarLocaleText(locale, `Revise o padrao principal de ${unit.title.toLowerCase()}.`, `Review the main pattern of ${unit.title.toLowerCase()}.`),

    conceptKey: lesson.conceptKey || unit.conceptKey || slugify(unit.title),

    acceptedAnswers: lesson.acceptedAnswers || [],

    ...lesson,

  };

}

function enrichUnit(unit, locale = "pt-BR") {

  const conceptKey = unit.conceptKey || slugify(unit.title);

  return {

    summary: unit.summary || grammarLocaleText(locale, `Pratique ${unit.title.toLowerCase()} em frases curtas, audio e contexto real.`, `Practice ${unit.title.toLowerCase()} in short sentences, audio and real context.`),

    focusSkills: unit.focusSkills || (unit.mode === "conversation" ? ["listening", "dialogue"] : ["grammar", "accuracy"]),

    guidePoints:

      unit.guidePoints || [

        grammarLocaleText(locale, "Leia a estrutura principal antes de responder.", "Read the main structure before answering."),

        grammarLocaleText(locale, "Observe como o conceito aparece em contexto real.", "Notice how the concept appears in real context."),

      ],

    masterySignal: unit.masterySignal || grammarLocaleText(locale, "Voce responde sem hesitar e reconhece o padrao em novas frases.", "You answer without hesitation and recognize the pattern in new sentences."),

    conceptKey,

    ...unit,

    lessons: (unit.lessons || []).map((lesson) => enrichLesson(lesson, { ...unit, conceptKey }, locale)),

  };

}



function NodeButton({ item, index, unlocked, active, isLast, onClick }) {
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";

  const iconSrc = isLast

    ? "/img/icons/trofeu.svg"

    : item.completed

      ? "/img/icons/check.svg"

      : item.mode === "conversation"

        ? "/img/icons/book.svg"

        : active && unlocked

          ? "/img/icons/haltere.svg"

          : "/img/icons/estrela.svg";



  return (

    <div className={`grammar-node-row ${offsetClass}`}>

      <div className={`grammar-node-ring ${active && unlocked ? "is-active" : ""}`}>

        <button

          type="button"

          className={`grammar-node-btn ${item.completed ? "is-complete" : ""} ${active ? "is-active" : ""} ${unlocked ? "is-open" : "is-locked"} ${item.mode === "conversation" ? "is-conversation" : ""}`}

          disabled={!unlocked}

          onClick={() => unlocked && onClick(item.id)}

          title={item.title}

          aria-label={item.title}

        >

          {active && unlocked ? (

            <div className="grammar-tooltip-parent" aria-hidden="true">

              <div className="grammar-tooltip">{getUiLabel("grammar.start", "Start")}</div>

            </div>

          ) : null}

          <span className="grammar-node-icon">

            <img src={iconSrc} alt="" className="grammar-node-imgicon" />

          </span>

        </button>

      </div>

      <div className="grammar-node-title">{item.title}</div>

    </div>

  );

}



function OrderQuestion({ question, onSubmit, disabled }) {

  const [selected, setSelected] = useState([]);

  const remaining = useMemo(() => {

    const selectedIndexes = selected.map((s) => s.originalIndex).filter((v) => Number.isInteger(v));

    return question.bank.filter((token, idx) => !selectedIndexes.includes(idx));

  }, [question.bank, selected]);



  const addToken = (token) => {

    const index = question.bank.findIndex((t, i) => t === token && !selected.some((s) => s.originalIndex === i));

    if (index >= 0) setSelected((prev) => [...prev, { text: token, originalIndex: index }]);

  };



  const removeToken = (position) => {

    setSelected((prev) => prev.filter((_, i) => i !== position));

  };



  const canCheck = selected.length > 0;

  const submittedValue = selected.map((t) => t.text).join(" ");

  const isCorrect = submittedValue === question.answerTokens.join(" ");


  return (

    <div className="grammar-question-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-answer-zone">

        {selected.length === 0 ? (

          <span className="grammar-answer-placeholder">{getUiLabel("grammar.tap_words", "Tap the words below")}</span>

        ) : (

          selected.map((token, idx) => (

            <button

              key={`${token.text}-${idx}`}

              type="button"

              className="grammar-chip selected"

              onClick={() => !disabled && removeToken(idx)}

              disabled={disabled}

            >

              {token.text}

            </button>

          ))

        )}

      </div>



      <div className="grammar-chip-bank">

        {remaining.map((token, idx) => (

          <button

            key={`${token}-${idx}`}

            type="button"

            className="grammar-chip"

            onClick={() => !disabled && addToken(token)}

            disabled={disabled}

          >

            {token}

          </button>

        ))}

      </div>



      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: canCheck && isCorrect, submittedValue })} disabled={disabled || !canCheck}>
        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function ChoiceQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");

  return (

    <div className="grammar-question-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-choice-list">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>
        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function TextQuestion({ question, onSubmit, disabled }) {

  const [value, setValue] = useState("");

  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);
  return (

    <div className="grammar-question-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <textarea

        className="grammar-textarea"

        placeholder={getUiLabel("grammar.input_answer", "Type your answer...")}

        value={value}

        onChange={(e) => setValue(e.target.value)}

        disabled={disabled}

      />

      <button

        type="button"

        className="grammar-check-btn"

        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}

      >

        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function ClozeQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");

  const [before, after] = question.sentence.split("___");



  return (

    <div className="grammar-question-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-cloze-sentence">

        {before}

        <span className={`grammar-inline-gap ${selected ? "is-filled" : ""}`}>{selected || "______"}</span>

        {after}

      </div>

      <div className="grammar-choice-list compact">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function ListenChoiceQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");



  return (

    <div className="grammar-question-card grammar-listen-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText)}>

        <Headphones size={20} />

        {getUiLabel("grammar.listen_audio", "Listen to audio")}

      </button>

      <div className="grammar-choice-list">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function ErrorSpotQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");



  return (

    <div className="grammar-question-card grammar-error-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-error-sentence">{question.sentence}</div>

      <div className="grammar-choice-list compact">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function DictationQuestion({ question, onSubmit, disabled }) {

  const [value, setValue] = useState("");
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  return (

    <div className="grammar-question-card grammar-dictation-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText || question.answer)}>
        <Headphones size={20} />
        {getUiLabel("grammar.listen_again", "Listen again")}
      </button>

      <textarea
        className="grammar-textarea"
        rows={4}
        placeholder={question.placeholder || getUiLabel("grammar.dictation_placeholder", "Type exactly what you heard") }
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
      />

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}
      >
        {getUiLabel("common.verify", "Verify")}
      </button>

    </div>

  );

}



function FreeInputClozeQuestion({ question, onSubmit, disabled }) {

  const [value, setValue] = useState("");
  const [before, after] = question.sentence.split("___");
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  return (

    <div className="grammar-question-card grammar-cloze-free-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-cloze-free-sentence">
        <span>{before}</span>
        <input
          type="text"
          className="grammar-inline-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          placeholder={question.placeholder || getUiLabel("grammar.complete_placeholder", "complete")}
        />
        <span>{after}</span>
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}
      >
        {getUiLabel("common.verify", "Verify")}
      </button>

    </div>

  );

}



function ListenVariationQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");
  const play = (rate) => speakText(question.audioText, question.lang || "en-US", { rate });

  return (

    <div className="grammar-question-card grammar-listen-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-listen-variation-actions">
        <button type="button" className="grammar-listen-action" onClick={() => play(0.78)}>
          <Headphones size={18} />
          {getUiLabel("grammar.speed.slow", "Slow")}
        </button>
        <button type="button" className="grammar-listen-action" onClick={() => play(0.95)}>
          <Headphones size={18} />
          {getUiLabel("grammar.speed.normal", "Normal")}
        </button>
        <button type="button" className="grammar-listen-action" onClick={() => play(1.08)}>
          <Headphones size={18} />
          {getUiLabel("grammar.speed.fast", "Fast")}
        </button>
      </div>

      <div className="grammar-choice-list">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })}
        disabled={disabled || !selected}
      >
        {getUiLabel("common.verify", "Verify")}
      </button>

    </div>

  );

}



function FixFragmentQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");

  return (

    <div className="grammar-question-card grammar-fix-fragment-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-fix-sentence">
        <span>{question.before}</span>
        <span className="grammar-inline-gap is-filled is-wrong">{question.wrongFragment}</span>
        <span>{question.after}</span>
      </div>

      <div className="grammar-choice-list compact">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })}
        disabled={disabled || !selected}
      >
        {getUiLabel("common.verify", "Verify")}
      </button>

    </div>

  );

}



function SpeakingQuestion({ question, onSubmit, disabled }) {

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [speechSupported] = useState(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
    };
  }, [runtimeLevelUnitMap]);

  const stopPreviousRecognition = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    } catch {
      // no-op
    }
    recognitionRef.current = null;
  };

  const startListening = async () => {
    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi || isListening) return;

    setSpeechStatus("");
    setTranscript("");

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setSpeechStatus(getUiLabel("grammar.speech.allow_mic", "Allow microphone access in the browser to transcribe your speech."));
        return;
      }
    }

    stopPreviousRecognition();

    const recognition = new SpeechApi();
    recognitionRef.current = recognition;
    recognition.lang = question.lang || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSpeechStatus(getUiLabel("grammar.speech.listening", "Listening to your speech..."));

    recognition.onstart = () => {
      setSpeechStatus(getUiLabel("grammar.speech.active", "Microphone active. Speak now."));
    };

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i += 1) {
        combined += `${event.results[i][0]?.transcript || ""} `;
      }
      const cleaned = combined.trim();
      setTranscript(cleaned);
      setSpeechStatus(cleaned ? getUiLabel("grammar.speech.captured", "Speech captured. Review it below if needed.") : getUiLabel("grammar.speech.listening", "Listening to your speech..."));
    };

    recognition.onerror = (event) => {
      const errorMap = {
        'not-allowed': getUiLabel("grammar.speech.error_blocked", "The browser blocked microphone access."),
        'audio-capture': getUiLabel("grammar.speech.error_no_mic", "No microphone was detected."),
        'network': getUiLabel("grammar.speech.error_network", "Network failure during transcription."),
        'no-speech': getUiLabel("grammar.speech.error_no_speech", "No speech was detected. Try again."),
        'aborted': getUiLabel("grammar.speech.error_aborted", "Capture interrupted."),
      };
      setSpeechStatus(errorMap[event?.error] || getUiLabel("grammar.speech.error_transcribe", "Could not transcribe your speech."));
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setSpeechStatus((current) => current || getUiLabel("grammar.speech.ended", "Capture ended."));
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechStatus(getUiLabel("grammar.speech.error_start", "Could not start voice capture."));
      recognitionRef.current = null;
    }
  };

  return (

    <div className="grammar-question-card grammar-speaking-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText || question.answer, question.lang || "en-US")}>
        <Headphones size={18} />
        {getUiLabel("grammar.listen_model", "Listen to model")}
      </button>

      <button type="button" className="grammar-speak-action" onClick={startListening} disabled={disabled || !speechSupported || isListening}>
        <MessageCircleMore size={18} />
        {speechSupported ? (isListening ? getUiLabel("grammar.speech.listening_short", "Listening...") : getUiLabel("grammar.speech.speak_now", "Speak now")) : getUiLabel("grammar.speech.unavailable", "Microphone unavailable")}
      </button>

      {speechStatus ? <p className="grammar-speech-status">{speechStatus}</p> : null}

      <textarea
        className="grammar-textarea"
        rows={3}
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        disabled={disabled}
        placeholder={getUiLabel("grammar.speech_placeholder", "Your speech appears here. You can edit it if needed.")}
      />

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => { const speechAnalysis = buildSpeechAnalysis(question, transcript); onSubmit({ correct: speechAnalysis.isAcceptable, submittedValue: transcript, speechAnalysis }); }}
        disabled={disabled || !transcript.trim()}
      >
        {getUiLabel("common.verify", "Verify")}
      </button>

    </div>

  );

}


function RolePlayQuestion({ question, onSubmit, disabled, status = "idle" }) {
  const [selected, setSelected] = useState("");



  return (

    <div className="grammar-question-card grammar-roleplay-card">

      <div className="grammar-roleplay-cover">

        <img src="/img/icons/book.svg" alt="" />

        <strong>{question.scenarioTitle}</strong>

      </div>



      <p className="grammar-roleplay-context">

        <Volume2 size={15} />

        {question.context}

      </p>



      <div className="grammar-roleplay-dialogue">

        {question.dialogue.map((line, idx) => (

          <article key={`${line.speaker}_${idx}`} className="grammar-roleplay-line">

            <button type="button" onClick={() => speakText(line.text)} aria-label={getUiLabel("grammar.listen_speaker", "Listen to {speaker}").replace("{speaker}", line.speaker)}>

              <Volume2 size={14} />

            </button>

            <div>

              <strong>{line.speaker}</strong>

              <p>{line.text}</p>

            </div>

          </article>

        ))}

      </div>



      <p className="grammar-question-prompt">{question.question}</p>

      <div className="grammar-choice-list">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>



      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>
        {getUiLabel("common.verify", "Verify")}

      </button>

    </div>

  );

}



function LessonRunner({ unit, onClose, onComplete, resumeState, onSaveSession, sourceLanguage = "pt-BR" }) {
  const baseLessons = useMemo(() => unit.lessons || [], [unit.lessons]);

  const [phase, setPhase] = useState(resumeState?.unitId === unit.id ? resumeState.phase || "intro" : "intro");
  const [stepIndex, setStepIndex] = useState(resumeState?.unitId === unit.id ? resumeState.stepIndex || 0 : 0);
  const [lives, setLives] = useState(resumeState?.unitId === unit.id ? resumeState.lives || 5 : 5);
  const [status, setStatus] = useState("idle");
  const [summary, setSummary] = useState(
    resumeState?.unitId === unit.id ? resumeState.summary || { correct: 0, wrong: 0 } : { correct: 0, wrong: 0 }
  );
  const [feedback, setFeedback] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [attemptLog, setAttemptLog] = useState(
    resumeState?.unitId === unit.id && Array.isArray(resumeState.attemptLog) ? resumeState.attemptLog : []
  );
  const [sessionLessons, setSessionLessons] = useState(
    resumeState?.unitId === unit.id && Array.isArray(resumeState.lessonQueue) && resumeState.lessonQueue.length
      ? resumeState.lessonQueue
      : baseLessons
  );

  useEffect(() => {
    if (resumeState?.unitId === unit.id && Array.isArray(resumeState.lessonQueue) && resumeState.lessonQueue.length) {
      setSessionLessons(resumeState.lessonQueue);
      return;
    }

    setSessionLessons(baseLessons);
  }, [baseLessons, resumeState, unit.id]);

  const step = sessionLessons[stepIndex];
  const baseLessonCount = Math.max(baseLessons.length, 1);
  const completedSteps = phase === "summary" ? baseLessonCount : Math.min(stepIndex, baseLessonCount);
  const progress = (completedSteps / baseLessonCount) * 100;

  useEffect(() => {
    if (!onSaveSession) return;

    if (phase === "summary") {
      onSaveSession(null);
      return;
    }

      onSaveSession({
        unitId: unit.id,
        phase,
        stepIndex,
        lives,
        summary,
        attemptLog,
        lessonQueue: sessionLessons,
        updatedAt: new Date().toISOString(),
      });
  }, [attemptLog, lives, onSaveSession, phase, sessionLessons, stepIndex, summary, unit.id]);

  useEffect(() => {
    if (phase !== "lesson" || !step) return;

    const textToSpeak = step.audioText || "";
    if (!textToSpeak) return undefined;

    const timer = window.setTimeout(() => {
      speakText(textToSpeak);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [phase, step]);

  const handleSubmit = (result) => {
    const correct = typeof result === "boolean" ? result : Boolean(result?.correct);
    const submittedValue = typeof result === "object" ? result?.submittedValue : "";
    const resultMeta = typeof result === "object" ? result : {};
    const nextAttempt = {
      lessonId: step.id,
      conceptKey: step.conceptKey || unit.conceptKey || slugify(unit.title),
      correct,
      submittedValue,
      queuedAgain: !correct,
      speechScore: resultMeta?.speechAnalysis?.overallScore || null,
    };

    const nextLog = [...attemptLog, nextAttempt];
    setAttemptLog(nextLog);
    setFeedback(buildQuestionFeedback(step, correct, submittedValue, resultMeta, sourceLanguage));

    if (correct) {
      const nextSummary = { ...summary, correct: summary.correct + 1 };
      setSummary(nextSummary);
      if (stepIndex === sessionLessons.length - 1) {
        setPhase("summary");
        onComplete({
          unitId: unit.id,
          summary: nextSummary,
          attemptLog: nextLog,
          livesRemaining: lives,
          adaptiveQueueSize: sessionLessons.length,
          adaptiveReview: Boolean(unit.adaptiveReview),
        });
        return;
      }
      setStatus("correct");
      return;
    }

    setSessionLessons((prev) => {
      const currentStep = prev[stepIndex];
      if (!currentStep) return prev;
      return [
        ...prev,
        {
          ...currentStep,
          id: `${currentStep.id}__retry_${Date.now()}`,
          retryOf: currentStep.retryOf || currentStep.id,
          retryDepth: Number(currentStep.retryDepth || 0) + 1,
        },
      ];
    });
    setLives((prev) => Math.max(0, prev - 1));
    setSummary((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    setStatus("wrong");
  };

  const handleContinue = () => {
    if (phase === "summary") {
      onClose();
      return;
    }

    if (status === "correct" || status === "wrong") {
      setStepIndex((prev) => prev + 1);
    }

    setStatus("idle");
    setFeedback(null);
  };

  let questionNode = null;

  if (phase === "lesson") {
    if (step.type === "choice") {
      questionNode = <ChoiceQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "order") {
      questionNode = <OrderQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "text") {
      questionNode = <TextQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "cloze") {
      questionNode = <ClozeQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "listen_choice") {
      questionNode = <ListenChoiceQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "error_spot") {
      questionNode = <ErrorSpotQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "dictation") {
      questionNode = <DictationQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "cloze_text") {
      questionNode = <FreeInputClozeQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "listen_variation") {
      questionNode = <ListenVariationQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "fix_fragment") {
      questionNode = <FixFragmentQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "speech") {
      questionNode = <SpeakingQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else {
      questionNode = <RolePlayQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    }
  }

  return (
    <div className="grammar-lesson-shell">
      <div className="grammar-lesson-topbar">
        <button type="button" className="grammar-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="grammar-lesson-progress">
          <div className="grammar-lesson-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>

        <div className="grammar-hearts">
          <span className="grammar-heart-badge" aria-hidden="true">&hearts;</span>
          <span>{lives}</span>
        </div>

        <button type="button" className="grammar-unit-guide-toggle" onClick={() => setShowGuide((prev) => !prev)}>
          {getUiLabel("grammar.unit_guide", "Unit guide")}
        </button>
      </div>

      {showGuide ? (
        <aside className="grammar-unit-guide-panel">
          <strong>{unit.title}</strong>
          <p>{unit.summary}</p>
          <ul>
            {(unit.guidePoints || []).map((point) => <li key={point}>{point}</li>)}
          </ul>
          <span>{unit.masterySignal}</span>
        </aside>
      ) : null}

      {phase === "intro" ? (
        <div className="grammar-lesson-intro">
          <div className="grammar-intro-icon">
            {unit.mode === "conversation" ? <MessageCircleMore size={34} /> : <PenSquare size={34} />}
          </div>
          <p className="grammar-intro-kicker">{formatConceptLabel(unit.conceptKey)}</p>
          <h1>{unit.title}</h1>
          <p className="grammar-intro-summary">{unit.summary}</p>
          <div className="grammar-intro-tags">
            {(unit.focusSkills || []).map((skill) => (
              <span key={skill} className="grammar-intro-tag">{skill}</span>
            ))}
          </div>
          <ul className="grammar-intro-points">
            {(unit.guidePoints || []).map((point) => <li key={point}>{point}</li>)}
          </ul>
          <div className="grammar-intro-signal">
            <CheckCircle2 size={18} />
            <span>{unit.masterySignal}</span>
          </div>
          <button type="button" className="grammar-finish-btn" onClick={() => setPhase("lesson")}>{getUiLabel("grammar.start", "Start")}</button>
        </div>
      ) : null}

      {phase === "lesson" ? (
        <div className="grammar-lesson-body">
          <h1>{unit.title}</h1>
          <div className="grammar-audio-row">
            <button type="button" className="grammar-sound-btn" onClick={() => speakText(step.audioText || unit.title, step.lang || "en-US")}>
              <Volume2 size={24} />
            </button>
            <p>{step.supportingCopy || getUiLabel("grammar.supporting_copy", "Listen to the topic and answer the activities below")}</p>
          </div>
          {questionNode}
        </div>
      ) : null}

      {phase === "summary" ? (
        <div className="grammar-finish-card">
          <h2>{getUiLabel("grammar.lesson_done", "Lesson completed")}</h2>
          <p>{getUiLabel("grammar.summary.correct", "Correct")}: {summary.correct}</p>
          <p>{getUiLabel("grammar.summary.wrong", "Wrong")}: {summary.wrong}</p>
          <p>{getUiLabel("grammar.summary.hearts", "Remaining hearts")}: {lives}</p>
          <p className="grammar-finish-note">
            {summary.wrong === 0
              ? getUiLabel("grammar.summary.perfect", "Excellent consistency. Keep moving forward.")
              : getUiLabel("grammar.summary.review", "Good work. Review the highlighted concepts and return to consolidate them.")}
          </p>
          {feedback ? (
            <div className={`grammar-feedback-panel is-${feedback.tone}`}>
              <strong>{feedback.title}</strong>
              <p>{feedback.summary}</p>
              <span>{feedback.microRule}</span>
            </div>
          ) : null}
          <button type="button" className="grammar-finish-btn" onClick={handleContinue}>{getUiLabel("common.continue", "Continue")}</button>
        </div>
      ) : null}

      {phase === "lesson" && feedback ? (
        <div className={`grammar-feedback-bar is-${feedback.tone}`}>
          <div className="grammar-feedback-copy">
            <strong>{feedback.title}</strong>
            <p>{feedback.summary}</p>
            {feedback.tone === "wrong" && feedback.errorTypeLabel ? (
              <div className={`grammar-feedback-badge is-${feedback.errorTypeLabel}`}>
                {getUiLabel("grammar.feedback.error_type", "Error type")}: {feedback.errorTypeLabel}
              </div>
            ) : null}
                        {feedback.explanation ? <span>{feedback.explanation}</span> : null}
            {feedback.detailBullets?.length ? (
              <ul className="grammar-feedback-detail-list">
                {feedback.detailBullets.map((item, index) => (
                  <li key={`${index}_${item}`}>{item}</li>
                ))}
              </ul>
            ) : null}
            {feedback.speechAnalysis ? (
              <div className="grammar-speech-score-grid">
                <div className="grammar-speech-score-card"><strong>{getUiLabel("grammar.score.overall", "Overall")}</strong><span>{feedback.speechAnalysis.overallScore}%</span></div>
                <div className="grammar-speech-score-card"><strong>{getUiLabel("grammar.score.pronunciation", "Pronunciation")}</strong><span>{feedback.speechAnalysis.pronunciationScore}%</span></div>
                <div className="grammar-speech-score-card"><strong>{getUiLabel("grammar.score.completeness", "Completeness")}</strong><span>{feedback.speechAnalysis.completenessScore}%</span></div>
                <div className="grammar-speech-score-card"><strong>{getUiLabel("grammar.score.rhythm", "Rhythm")}</strong><span>{feedback.speechAnalysis.rhythmScore}%</span></div>
              </div>
            ) : null}            {feedback.tone === "wrong" && feedback.problemFragment ? (
              <div className="grammar-feedback-fragment">{getUiLabel("grammar.feedback.problem_fragment", "Problem fragment")}: {feedback.problemFragment}</div>
            ) : null}
            {feedback.correctAnswer ? <span>{getUiLabel("grammar.feedback.expected_answer", "Expected answer")}: {feedback.correctAnswer}</span> : null}
            {feedback.extraExample ? (
              <div className="grammar-feedback-example">{getUiLabel("grammar.feedback.short_example", "Short example")}: {feedback.extraExample}</div>
            ) : null}
            <small>{feedback.microRule}</small>
          </div>
          <button type="button" className="grammar-feedback-continue" onClick={handleContinue}>
            {getUiLabel("common.continue", "Continue")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function GrammarPage({ setCurrentView, color = "#58cc02" }) {

  const defaultCompletedByLevel = useMemo(() => {

    const byLevel = {};

    LEVEL_ORDER.forEach((levelId) => {

      byLevel[levelId] =

        levelId === "A1" ? GRAMMAR_UNITS.filter((u) => u.completed).map((u) => u.id) : [];

    });

    return byLevel;

  }, []);

  const [currentLevel, setCurrentLevel] = useState("A1");

  const [completedByLevel, setCompletedByLevel] = useState(defaultCompletedByLevel);

  const [activeUnitId, setActiveUnitId] = useState(null);

  const [conceptScores, setConceptScores] = useState({});

  const [weakConcepts, setWeakConcepts] = useState([]);

  const [sessionResume, setSessionResume] = useState(null);

  const [recommendedReviewUnit, setRecommendedReviewUnit] = useState(null);

  const [recurringErrors, setRecurringErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [grammarContentByLevel, setGrammarContentByLevel] = useState({});

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch(`/api/grammar/content?level=${encodeURIComponent(currentLevel)}&locale=${encodeURIComponent(sourceLanguage)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted || !data?.payload) return;
        setGrammarContentByLevel((current) => ({
          ...current,
          [String(data.level || "A1").toUpperCase()]: data.payload,
        }));
      } catch {
        // fallback local permanece ativo
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentLevel, sourceLanguage]);

  const runtimeLevelUnitMap = useMemo(() => ({
    ...LEVEL_UNIT_MAP,
    ...Object.fromEntries(Object.entries(grammarContentByLevel).map(([levelId, payload]) => [
      levelId,
      levelId === "A1"
        ? buildGrammarUnits(payload?.units || BASE_EXERCISE_UNITS, payload?.roleplayScenarios || ROLEPLAY_SCENARIOS)
        : (payload?.units || LEVEL_UNIT_MAP[levelId] || []),
    ])),
  }), [grammarContentByLevel]);


  useEffect(() => {

    let mounted = true;

    (async () => {

      try {

        const progress = await readProgress();

        if (!mounted) return;

        const grammar = progress.modules.grammar || {};
        setSourceLanguage(progress?.languages?.source_language || "pt-BR");

        const persistedByLevel = grammar.completed_units_by_level || {};

        const merged = { ...defaultCompletedByLevel };

        LEVEL_ORDER.forEach((levelId) => {

          const levelUnits = runtimeLevelUnitMap[levelId] || [];

          const sourceIds =

            Array.isArray(persistedByLevel[levelId])

              ? persistedByLevel[levelId]

              : levelId === "A1"

                ? grammar.completed_units || []

                : [];

          merged[levelId] = sourceIds.filter((id) => levelUnits.some((unit) => unit.id === id));

        });

        setCompletedByLevel(merged);

        setConceptScores(grammar.concept_scores || {});

        setWeakConcepts(Array.isArray(grammar.weak_concepts) ? grammar.weak_concepts : []);

        setSessionResume(grammar.session_resume || null);

        setRecommendedReviewUnit(grammar.recommended_review_unit || null);

        setRecurringErrors(grammar.recurring_errors || {});

        const persistedLevel = LEVEL_ORDER.includes(grammar.current_level) ? grammar.current_level : "A1";

        const persistedIndex = LEVEL_ORDER.indexOf(persistedLevel);

        const canUsePersisted =

          persistedIndex <= 0 ||

          (() => {

            const previousLevel = LEVEL_ORDER[persistedIndex - 1];

            const previousUnits = runtimeLevelUnitMap[previousLevel] || [];

            const previousCompleted = merged[previousLevel] || [];

            return previousCompleted.length >= previousUnits.length;

          })();

        setCurrentLevel(canUsePersisted ? persistedLevel : "A1");

        if (grammar.session_resume?.unitId) {
          setActiveUnitId(grammar.session_resume.unitId);
        }

      } catch {

        // no-op

      } finally {

        if (mounted) setLoading(false);

      }

    })();

    return () => {

      mounted = false;

    };

  }, []);



  useEffect(() => {

    if (loading) return;

    (async () => {

      try {

        const progress = await readProgress();

        progress.modules.grammar = {

          ...(progress.modules.grammar || {}),

          current_level: currentLevel,

        };

        await writeProgress(progress);

      } catch {

        // no-op

      }

    })();

  }, [currentLevel, loading]);



  const completedIds = useMemo(() => completedByLevel[currentLevel] || [], [completedByLevel, currentLevel]);

  const units = useMemo(() => {

    const base = runtimeLevelUnitMap[currentLevel] || [];

    return base.map((u) => enrichUnit(localizeGrammarUnit({

      ...u,

      completed: completedIds.includes(u.id),

    }, sourceLanguage), sourceLanguage));

  }, [completedIds, currentLevel, sourceLanguage, runtimeLevelUnitMap]);

  const reviewUnits = useMemo(() => buildReviewUnits([], conceptScores, recurringErrors, sourceLanguage), [conceptScores, recurringErrors, sourceLanguage]);

  const reviewUnit = reviewUnits[0] || null;

  const availableUnits = useMemo(
    () => buildReviewUnits(units, conceptScores, recurringErrors, sourceLanguage).map((unit) => enrichUnit(localizeGrammarUnit(unit, sourceLanguage), sourceLanguage)),
    [units, conceptScores, recurringErrors, sourceLanguage]
  );

  const activeUnit = availableUnits.find((u) => u.id === activeUnitId) || null;

  const completedCount = units.filter((u) => u.completed).length;

  const isUnlocked = (index) => index === 0 || availableUnits[index - 1]?.completed;

  const conceptDashboard = useMemo(
    () =>
      Object.entries(conceptScores || {})
        .sort((a, b) => Number(a[1] || 0) - Number(b[1] || 0))
        .slice(0, 4),
    [conceptScores]
  );

  const saveSessionResume = useCallback(async (resumePayload) => {
    setSessionResume(resumePayload);
    try {
      const progress = await readProgress();
      progress.modules.grammar = {
        ...(progress.modules.grammar || {}),
        session_resume: resumePayload,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  }, []);

  const handleCompleteUnit = async (payload) => {

    const unitId = typeof payload === "string" ? payload : payload?.unitId;

    const nextIds = payload?.adaptiveReview
      ? completedIds
      : completedIds.includes(unitId)
        ? completedIds
        : [...completedIds, unitId];

    const attemptLog = Array.isArray(payload?.attemptLog) ? payload.attemptLog : [];

    const nextConceptScores = { ...conceptScores };
    attemptLog.forEach((attempt) => {
      const key = attempt.conceptKey || "grammar";
      const current = Number(nextConceptScores[key] || 50);
      nextConceptScores[key] = Math.max(0, Math.min(100, current + (attempt.correct ? 8 : -14)));
    });
    const nextWeakConcepts = Object.entries(nextConceptScores)
      .filter(([, value]) => Number(value || 0) < 55)
      .map(([key]) => key);
    const nextRecurringErrors = { ...(recurringErrors || {}) };
    attemptLog.forEach((attempt) => {
      const key = attempt.conceptKey || "grammar";
      const previous = nextRecurringErrors[key] || {
        count: 0,
        last_wrong_at: null,
        last_reviewed_at: null,
        wrong_lessons: [],
      };

      if (attempt.correct) {
        nextRecurringErrors[key] = {
          ...previous,
          count: Math.max(0, Number(previous.count || 0) - 1),
          last_reviewed_at: new Date().toISOString(),
        };
      } else {
        nextRecurringErrors[key] = {
          ...previous,
          count: Number(previous.count || 0) + 1,
          last_wrong_at: new Date().toISOString(),
          wrong_lessons: [...new Set([...(previous.wrong_lessons || []), attempt.lessonId])].slice(-8),
        };
      }
    });
    const nextReviewUnit = buildReviewUnits([], nextConceptScores, nextRecurringErrors, sourceLanguage)[0] || null;

    const nextByLevel = {

      ...completedByLevel,

      [currentLevel]: nextIds,

    };

    setCompletedByLevel(nextByLevel);
    setConceptScores(nextConceptScores);
    setWeakConcepts(nextWeakConcepts);
    setRecommendedReviewUnit(nextReviewUnit);
    setRecurringErrors(nextRecurringErrors);
    setSessionResume(null);

    try {

      const progress = await readProgress();
      const grammarSavedWords = extractGrammarVocabulary(activeUnit, payload);
      const myVocabulary = progress.modules.my_vocabulary || {};
      const mergedSavedWords = mergeGrammarVocabulary(
        Array.isArray(myVocabulary.saved_words_custom) ? myVocabulary.saved_words_custom : [],
        grammarSavedWords
      );

      progress.modules.grammar = {

        ...(progress.modules.grammar || {}),

        completed_units: nextByLevel.A1 || [],

        completed_units_by_level: nextByLevel,

        current_level: currentLevel,

        last_unit: unitId,

        concept_scores: nextConceptScores,

        weak_concepts: nextWeakConcepts,

        session_resume: null,

        recommended_review_unit: nextReviewUnit,

        recurring_errors: nextRecurringErrors,

        lesson_history: [
          ...(Array.isArray(progress.modules.grammar?.lesson_history) ? progress.modules.grammar.lesson_history : []),
          {
            unit_id: unitId,
            level: currentLevel,
            summary: payload?.summary || { correct: 0, wrong: 0 },
            completed_at: new Date().toISOString(),
          },
        ].slice(-40),

        unit_attempts: {
          ...(progress.modules.grammar?.unit_attempts || {}),
          [unitId]: {
            attempts: attemptLog.length,
            queue_size: payload?.adaptiveQueueSize || attemptLog.length,
            correct: payload?.summary?.correct || 0,
            wrong: payload?.summary?.wrong || 0,
            updated_at: new Date().toISOString(),
          },
        },

      };
      progress.modules.my_vocabulary = {
        ...myVocabulary,
        saved_words_custom: mergedSavedWords,
      };
      progress.my_vocabulary = {
        ...(progress.my_vocabulary || {}),
        ...progress.modules.my_vocabulary,
      };

      await writeProgress(progress);

    } catch {

      // no-op

    }

  };

  if (activeUnit) {

    return (

      <section className="grammar-page-shell" style={themeVars(color)}>

        <LessonRunner
          unit={activeUnit}
          sourceLanguage={sourceLanguage}
          resumeState={sessionResume}
          onClose={() => {
            setActiveUnitId(null);
            saveSessionResume(null);
          }}
          onSaveSession={saveSessionResume}
          onComplete={handleCompleteUnit}
        />

      </section>

    );

  }



  if (loading) {

    return (

      <section className="grammar-page-shell" style={themeVars(color)}>

        <div className="grammar-progress-copy">{getUiLabel("grammar.loading_progress", "Loading progress...")}</div>

      </section>

    );

  }



  return (

    <section className="grammar-page-shell" style={themeVars(color)}>

      <div className="grammar-header-card">

        <button type="button" className="duo-back-btn" onClick={() => setCurrentView?.("initial")}>

          <ArrowLeft size={18} />

          {getUiLabel("common.back", "Back")}

        </button>

        <div className="grammar-header-content">

          <div className="grammar-header-kicker">{getUiLabel("grammar.track_kicker", "{level} - Grammar track").replace("{level}", currentLevel)}</div>

          <h1>{currentLevel === "A1" ? getUiLabel("grammar.current_content", "Current content: {level}").replace("{level}", "A1") : getUiLabel("grammar.level_unlocked", "Level {level} unlocked").replace("{level}", currentLevel)}</h1>

        </div>

        <ModuleGuideButton moduleKey="grammar" color={color} className="grammar-guide-btn" />

      </div>



      <div className="grammar-progress-copy">
        {getUiLabel("grammar.progress", "Progress")}: {completedCount}/{units.length} {getUiLabel("grammar.units_completed", "units completed")}
      </div>

      {conceptDashboard.length ? (
        <div className="grammar-concept-board">
          {conceptDashboard.map(([conceptKey, score]) => (
            <article key={conceptKey} className={`grammar-concept-card is-${computeConceptStatus(score)}`}>
              <strong>{formatConceptLabel(conceptKey)}</strong>
              <span>{Math.round(score)}%</span>
            </article>
          ))}
        </div>
      ) : null}

      {reviewUnit ? (
        <div className="grammar-review-banner">
          <div>
            <p>{getUiLabel("grammar.recommended_review", "Recommended review")}</p>
            <strong>{reviewUnit.title}</strong>
            <span>{getUiLabel("grammar.weak_concepts", "Weak concepts")}: {weakConcepts.length ? weakConcepts.map(formatConceptLabel).join(", ") : getUiLabel("common.none", "none")}</span>
          </div>
          <button type="button" className="grammar-review-btn" onClick={() => setActiveUnitId(reviewUnit.id)}>
            {getUiLabel("grammar.review_now", "Review now")}
          </button>
        </div>
      ) : null}



      <div className="grammar-stage">

        <div className="grammar-trail">

          {units.map((item, index) => (

            <NodeButton

              key={item.id}

              item={item}

              index={index}

              unlocked={isUnlocked(index)}

              active={index === completedCount && isUnlocked(index)}

              isLast={index === units.length - 1}

              onClick={setActiveUnitId}

            />

          ))}

        </div>

        <aside className="grammar-side-illustration">

          <img
            className="grammar-side-image"
            src="/img/duolingo.png"
            alt="Duolingo mascot"
          />

        </aside>

      </div>

    </section>

  );

}
















































