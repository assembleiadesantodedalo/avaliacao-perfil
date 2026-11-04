/* =====================================================================
   ANOMALIAS
   Pequenas coisas estranhas que aparecem aos poucos nas etapas 1 e 2.
   O "nível" da página (0 a 4) sobe conforme a pessoa chega nas
   perguntas com nivel maior (definido em perguntas.js).

   Nível 0-1  tudo normal (só detalhes quase imperceptíveis)
   Nível 2    enunciados trocam por um instante; o logotipo começa a
              seguir o cursor; o contador de pessoas cai
   Nível 3    cores esfriam, granulado na tela, zumbido muito baixo,
              "Lido às..." no salvamento automático
   Nível 4    vinheta escura, tremores, aparece uma "Etapa 3"
   ===================================================================== */
(function () {
  'use strict';

  const F = window.Formulario;
  const corpo = document.body;
  const etapa = Number(corpo.dataset.etapa || 1);
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nivel = Number(corpo.dataset.nivel || 0);
  const ouvintesNivel = [];

  function aleatorio(min, max) { return min + Math.random() * (max - min); }
  function depois(ms, fn) { return setTimeout(fn, ms); }

  function definirNivel(n) {
    if (n <= nivel) return;
    nivel = n;
    corpo.dataset.nivel = String(n);
    ouvintesNivel.forEach(function (fn) { fn(n); });
  }
  function aoMudarNivel(fn) { ouvintesNivel.push(fn); }

  /* ---------- 1. Contador "ao vivo" ---------- */
  // O número base muda a cada minuto, mas é o mesmo para todo mundo que
  // está respondendo no mesmo minuto (fica verossímil numa sala de aula).
  const contador = document.getElementById('contador');
  let desvio = 0;

  function base() {
    const minuto = Math.floor(Date.now() / 60000);
    return 24 + Math.round(5 * Math.sin(minuto / 6) + 2 * Math.sin(minuto / 2.3));
  }
  function textoContador() {
    if (nivel >= 4) return '1 estudante respondendo agora · 1 observando';
    if (nivel >= 3) return '1 estudante respondendo agora';
    if (nivel >= 2) return (3 + (base() % 3)) + ' estudantes respondendo agora';
    const n = etapa === 1 ? base() + desvio : Math.max(6, base() - 8 + desvio);
    return n + ' estudantes respondendo agora';
  }
  function atualizarContador() { if (contador) contador.textContent = textoContador(); }

  if (contador) {
    atualizarContador();
    (function oscilar() {
      depois(aleatorio(6000, 14000), function () {
        desvio = Math.max(-2, Math.min(3, desvio + (Math.random() < 0.5 ? -1 : 1)));
        atualizarContador();
        oscilar();
      });
    })();
    aoMudarNivel(atualizarContador);

    // Etapa 1: uma única piscada para "1 estudante", rápida demais para ter certeza.
    if (etapa === 1) {
      depois(aleatorio(45000, 100000), function () {
        if (document.hidden) return;
        contador.textContent = '1 estudante respondendo agora';
        depois(180, atualizarContador);
      });
    }
  }

  /* ---------- 2. Título da aba ---------- */
  const tituloOriginal = document.title;
  let timerTitulo = null;

  document.addEventListener('visibilitychange', function () {
    const apelido = F.Pessoa.apelido();
    clearTimeout(timerTitulo);
    if (document.hidden) {
      if (nivel >= 4) document.title = apelido ? 'Estou esperando, ' + apelido + '.' : 'Estou esperando.';
      else if (nivel >= 3) document.title = apelido ? 'Volte, ' + apelido + '.' : 'Volte.';
      else if (nivel >= 2) document.title = 'Ainda está aí?';
      else document.title = 'Não esqueça de terminar sua avaliação';
    } else if (nivel >= 3) {
      document.title = 'Eu vi você sair.';
      timerTitulo = depois(2600, function () { document.title = tituloOriginal; });
    } else {
      document.title = tituloOriginal;
    }
  });

  /* ---------- 3. Enunciados que trocam por um instante ---------- */
  const usosSussurro = new Map();

  function visivel(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 60 && r.top < window.innerHeight - 40;
  }

  function sussurrar(maxPorPergunta) {
    const candidatos = [].filter.call(document.querySelectorAll('.pergunta-texto[data-sussurro]'), function (el) {
      return visivel(el) && (usosSussurro.get(el) || 0) < maxPorPergunta;
    });
    if (!candidatos.length) return false;
    const el = candidatos[Math.floor(Math.random() * candidatos.length)];
    usosSussurro.set(el, (usosSussurro.get(el) || 0) + 1);
    el.textContent = el.dataset.sussurro;
    el.classList.add('sussurrando');
    depois(aleatorio(110, 170), function () {
      el.textContent = el.dataset.original;
      el.classList.remove('sussurrando');
    });
    return true;
  }

  if (etapa === 1) {
    // Apenas uma vez, depois de algum tempo e só se a frase estiver na tela.
    const inicio = Date.now();
    (function tentar() {
      depois(aleatorio(4000, 7000), function () {
        if (Date.now() - inicio < 35000 || document.hidden || !sussurrar(1)) tentar();
      });
    })();
  } else {
    (function ciclo() {
      const espera = nivel >= 4 ? aleatorio(6000, 11000) : nivel >= 3 ? aleatorio(9000, 16000) : aleatorio(14000, 24000);
      depois(espera, function () {
        if (nivel >= 2 && !document.hidden) sussurrar(2);
        ciclo();
      });
    })();
  }

  /* ---------- 4. Logotipo que observa ---------- */
  const pupila = document.getElementById('logo-pupila');
  const logo = pupila && pupila.ownerSVGElement;
  let alvoX = 0, alvoY = 0, atualX = 0, atualY = 0, animandoLogo = false;

  function moverPupila() {
    atualX += (alvoX - atualX) * 0.08;
    atualY += (alvoY - atualY) * 0.08;
    const escala = nivel >= 4 ? 1.25 : 1;
    pupila.setAttribute('transform', 'translate(' + atualX.toFixed(2) + ' ' + atualY.toFixed(2) + ') translate(20 20) scale(' + escala + ') translate(-20 -20)');
    if (Math.abs(alvoX - atualX) > 0.01 || Math.abs(alvoY - atualY) > 0.01) requestAnimationFrame(moverPupila);
    else animandoLogo = false;
  }
  function olharPara(x, y) {
    if (!logo || nivel < 2) return;
    const r = logo.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    const alcance = Math.min(1, dist / 260);
    alvoX = (dx / dist) * 3.4 * alcance;
    alvoY = (dy / dist) * 2.2 * alcance;
    if (!animandoLogo) { animandoLogo = true; requestAnimationFrame(moverPupila); }
  }
  if (pupila) {
    window.addEventListener('pointermove', function (e) { olharPara(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('pointerdown', function (e) { olharPara(e.clientX, e.clientY); }, { passive: true });
    // No celular não existe cursor: ele acompanha o ponto da tela em que a pessoa está.
    window.addEventListener('focusin', function (e) {
      const r = e.target.getBoundingClientRect && e.target.getBoundingClientRect();
      if (r) olharPara(r.left + r.width / 2, r.top + r.height / 2);
    });
    aoMudarNivel(function (n) {
      if (n === 2) olharPara(window.innerWidth / 2, window.innerHeight * 0.7);
    });
  }

  /* ---------- 5. "Etapa 2 de 3" ---------- */
  const total = document.getElementById('etapa-total');
  if (total && etapa === 2) {
    (function piscarTotal() {
      depois(aleatorio(16000, 30000), function () {
        if (nivel >= 4) { total.textContent = '3'; return; }
        if (nivel >= 2 && !document.hidden && visivel(total)) {
          total.textContent = '3';
          depois(260, function () { if (nivel < 4) total.textContent = '2'; });
        }
        piscarTotal();
      });
    })();
    aoMudarNivel(function (n) { if (n >= 4) total.textContent = '3'; });
  }

  /* ---------- 6. Rodapé ---------- */
  const rodape = document.getElementById('rodape-texto');
  aoMudarNivel(function (n) {
    if (!rodape) return;
    if (n === 3) rodape.textContent = 'Suas respostas são confidenciais.';
    if (n >= 4) rodape.textContent = 'Suas respostas são confidenciais. Quase sempre.';
  });

  /* ---------- 7. Salvamento automático que também "lê" ---------- */
  const salvo = document.getElementById('salvo');
  document.addEventListener('resposta', function () {
    if (!salvo || nivel < 3) return;
    const hora = F.horaAgora();
    salvo.innerHTML = F.ICONE_CHECK;
    salvo.append(document.createTextNode('Salvo às ' + hora + ' · Lido às ' + hora));
  });

  /* ---------- 8. Granulado na tela ---------- */
  const telaRuido = document.getElementById('ruido');
  let ruidoLigado = false;
  // Grão fino: algumas texturas pequenas de ruído são repetidas pela tela
  // com deslocamento aleatório a cada quadro (leve até em celular).
  function ligarRuido() {
    if (!telaRuido || ruidoLigado) return;
    ruidoLigado = true;
    const c = telaRuido.getContext('2d');
    const texturas = [0, 1, 2].map(function () {
      const t = document.createElement('canvas');
      t.width = t.height = 128;
      const tc = t.getContext('2d');
      const img = tc.createImageData(128, 128);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + Math.random() * 145;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      tc.putImageData(img, 0, 0);
      return c.createPattern(t, 'repeat');
    });
    function ajustar() {
      telaRuido.width = Math.ceil(window.innerWidth / 2);
      telaRuido.height = Math.ceil(window.innerHeight / 2);
    }
    ajustar();
    window.addEventListener('resize', ajustar);
    let ultimo = 0;
    (function desenhar(t) {
      if (t - ultimo > 80 && !document.hidden) {
        ultimo = t;
        const dx = Math.random() * 128, dy = Math.random() * 128;
        c.setTransform(1, 0, 0, 1, -dx, -dy);
        c.fillStyle = texturas[Math.floor(Math.random() * texturas.length)];
        c.fillRect(dx, dy, telaRuido.width, telaRuido.height);
      }
      requestAnimationFrame(desenhar);
    })(0);
  }
  aoMudarNivel(function (n) { if (n >= 3) ligarRuido(); });

  /* ---------- 9. Zumbido baixo ---------- */
  aoMudarNivel(function (n) {
    if (!window.Som) return;
    if (n === 3) Som.droneVolume(0.035, 10);
    if (n >= 4) Som.droneVolume(0.08, 8);
  });

  /* ---------- 10. Tremores ---------- */
  const conteudo = document.querySelector('.conteudo');
  (function tremer() {
    depois(aleatorio(16000, 32000), function () {
      if (nivel >= 4 && !reduzido && conteudo && !document.hidden) {
        conteudo.classList.add('tremor');
        depois(180, function () { conteudo.classList.remove('tremor'); });
      }
      tremer();
    });
  })();

  /* ---------- 11. Texto de exemplo que se escreve sozinho ---------- */
  document.addEventListener('focusin', function (e) {
    const area = e.target;
    if (!area.matches || !area.matches('textarea[data-sussurro-placeholder]') || area.dataset.escrito) return;
    const frase = area.dataset.sussurroPlaceholder;
    depois(1600, function () {
      if (document.activeElement !== area || area.value) return;
      area.dataset.escrito = '1';
      let i = 0;
      (function letra() {
        if (area.value) { area.placeholder = ''; return; }
        area.placeholder = frase.slice(0, ++i);
        if (i < frase.length) depois(aleatorio(70, 140), letra);
      })();
    });
  });

  /* ---------- 12. Nível conforme a pessoa avança ---------- */
  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) definirNivel(Number(en.target.dataset.nivel));
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.pergunta[data-nivel]').forEach(function (el) { observador.observe(el); });
  }

  window.Anomalias = { definirNivel: definirNivel, nivel: function () { return nivel; } };
})();
