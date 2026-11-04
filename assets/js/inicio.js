/* =====================================================================
   INÍCIO DAS ETAPAS 1 E 2
   Monta a página, cuida do botão "Continuar" (etapa 1) e do glitch ao
   enviar (etapa 2).
   ===================================================================== */
(function () {
  'use strict';

  const F = window.Formulario;
  const cfg = window.PERFIL.config;
  const etapa = Number(document.body.dataset.etapa || 1);
  const container = document.getElementById('perguntas');
  const form = document.getElementById('formulario');

  F.preencherConfig();
  F.Respostas.marcarInicio();
  F.renderizar(container, etapa === 1 ? PERFIL.etapa1 : PERFIL.etapa2, { genero: etapa >= 2 });
  F.ligarProgresso(container, document.getElementById('progresso'));
  F.ligarSalvamento(document.getElementById('salvo'));

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Lembrete visível de que o modo de teste está ligado.
  if (F.modoTeste) {
    const selo = document.createElement('p');
    selo.className = 'selo-teste';
    selo.textContent = 'Modo de teste: nenhuma pergunta é obrigatória';
    document.querySelector('.conteudo').prepend(selo);
  }

  /* ---------- Etapa 1 ---------- */
  if (etapa === 1) {
    const declaracao = document.getElementById('declaracao');
    const erroDeclaracao = document.getElementById('erro-declaracao');
    declaracao.checked = !!F.Respostas.obter('declaracao');
    declaracao.addEventListener('change', function () {
      F.Respostas.definir('declaracao', declaracao.checked);
      if (declaracao.checked) erroDeclaracao.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const ok = F.validar(container);
      const declarou = declaracao.checked || F.modoTeste;
      erroDeclaracao.hidden = declarou;
      if (ok && !declarou) declaracao.focus();
      if (ok && declarou) F.navegar('etapa-2.html');
    });
    return;
  }

  /* ---------- Etapa 2 ---------- */
  const saudacao = document.getElementById('saudacao');
  const apelido = F.Pessoa.apelido();
  if (saudacao) saudacao.textContent = apelido ? 'Obrigado, ' + apelido + '! Falta pouco.' : 'Obrigado! Falta pouco.';

  const botao = document.getElementById('botao-enviar');
  const faixas = document.getElementById('faixas');
  const cortina = document.getElementById('cortina');
  const segundos = Math.max(1, Number(cfg.segundosAteRedirecionar) || 3);
  let enviando = false;

  // Faixas horizontais que invertem as cores da tela por alguns instantes.
  function rajadaFaixas(duracao, quantidade) {
    faixas.textContent = '';
    for (let i = 0; i < quantidade; i++) {
      const f = document.createElement('span');
      f.className = 'faixa';
      faixas.append(f);
    }
    faixas.classList.add('ativas');
    const fim = performance.now() + duracao;
    (function quadro() {
      faixas.childNodes.forEach(function (f) {
        f.style.top = (Math.random() * 100).toFixed(1) + '%';
        f.style.height = (2 + Math.random() * 38).toFixed(0) + 'px';
        f.style.transform = 'translateX(' + ((Math.random() - 0.5) * 40).toFixed(0) + 'px)';
        f.style.opacity = (0.35 + Math.random() * 0.65).toFixed(2);
      });
      if (performance.now() < fim) setTimeout(quadro, 55);
      else faixas.classList.remove('ativas');
    })();
  }

  // Um tranco rápido no conteúdo da página (pode repetir).
  function pulsoGlitch() {
    document.body.classList.remove('glitch-leve');
    void document.body.offsetWidth;
    document.body.classList.add('glitch-leve');
  }

  async function enviar() {
    if (enviando) return;
    enviando = true;
    botao.disabled = true;
    botao.classList.add('carregando');
    botao.querySelector('.rotulo').textContent = 'Enviando…';

    await esperar(650);

    // Sem mensagem de erro: a página só "trava" no envio e glitcha.
    for (let s = segundos; s > 0; s--) {
      pulsoGlitch();
      rajadaFaixas(s === segundos ? 420 : 160, s === segundos ? 5 : 3);
      if (window.Som) Som.estatica(s === segundos ? 0.35 : 0.15, 0.14);
      await esperar(s === 1 ? 550 : 1000);
    }

    // Final mais pesado e corte para o preto
    document.body.classList.add('glitch-forte');
    rajadaFaixas(450, 9);
    if (window.Som) Som.estatica(0.5, 0.3);
    await esperar(300);
    cortina.classList.add('fechada');
    await esperar(150);
    window.location.replace('falha.html');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (F.validar(container)) enviar();
  });

  // "Voltar" não volta: o botão dá um glitch e desaparece.
  const voltar = document.getElementById('botao-voltar');
  if (voltar) {
    voltar.addEventListener('click', function () {
      if (enviando || voltar.classList.contains('sumindo')) return;
      voltar.classList.add('sumindo');
      pulsoGlitch();
      rajadaFaixas(220, 3);
      if (window.Som) Som.estatica(0.3, 0.14);
      setTimeout(function () {
        voltar.remove();
        botao.focus({ preventScroll: true });
      }, 660);
    });
  }
})();
