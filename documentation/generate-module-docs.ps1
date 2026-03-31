$docDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$sharedCss = @'
@font-face {
  font-family: "DIN Round Pro";
  src: url("../fonts/dinroundpro_medi.otf") format("opentype");
  font-weight: 500;
}
@font-face {
  font-family: "DIN Round Pro";
  src: url("../fonts/dinroundpro_bold.otf") format("opentype");
  font-weight: 700;
}
:root {
  --doc-theme: #58cc02;
  --doc-theme-dark: #3f9800;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #ffffff;
  color: #1f2a30;
  font-family: "DIN Round Pro", sans-serif;
  font-weight: 500;
}
.page { width: min(1140px, calc(100vw - 40px)); margin: 28px auto 48px; }
.hero, .card, .scene-card { background: #ffffff; border: 2px solid var(--doc-theme); box-shadow: 0 10px 24px rgba(0,0,0,0.06); }
.hero { border-radius: 28px; padding: 28px 30px; }
.eyebrow, .pill, .mock-chip {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px;
  background: var(--doc-theme); color: #ffffff; border: 2px solid var(--doc-theme);
  font-size: 0.84rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
}
h1, h2, h3 { margin: 0; font-weight: 700; color: var(--doc-theme-dark); }
h1 { margin-top: 18px; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.02; }
.hero p { margin: 14px 0 0; color: #304047; font-size: 1.02rem; line-height: 1.6; max-width: 920px; }
.section-grid, .scene-grid { margin-top: 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.card { border-radius: 24px; padding: 22px 24px; }
.card h2 { margin-bottom: 14px; font-size: 1.5rem; }
.card p, .card li { color: #41535b; line-height: 1.6; }
.card strong { color: #182126; }
.list { margin: 0; padding-left: 20px; display: grid; gap: 10px; }
.pill-row { display: flex; flex-wrap: wrap; gap: 10px; }
.scene-card { border-radius: 24px; overflow: hidden; }
.scene-head { padding: 14px 16px; border-bottom: 2px solid color-mix(in srgb, var(--doc-theme) 22%, #ffffff 78%); background: #ffffff; }
.scene-head strong { display: block; color: var(--doc-theme-dark); font-weight: 700; margin-bottom: 4px; }
.scene-head span { color: #5b6b72; font-size: 0.92rem; }
.scene-body { padding: 16px; display: grid; gap: 14px; }
.mock-panel, .mock-metric, .mock-list-item {
  border-radius: 18px; padding: 14px 16px; background: #ffffff;
  border: 2px solid color-mix(in srgb, var(--doc-theme) 28%, #ffffff 72%);
}
.mock-panel strong, .mock-metric strong, .mock-list-item strong { display: block; margin-bottom: 4px; color: #182126; }
.mock-panel p, .mock-list-item p { margin: 0; color: #5b6b72; line-height: 1.55; }
.mock-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.mock-metric span { display: block; color: #5b6b72; font-size: 0.82rem; }
.mock-metric strong { font-size: 1.1rem; }
.mock-bar-row { display: grid; grid-template-columns: 110px 1fr 40px; gap: 10px; align-items: center; color: #182126; }
.mock-bar { height: 12px; border-radius: 999px; background: rgba(24,33,38,0.1); overflow: hidden; }
.mock-bar > span { display: block; height: 100%; border-radius: inherit; background: var(--doc-theme); }
.footer-note { margin-top: 18px; border-radius: 18px; padding: 14px 16px; background: #ffffff; border: 2px solid var(--doc-theme); color: #304047; }
@media (max-width: 900px) {
  .page { width: min(100vw - 24px, 1140px); margin: 14px auto 26px; }
  .hero, .card { padding: 18px; }
  .section-grid, .scene-grid, .mock-row { grid-template-columns: 1fr; }
  .mock-bar-row { grid-template-columns: 90px 1fr 36px; }
}
'@

Set-Content -Path (Join-Path $docDir 'shared-doc.css') -Value $sharedCss -Encoding UTF8

$docs = @(
  @{File='my-vocabulary-documentation.html';Title='My Vocabulary';Theme='#FF4A49';Dark='#c5302f';Intro='Documentacao do modulo My Vocabulary, dedicado a salvar, organizar e reutilizar palavras importantes ao longo da jornada do aluno.';Pills=@('Glossario pessoal','Favoritos','Recentes','Busca tolerante','Integracao com Flashcards','Revisao global')},
  @{File='dictionary-documentation.html';Title='Dictionary';Theme='#A46845';Dark='#7d4f33';Intro='Documentacao do modulo Dictionary, usado para consulta detalhada de palavras com significados, classes gramaticais, IPA, exemplos e audio.';Pills=@('Busca alfabetica','Multiplos significados','IPA','Exemplos','Sinonimos','Audio')},
  @{File='speak-with-ai-documentation.html';Title='Speak With AI';Theme='#14E5FF';Dark='#0c9fb3';Intro='Documentacao do modulo Speak With AI, projetado para simulacao de conversa, correcao contextual, leitura em voz alta e expansao de vocabulario.';Pills=@('Chat contextual','Memoria de conversa','Vocab upgrade','Voz a voz','Integracao com Vocabulary','IA real opcional')},
  @{File='courses-documentation.html';Title='Courses';Theme='#A76EFF';Dark='#7147b8';Intro='Documentacao do modulo Courses, pensado para organizar cursos completos com progresso por aula, materiais extras e certificado demonstravel.';Pills=@('Cursos por trilha','Progresso por aula','Materiais extras','Certificado','Resumo do curso')},
  @{File='reading-documentation.html';Title='Reading';Theme='#C76B03';Dark='#9a5201';Intro='Documentacao do modulo Reading, focado em leitura por nivel, perguntas de compreensao, glossario contextual e explicacao por erro.';Pills=@('Textos por nivel','Perguntas','Glossario contextual','Audio','Integracao com Vocabulary')},
  @{File='pronounce-documentation.html';Title='Pronounce';Theme='#FD9700';Dark='#c67600';Intro='Documentacao do modulo Pronounce, voltado para pratica de sons, feedback fonetico, score de fala e orientacao articulatoria.';Pills=@('Treino de fala','Score fonetico','Analise por fonema','Dica de boca','Progresso de vogais e consoantes')},
  @{File='writing-documentation.html';Title='Writing';Theme='#0084C6';Dark='#085163';Intro='Documentacao do modulo Writing, focado em escrita progressiva, montagem de frase, correcao, reescrita e feedback de estilo e clareza.';Pills=@('Trilha de escrita','Montar frase','Corrigir frase','Longform','Estilo e clareza','IA corretora opcional')},
  @{File='games-documentation.html';Title='Games';Theme='#5B3F88';Dark='#402d60';Intro='Documentacao do modulo Games, estruturado para treino rapido, competitivo e viciante com reaproveitamento inteligente de erros do aluno.';Pills=@('Speed Context','Pontuacao','Combo','Dificuldade progressiva','Ranking','Reforco de erros')},
  @{File='modern-methodologies-documentation.html';Title='Modern Methodologies';Theme='#5902B0';Dark='#3f007f';Intro='Documentacao do modulo Modern Methodologies, que funciona como mentor inteligente para melhoria avancada do ingles por categoria e objetivo.';Pills=@('Mentoria IA','Categorias','Objetivos','Profundidade de sessao','Feedback contextual')},
  @{File='listening-documentation.html';Title='Listening';Theme='#a61b57';Dark='#7b1340';Intro='Documentacao do modulo Listening, com temas, frases em sequencia, autoplay, repeat, sotaques e velocidades controladas.';Pills=@('Temas','Autoplay','Repeat','Sotaques','Velocidades','Reset diario')},
  @{File='immersion-documentation.html';Title='Immersion';Theme='#b00245';Dark='#7e0130';Intro='Documentacao do modulo Immersion, concebido como um livro tematico com contexto, exemplos, audio e checkpoints internos.';Pills=@('Livro por tema','Contexto','Exemplos','Mini dialogo','Checkpoints','Bridge com Reading e Listening')},
  @{File='speak-with-natives-documentation.html';Title='Speak With Natives';Theme='#d1a56b';Dark='#9c7645';Intro='Documentacao do modulo Speak With Natives, com lista de nativos, chamada de video, chat lateral, agenda e recursos de seguranca.';Pills=@('Lista de nativos','Videochamada','Chat lateral','Agenda','Status online','Moderacao')},
  @{File='translation-practice-documentation.html';Title='Translation Practice';Theme='#573A22';Dark='#3f2a18';Intro='Documentacao do modulo Translation Practice, focado em traducao ativa com validacao semantica, contexto e mistura EN-PT e PT-EN.';Pills=@('Frase e input','Feedback','Contexto','Validacao semantica','Mais niveis','IA opcional')},
  @{File='test-your-english-level-documentation.html';Title='Test Your English Level';Theme='#606160';Dark='#454645';Intro='Documentacao do modulo Test Your English Level, criado para avaliar listening, reading, speaking e writing com resultado final e nivel estimado.';Pills=@('Listening','Reading','Speaking','Writing','Nivel estimado','Relatorio')},
  @{File='community-documentation.html';Title='Community';Theme='#333333';Dark='#222222';Intro='Documentacao do modulo Community, com feed limpo, interacoes locais, moderacao e notificacoes.';Pills=@('Feed','Composer','Comentarios','Likes','Moderacao','Notificacoes')},
  @{File='music-documentation.html';Title='Music';Theme='#FF86CE';Dark='#c95f9f';Intro='Documentacao do modulo Music, desenhado para usar musica como motor de aprendizado com video, letra, traducao e audio por linha.';Pills=@('Busca no YouTube','Video','Letra','Traducao','Audio por linha','Fallback manual')},
  @{File='profile-documentation.html';Title='Profile';Theme='#DB8E73';Dark='#a7654f';Intro='Documentacao do modulo Profile, responsavel por consolidar identidade, historico, metas, badges e leitura geral da jornada do aluno.';Pills=@('Estatisticas','Metas','Historico','Avatar','Badges','Configuracoes')}
)

foreach ($doc in $docs) {
  $pillHtml = ($doc.Pills | ForEach-Object { "<span class='pill'>$_</span>" }) -join "`n            "
  $html = @"
<!DOCTYPE html>
<html lang='pt-BR'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>$($doc.Title) Documentation</title>
    <link rel='stylesheet' href='./shared-doc.css' />
    <style>
      :root {
        --doc-theme: $($doc.Theme);
        --doc-theme-dark: $($doc.Dark);
      }
    </style>
  </head>
  <body>
    <main class='page'>
      <section class='hero'>
        <div class='eyebrow'>$($doc.Title) Documentation</div>
        <h1>$($doc.Title)</h1>
        <p>$($doc.Intro)</p>
      </section>

      <section class='section-grid'>
        <article class='card'>
          <h2>Visao geral do modulo</h2>
          <div class='pill-row'>
            $pillHtml
          </div>
        </article>
        <article class='card'>
          <h2>Papel dentro da plataforma</h2>
          <ul class='list'>
            <li><strong>Funcao central:</strong> este modulo complementa a jornada principal do English Platform.</li>
            <li><strong>Uso pratico:</strong> combina interface dedicada, persistencia e leitura do progresso do aluno.</li>
            <li><strong>Ligacao:</strong> conversa com perfil, motores pedagogicos e relatorios.</li>
          </ul>
        </article>
      </section>

      <section class='section-grid'>
        <article class='card'>
          <h2>Funcionalidades principais</h2>
          <ul class='list'>
            <li><strong>Experiencia guiada:</strong> cada modulo foi desenhado para funcionar como uma etapa clara do estudo.</li>
            <li><strong>Persistencia:</strong> estados e progresso sao salvos para retomada posterior.</li>
            <li><strong>Leitura visual:</strong> o modulo entrega contexto suficiente para demonstracao e uso continuo.</li>
          </ul>
        </article>
        <article class='card'>
          <h2>Valor pedagogico</h2>
          <ul class='list'>
            <li><strong>Objetivo:</strong> contribuir com uma habilidade ou fase importante da aprendizagem.</li>
            <li><strong>Diferencial:</strong> integrar pratica, feedback e continuidade dentro do ecossistema da plataforma.</li>
            <li><strong>Efeito:</strong> reduzir fragmentacao do estudo e aumentar consistencia na jornada do aluno.</li>
          </ul>
        </article>
      </section>

      <section class='card'>
        <h2>Cenas do modulo</h2>
        <p>As cenas abaixo foram recriadas em HTML/CSS para documentar a experiencia visual do modulo sem depender de prints.</p>
        <div class='scene-grid'>
          <article class='scene-card'>
            <div class='scene-head'>
              <strong>Painel principal</strong>
              <span>Entrada visual do modulo e leitura do estado atual.</span>
            </div>
            <div class='scene-body'>
              <div class='mock-panel'>
                <strong>Cabecalho do modulo</strong>
                <p>Apresentacao do contexto, titulo e CTA principal para comecar.</p>
              </div>
              <div class='mock-chip'>Modulo ativo</div>
            </div>
          </article>

          <article class='scene-card'>
            <div class='scene-head'>
              <strong>Interacao principal</strong>
              <span>Area onde o aluno executa a acao central do modulo.</span>
            </div>
            <div class='scene-body'>
              <div class='mock-panel'>
                <strong>Fluxo central</strong>
                <p>Exercicio, pratica, consulta ou conversa conforme a proposta do modulo.</p>
              </div>
              <div class='mock-panel'>
                <strong>Feedback auxiliar</strong>
                <p>Retorno visual ou pedagogico usado para orientar o proximo passo.</p>
              </div>
            </div>
          </article>

          <article class='scene-card'>
            <div class='scene-head'>
              <strong>Indicadores</strong>
              <span>Metricas curtas que ajudam a entender progresso e status.</span>
            </div>
            <div class='scene-body'>
              <div class='mock-row'>
                <div class='mock-metric'><span>Score</span><strong>84%</strong></div>
                <div class='mock-metric'><span>Tempo</span><strong>12m</strong></div>
                <div class='mock-metric'><span>Status</span><strong>Ativo</strong></div>
              </div>
            </div>
          </article>

          <article class='scene-card'>
            <div class='scene-head'>
              <strong>Resumo visual</strong>
              <span>Leitura consolidada de desempenho ou prioridade.</span>
            </div>
            <div class='scene-body'>
              <div class='mock-bar-row'><span>Progresso</span><div class='mock-bar'><span style='width:72%'></span></div><strong>72</strong></div>
              <div class='mock-bar-row'><span>Retencao</span><div class='mock-bar'><span style='width:61%'></span></div><strong>61</strong></div>
              <div class='mock-bar-row'><span>Dominio</span><div class='mock-bar'><span style='width:83%'></span></div><strong>83</strong></div>
            </div>
          </article>
        </div>
      </section>

      <section class='card'>
        <h2>Observacoes de implementacao</h2>
        <ul class='list'>
          <li><strong>Cor tema:</strong> a documentacao segue a cor principal do modulo.</li>
          <li><strong>Fonte:</strong> usa a mesma familia tipografica local do projeto, <code>DIN Round Pro</code>.</li>
          <li><strong>Formato:</strong> documento visual em HTML para apresentacao, consulta tecnica e futura exportacao.</li>
        </ul>
        <div class='footer-note'>Este documento resume a proposta, a funcao e a experiencia visual do modulo <strong>$($doc.Title)</strong> dentro do English Platform.</div>
      </section>
    </main>
  </body>
</html>
"@
  Set-Content -Path (Join-Path $docDir $doc.File) -Value $html -Encoding UTF8
}
