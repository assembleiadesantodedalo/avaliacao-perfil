/* =====================================================================
   PÁGINA DE TERROR
   Sequência: perguntas da etapa 3 -> tela preta com um link quase invisível
   -> revelação. (Opcional: texto que "lê" as respostas antes da etapa 3.)
   Tudo acontece no próprio navegador; nada é enviado.
   ===================================================================== */
(function () {
  'use strict';

  const F = window.Formulario;
  const cfg = window.PERFIL.config;
  const respostas = F.Respostas.todas();
  const meta = F.Respostas.meta();
  const apelido = F.Pessoa.apelido();
  const g = F.Pessoa.g;
  const carregadoEm = Date.now();
  const temSom = !!(window.Som && Som.habilitado);
  const som = window.Som || {};

  function $(id) { return document.getElementById(id); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function dois(n) { return String(n).padStart(2, '0'); }
  function chamarSom(nome) {
    const args = [].slice.call(arguments, 1);
    if (temSom && typeof som[nome] === 'function') som[nome].apply(null, args);
  }
  function vibrar(padrao) {
    try { if (navigator.vibrate) navigator.vibrate(padrao); } catch (e) { /* nada */ }
  }

  /* ---------- Estática de TV ---------- */
  const Estatica = (function () {
    const canvas = $('estatica');
    const c = canvas.getContext('2d');
    const L = 300;
    const A = Math.max(120, Math.min(640, Math.round(L * window.innerHeight / Math.max(1, window.innerWidth))));
    canvas.width = L;
    canvas.height = A;
    const img = c.createImageData(L, A);
    let base = 0.07, pico = 0.5, ate = 0, ultimo = 0;
    (function quadro(t) {
      if (t - ultimo > 45 && !document.hidden) {
        ultimo = t;
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }
        c.putImageData(img, 0, 0);
        canvas.style.opacity = performance.now() < ate ? pico : base;
      }
      requestAnimationFrame(quadro);
    })(0);
    return {
      rajada: function (ms, intensidade) {
        ate = performance.now() + ms;
        pico = intensidade || 0.5;
        canvas.style.opacity = pico;
      },
      base: function (v) { base = v; }
    };
  })();

  /* ---------- HUD de câmera ---------- */
  const hud = $('hud');
  function atualizarHud() {
    const d = new Date();
    $('hud-data').textContent = dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + F.horaAgora(true);
    const s = Math.max(0, Math.floor((Date.now() - (meta.inicio || carregadoEm)) / 1000));
    $('hud-tempo').textContent = dois(Math.floor(s / 3600)) + ':' + dois(Math.floor(s / 60) % 60) + ':' + dois(s % 60);
  }
  atualizarHud();
  setInterval(atualizarHud, 1000);

  /* ---------- Título da aba, ícone e botão voltar ---------- */
  let iniciou = false;
  let preso = true;
  let tituloAtual = document.title;

  function definirTitulo(t) {
    tituloAtual = t;
    if (!document.hidden) document.title = t;
  }
  document.addEventListener('visibilitychange', function () {
    if (!iniciou || !preso) return;
    if (document.hidden) {
      document.title = apelido ? 'Volte, ' + apelido + '.' : 'Volte.';
    } else {
      document.title = 'Eu vi você sair.';
      setTimeout(function () { if (!document.hidden) document.title = tituloAtual; }, 2600);
    }
  });

  function aviso(texto, ms) {
    const el = $('aviso');
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(aviso.timer);
    aviso.timer = setTimeout(function () { el.hidden = true; }, ms || 2400);
  }

  // Na primeira vez que a pessoa tenta voltar, ela fica. Na segunda, sai.
  try { history.pushState({ falha: true }, '', location.href); } catch (e) { /* nada */ }
  let avisouVoltar = false;
  window.addEventListener('popstate', function () {
    if (avisouVoltar || !preso) return;
    avisouVoltar = true;
    aviso('Não há como voltar.');
    chamarSom('estatica', 0.2, 0.12);
    Estatica.rajada(200, 0.4);
  });

  /* ---------- Botão de som ---------- */
  const botaoSom = $('botao-som');
  function rotuloSom() {
    const mudo = temSom && som.estaMudo();
    botaoSom.textContent = mudo ? 'som: desligado' : 'som: ligado';
    botaoSom.setAttribute('aria-pressed', mudo ? 'true' : 'false');
  }
  if (temSom) {
    rotuloSom();
    botaoSom.addEventListener('click', function () { som.alternarMudo(); rotuloSom(); });
  }

  /* ---------- Informações do aparelho ---------- */
  async function coletarDispositivo() {
    const ua = navigator.userAgent;
    const d = {};
    const iPadNovo = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    const tablet = /iPad|Tablet/i.test(ua) || iPadNovo || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const celular = !tablet && (/Android|iPhone|iPod|Mobile/i.test(ua));
    if (/iPhone/.test(ua)) d.aparelho = 'um iPhone';
    else if (tablet) d.aparelho = /iPad/.test(ua) || iPadNovo ? 'um iPad' : 'um tablet';
    else if (celular) d.aparelho = /Android/i.test(ua) ? 'um celular Android' : 'um celular';
    else if (/CrOS/.test(ua)) d.aparelho = 'um Chromebook';
    else if (/Windows/.test(ua)) d.aparelho = 'um computador com Windows';
    else if (/Mac OS X|Macintosh/.test(ua)) d.aparelho = 'um Mac';
    else if (/Linux/.test(ua)) d.aparelho = 'um computador com Linux';
    else d.aparelho = 'um computador';
    d.portatil = celular || tablet;

    try {
      if (navigator.getBattery) {
        const b = await Promise.race([navigator.getBattery(), esperar(800).then(function () { return null; })]);
        // Computador de mesa costuma dizer "100%, carregando": não assusta ninguém.
        if (b && !(b.level === 1 && b.charging)) {
          d.bateria = Math.round(b.level * 100);
          d.carregando = b.charging;
        }
      }
    } catch (e) { /* sem bateria */ }

    if (cfg.usarLocalizacaoAproximada) {
      try {
        const controle = new AbortController();
        setTimeout(function () { controle.abort(); }, 2500);
        const resp = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controle.signal });
        const j = await resp.json();
        if (j && j.city) d.cidade = j.city;
      } catch (e) { /* sem localização */ }
    }
    return d;
  }

  /* ---------- Textos montados a partir das respostas ---------- */
  const DIA_PREP = { seg: 'nas segundas', ter: 'nas terças', qua: 'nas quartas', qui: 'nas quintas', sex: 'nas sextas', sab: 'aos sábados', dom: 'aos domingos' };
  const DIA_NOME = { seg: 'segunda-feira', ter: 'terça-feira', qua: 'quarta-feira', qui: 'quinta-feira', sex: 'sexta-feira', sab: 'sábado', dom: 'domingo' };
  const PERIODO = { manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };
  const PERIODO_AGORA = { manha: 'Ainda é de manhã.', tarde: 'Já é de tarde.', noite: 'Já é noite.' };
  const ORDEM_DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  function juntar(itens) {
    if (itens.length <= 1) return itens.join('');
    return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
  }

  function descreverAgenda(lista) {
    const porDia = {};
    lista.forEach(function (v) {
      const partes = v.split('-');
      (porDia[partes[0]] = porDia[partes[0]] || []).push(partes[1]);
    });
    const frases = ORDEM_DIAS.filter(function (d) { return porDia[d]; }).map(function (d) {
      const periodos = ['manha', 'tarde', 'noite'].filter(function (p) { return porDia[d].indexOf(p) !== -1; });
      return DIA_PREP[d] + ' ' + juntar(periodos.map(function (p) { return PERIODO[p]; }));
    });
    if (frases.length > 3) return frases.slice(0, 3).join(', ') + ' e em outros momentos';
    return juntar(frases);
  }

  function momentoAtual() {
    const d = new Date();
    const h = d.getHours();
    return {
      dia: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][d.getDay()],
      periodo: h >= 5 && h < 12 ? 'manha' : h >= 12 && h < 18 ? 'tarde' : 'noite'
    };
  }

  function formatarHora(hhmm) {
    const p = String(hhmm).split(':');
    if (p.length < 2) return hhmm;
    return Number(p[0]) + 'h' + (p[1] === '00' ? '' : p[1]);
  }

  function resumir(texto, max) {
    const t = String(texto).replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1).trim() + '…' : t;
  }

  function gerarLeituras(disp) {
    const r = respostas;
    const L = [];
    function add(texto, extra) { L.push(Object.assign({ texto: texto }, extra || {})); }
    const sozinho = g('sozinho', 'sozinha', 'sozinho(a)');

    if (F.Pessoa.nome()) add('Nome: ' + F.Pessoa.nome() + '.', { classe: 'sistema', velocidade: 22, pausa: 350 });
    const turma = [r.curso, r.serie, r.turno && r.turno.toLowerCase()].filter(Boolean);
    if (turma.length) add((r.curso ? 'Curso: ' : 'Turma: ') + turma.join(', ') + '.', { classe: 'sistema', velocidade: 22, pausa: 900 });

    const n = parseInt(r.pessoas, 10);
    if (n === 1) add('Você mora ' + sozinho + '.');
    else if (n > 1) add('Você mora com mais ' + (n - 1) + ' ' + (n - 1 === 1 ? 'pessoa' : 'pessoas') + '.');
    if (r.quarto === 'Sim') add('E tem um quarto só seu.');
    if (r.janela === 'Sim') add('A janela do seu quarto dá para a rua.', { pausa: 1000 });

    const agenda = Array.isArray(r.sozinho) ? r.sozinho : [];
    if (agenda.length) {
      add('Você fica ' + sozinho + ' em casa ' + descreverAgenda(agenda) + '.', { pausa: 1100 });
      const agora = momentoAtual();
      if (agenda.indexOf(agora.dia + '-' + agora.periodo) !== -1) {
        add('Hoje é ' + DIA_NOME[agora.dia] + '. ' + PERIODO_AGORA[agora.periodo], { pausa: 1200 });
        add('Você está ' + sozinho + ' agora, não está?', { classe: 'vermelho', glitch: true, pausa: 1500 });
      }
    }

    if (r.tranca === 'Às vezes') add('Você nem sempre tranca a porta.');
    else if (r.tranca === 'Nunca') add('Você não costuma trancar a porta.');
    else if (r.tranca === 'Sempre') add('Você sempre tranca a porta.', { pausa: 900 }), add('Sempre?', { classe: 'vermelho' });
    else if (r.tranca === 'Não sei') add('Você não sabe se a porta está trancada.');

    if (r.dorme) add('Você costuma dormir por volta das ' + formatarHora(r.dorme) + '.');
    if (Number(r.olhares) >= 4) add('Você não gosta que fiquem te olhando.', { pausa: 1000 });
    if (r.observado === 'Frequentemente' || r.observado === 'Às vezes') {
      add('Você sente que está sendo ' + g('observado', 'observada', 'observado(a)') + '.', { pausa: 1000 });
      add('Você está ' + g('certo', 'certa', 'certo(a)') + '.', { classe: 'vermelho', glitch: true, pausa: 1300 });
    }

    if (disp.aparelho) add('Você está usando ' + disp.aparelho + '.', { classe: 'sistema' });
    add('São ' + F.horaAgora() + '.', { classe: 'sistema' });
    if (disp.bateria !== undefined) add('Sua bateria está em ' + disp.bateria + '%.' + (disp.carregando ? '' : ' Não está carregando.'), { classe: 'sistema' });
    if (disp.cidade) add('Você está em ' + disp.cidade + '.', { classe: 'vermelho', glitch: true });
    const minutos = Math.floor((Date.now() - (meta.inicio || carregadoEm)) / 60000);
    if (minutos >= 1) add('Você está aqui há ' + minutos + ' ' + (minutos === 1 ? 'minuto' : 'minutos') + '.', { pausa: 1100 });

    if (r.sozinho_agora === 'Sim') add('E agora você está ' + sozinho + '.', { classe: 'vermelho', pausa: 1200 });
    else if (r.sozinho_agora === 'Não') add('Você disse que não está ' + sozinho + '. Tem certeza de que contou todo mundo?', { pausa: 1300 });
    if (r.alguem_sabe === 'Não' || r.alguem_sabe === 'Não sei') add('E ninguém sabe onde você está.', { classe: 'vermelho', glitch: true, pausa: 1300 });

    if (r.atras) {
      add('Você escreveu que atrás de você tem: “' + resumir(r.atras, 90) + '”.', { pausa: 1300 });
      add('Tem certeza de que é só isso?', { classe: 'vermelho', glitch: true, pausa: 1500 });
    }

    if (L.length < 5) {
      add('Você quase não respondeu nada.', { pausa: 1000 });
      add('Não tem problema.', { pausa: 1000 });
      add('Eu já sabia mesmo.', { classe: 'vermelho', glitch: true, pausa: 1300 });
    }
    return L;
  }

  /* ---------- Pular o texto com um clique ---------- */
  // Um clique (ou Espaço/Enter) completa a frase que está sendo escrita;
  // com a frase já completa, o clique encurta a pausa até a próxima.
  let podePular = false;
  let digitando = false;
  let completar = false;
  let fimDaPausa = null;

  if (window.matchMedia('(pointer: coarse)').matches) $('dica-pular').textContent = 'toque para avançar';

  // semDica = true permite pular sem mostrar "clique para avançar".
  function permitirPular(sim, semDica) {
    podePular = sim;
    document.body.classList.toggle('pode-pular', sim && !semDica);
    if (!sim) completar = false;
  }

  function pular() {
    if (!podePular) return;
    if (digitando) completar = true;
    if (fimDaPausa) fimDaPausa();
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || e.target.closest('button, a, input, textarea, label')) return;
    pular();
  });
  document.addEventListener('keydown', function (e) {
    if (!podePular || (e.key !== ' ' && e.key !== 'Enter')) return;
    if (e.target.closest && e.target.closest('button, a, input, textarea')) return;
    e.preventDefault();
    pular();
  });

  // Igual a esperar(), mas termina antes se a pessoa clicar.
  function pausa(ms) {
    return new Promise(function (resolve) {
      const timer = setTimeout(acabar, ms);
      function acabar() {
        clearTimeout(timer);
        if (fimDaPausa === acabar) fimDaPausa = null;
        resolve();
      }
      fimDaPausa = acabar;
    });
  }

  // Escreve letra por letra no fim do elemento.
  async function digitar(el, texto, vel, chanceSom) {
    const inicio = el.textContent;
    digitando = true;
    completar = false;
    for (const ch of texto) {
      if (completar) break;
      el.textContent += ch;
      if (ch.trim() && Math.random() < chanceSom) chamarSom('tecla');
      await pausa(ch === ',' ? vel * 4 : ch === '.' || ch === '?' ? vel * 5 : vel + Math.random() * vel * 0.7);
    }
    el.textContent = inicio + texto;
    digitando = false;
    completar = false;
  }

  /* ---------- Terminal ---------- */
  const terminal = $('terminal');
  const MAX_LINHAS = 7;

  async function escrever(texto, opcoes) {
    opcoes = opcoes || {};
    terminal.querySelectorAll('.linha.atual').forEach(function (l) { l.classList.remove('atual'); });
    const linha = document.createElement('p');
    linha.className = 'linha atual ' + (opcoes.classe || '');
    terminal.append(linha);

    const vivas = terminal.querySelectorAll('.linha:not(.saindo)');
    for (let i = 0; i < vivas.length - MAX_LINHAS; i++) {
      const velha = vivas[i];
      velha.classList.add('saindo');
      setTimeout(function () { velha.remove(); }, 800);
    }

    await digitar(linha, texto, opcoes.velocidade || 34, 0.85);
    if (opcoes.glitch) {
      Estatica.rajada(180, 0.35);
      chamarSom('estatica', 0.16, 0.12);
    }
    return linha;
  }

  async function limparTerminal() {
    terminal.querySelectorAll('.linha').forEach(function (l) { l.classList.add('saindo'); });
    await esperar(650);
    terminal.textContent = '';
  }

  function flash() {
    const f = $('flash');
    f.classList.remove('ativo');
    void f.offsetWidth;
    f.classList.add('ativo');
  }

  function sacudir() {
    document.body.classList.remove('sacudir');
    void document.body.offsetWidth;
    document.body.classList.add('sacudir');
    setTimeout(function () { document.body.classList.remove('sacudir'); }, 340);
  }

  // Tela inteira tremendo com cores separadas por um instante.
  function glitchTela(ms) {
    document.body.classList.remove('glitchando');
    void document.body.offsetWidth;
    document.body.classList.add('glitchando');
    clearTimeout(glitchTela.timer);
    glitchTela.timer = setTimeout(function () { document.body.classList.remove('glitchando'); }, ms || 500);
  }

  /* ---------- Cenas ---------- */
  async function cenaTerminal(promessaDispositivo) {
    terminal.hidden = false;
    permitirPular(true);
    chamarSom('droneVolume', 0.1, 6);
    await pausa(500);
    await escrever(apelido ? 'Não houve erro nenhum, ' + apelido + '.' : 'Não houve erro nenhum.');
    await pausa(800);
    await escrever('Suas respostas chegaram.');
    await pausa(900);
    await escrever('Todas elas.', { classe: 'vermelho', glitch: true });
    hud.classList.add('visivel');
    await pausa(1700);
    await limparTerminal();

    const leituras = gerarLeituras(await promessaDispositivo);
    for (const l of leituras) {
      await escrever(l.texto, l);
      await pausa(l.pausa || 750);
    }
    await pausa(800);
    await limparTerminal();
    await pausa(900);
    chamarSom('droneVolume', 0.17, 2);
    await escrever('Não precisa se virar.', { classe: 'vermelho grande', velocidade: 75 });
    await pausa(2000);
    Estatica.rajada(650, 0.6);
    chamarSom('estatica', 0.6, 0.3);
    glitchTela(450);
    await limparTerminal();
    chamarSom('batimento', 62);
    vibrar([40, 180, 40]);
    await pausa(700);
    await escrever(apelido ? 'Agora é a minha vez de perguntar, ' + apelido + '.' : 'Agora é a minha vez de perguntar.', { velocidade: 45 });
    await pausa(2200);
    permitirPular(false);
    Estatica.rajada(400, 0.5);
    chamarSom('estatica', 0.35, 0.2);
    glitchTela(350);
    await esperar(350);
    terminal.hidden = true;
  }

  const reagidas = new Set();
  function reagir(e) {
    const id = e.detail && e.detail.id;
    if (!id || reagidas.has(id) || !document.querySelector('#perguntas-etapa3 [data-id="' + id + '"]')) return;
    reagidas.add(id);
    chamarSom('batimento', Math.min(150, (temSom ? som.bpm() : 70) + 10));
    chamarSom('estatica', 0.1, 0.08);
    Estatica.rajada(140, 0.3);
    vibrar(30);
  }

  function cenaEtapa3() {
    const tela = $('tela-etapa3');
    F.renderizar($('perguntas-etapa3'), PERFIL.etapa3, { genero: true, rotuloSecao: false, prefixo: 'e3' });
    tela.hidden = false;
    document.body.classList.add('modo-formulario');
    F.irParaOTopo();
    definirTitulo('Etapa 3 de 3');
    chamarSom('batimento', 72);
    document.addEventListener('resposta', reagir);

    // Perguntas com "som" (ex.: batidas na porta) tocam quando aparecem na tela.
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          obs.unobserve(en.target);
          const tipo = en.target.dataset.som;
          setTimeout(function () {
            if (tipo === 'batidas') { chamarSom('batidasNaPorta'); setTimeout(sacudir, 640); vibrar([60, 260, 60, 260, 90]); }
            if (tipo === 'estatica') { chamarSom('estatica', 0.6, 0.25); Estatica.rajada(600, 0.5); }
            if (tipo === 'impacto') { chamarSom('impacto'); flash(); }
          }, 700);
        });
      }, { threshold: 0.6 });
      tela.querySelectorAll('.pergunta[data-som]').forEach(function (el) { obs.observe(el); });
    }

    $('form-etapa3').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!F.validar($('perguntas-etapa3'))) return;
      $('botao-entregar').disabled = true;
      cenaFinal();
    });
  }

  async function cenaFinal() {
    // Sem glitch: tudo some, aparece a pergunta e depois só o link.
    document.removeEventListener('resposta', reagir);
    chamarSom('pararBatimento');
    chamarSom('droneVolume', 0, 1.5);
    $('tela-etapa3').hidden = true;
    document.body.classList.remove('modo-formulario');
    hud.classList.remove('visivel');
    botaoSom.hidden = true;
    Estatica.base(0.03);
    F.irParaOTopo();
    await esperar(1200);

    const fim = $('tela-fim');
    const texto = $('fim-texto');
    const link = $('fim-link');
    fim.hidden = false;

    // A pergunta aparece sozinha e some; só depois vem o link.
    permitirPular(true, true);
    await digitar(texto, 'Você já tentou sair dessa sala?', 95, 0.8);
    await pausa(2200);
    permitirPular(false);
    texto.classList.add('sumindo');
    await esperar(1000);
    texto.hidden = true;
    await esperar(600);

    // A explicação de que é um projeto escolar só aparece depois que a pessoa
    // clica no link (ou depois de 1 minuto, se ela não encontrar).
    if (cfg.linkNoEscuro) {
      link.href = cfg.linkNoEscuro;
      link.textContent = cfg.linkNoEscuro;
      link.hidden = false;
      if (cfg.mostrarRevelacaoFinal !== false) {
        let revelado = false;
        const mostrarRevelacao = function () {
          if (revelado) return;
          revelado = true;
          setTimeout(function () { fim.hidden = true; revelar(); }, 900);
        };
        link.addEventListener('click', mostrarRevelacao);
        setTimeout(mostrarRevelacao, 60000);
      }
      return;
    }

    await esperar(3000);
    if (cfg.mostrarRevelacaoFinal !== false) {
      fim.hidden = true;
      revelar();
    }
  }

  function revelar() {
    preso = false;
    const itens = [];
    if (respostas.pessoas) itens.push('quantas pessoas moram com você');
    if (Array.isArray(respostas.sozinho) && respostas.sozinho.length) itens.push('em que horários fica ' + g('sozinho', 'sozinha', 'sozinho(a)') + ' em casa');
    if (respostas.dorme) itens.push('a que horas dorme');
    if (respostas.alguem_sabe) itens.push('se alguém sabe onde você está');
    $('revelacao-reflexao').textContent = itens.length
      ? 'Mas pense: em poucos minutos, você contou a um site que nunca tinha visto ' + juntar(itens) + '.'
      : 'Mas pense: um site que você nunca tinha visto pediu detalhes da sua rotina. Você teria respondido?';
    F.Respostas.apagar();
    Estatica.base(0.03);
    $('favicon').href = 'assets/img/icone.svg';
    definirTitulo('Fim');
    botaoSom.hidden = true;
    document.body.classList.add('revelada');
    $('revelacao').hidden = false;
    F.irParaOTopo();
  }

  /* ---------- Início ---------- */
  // A página já abre no escuro (o glitch acontece ao enviar a etapa 2) e vai
  // direto para as perguntas da etapa 3. Com mostrarTextoDoTerminal ligado em
  // perguntas.js, antes delas aparece o texto que lê as respostas.
  async function iniciar() {
    if (iniciou) return;
    iniciou = true;
    if (temSom) {
      som.tentarIniciar();
      botaoSom.hidden = false;
    }
    chamarSom('droneVolume', 0.02, 0.5);
    $('favicon').href = 'assets/img/icone-olho.svg';

    if (cfg.mostrarTextoDoTerminal) {
      const promessaDispositivo = coletarDispositivo();
      await esperar(400);
      chamarSom('estatica', 0.7, 0.25);
      Estatica.rajada(700, 0.55);
      glitchTela(600);
      sacudir();
      await esperar(700);
      await cenaTerminal(promessaDispositivo);
    } else {
      await esperar(300);
      Estatica.rajada(350, 0.45);
      chamarSom('estatica', 0.3, 0.18);
    }
    hud.classList.add('visivel');
    cenaEtapa3();
  }

  iniciar();
})();
