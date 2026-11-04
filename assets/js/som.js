/* =====================================================================
   SOM
   Todos os sons são gerados na hora com a Web Audio API (nenhum arquivo
   de áudio). Os navegadores só liberam som depois que a pessoa clica ou
   toca na página; até lá, os pedidos de som contínuo ficam na fila.
   ===================================================================== */
(function () {
  'use strict';

  const habilitado = !(window.PERFIL && PERFIL.config && PERFIL.config.som === false);
  const CHAVE_MUDO = 'perfil.mudo';

  let ctx = null;
  let mestre = null;
  let mudo = false;
  let pendentes = [];
  let buffers = {};
  let drone = null;
  let bpm = 0;
  let timerBatida = null;

  try { mudo = sessionStorage.getItem(CHAVE_MUDO) === '1'; } catch (e) { /* nada */ }

  function contexto() {
    if (!habilitado) return null;
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 6;
    mestre = ctx.createGain();
    mestre.gain.value = mudo ? 0 : 1;
    mestre.connect(compressor);
    compressor.connect(ctx.destination);
    return ctx;
  }

  function executarPendentes() {
    const fila = pendentes;
    pendentes = [];
    fila.forEach(function (fn) { try { fn(); } catch (e) { /* ignora */ } });
  }

  function jaInteragiu() {
    return navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
  }

  // persistente = true: guarda o pedido até o som ser liberado (drone, batimento).
  // persistente = false: efeitos curtos que só fazem sentido na hora.
  function quandoPronto(fn, persistente) {
    if (!habilitado) return;
    if (!ctx && !jaInteragiu()) { if (persistente) pendentes.push(fn); return; }
    const c = contexto();
    if (!c) return;
    if (c.state === 'running') { try { fn(); } catch (e) { /* ignora */ } return; }
    if (persistente) pendentes.push(fn);
    c.resume().then(executarPendentes).catch(function () { /* bloqueado */ });
  }

  function desbloquear() {
    if (!habilitado || (!ctx && !pendentes.length)) return;
    const c = contexto();
    if (!c) return;
    if (c.state !== 'running') c.resume().then(executarPendentes).catch(function () { /* nada */ });
    else executarPendentes();
  }
  // Tenta ligar o som sem esperar um clique. O Chrome costuma permitir logo
  // depois de a pessoa ter clicado numa página anterior do mesmo site; nos
  // outros navegadores o som começa no primeiro clique ou toque.
  function tentarIniciar() {
    const c = contexto();
    if (!c) return;
    if (c.state === 'running') executarPendentes();
    else c.resume().then(function () { if (c.state === 'running') executarPendentes(); }).catch(function () { /* nada */ });
  }

  ['pointerdown', 'keydown', 'touchend'].forEach(function (t) {
    window.addEventListener(t, desbloquear, { passive: true });
  });

  /* ---------- Matéria-prima ---------- */

  function ruido(tipo) {
    if (buffers[tipo]) return buffers[tipo];
    const tamanho = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, tamanho, ctx.sampleRate);
    const d = b.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < tamanho; i++) {
      const branco = Math.random() * 2 - 1;
      if (tipo === 'marrom') {
        ultimo = (ultimo + 0.02 * branco) / 1.02;
        d[i] = ultimo * 3.5;
      } else {
        d[i] = branco;
      }
    }
    buffers[tipo] = b;
    return b;
  }

  function fonteRuido(tipo) {
    const s = ctx.createBufferSource();
    s.buffer = ruido(tipo);
    s.loop = true;
    return s;
  }

  /* ---------- Zumbido grave contínuo ---------- */

  function criarDrone() {
    const saida = ctx.createGain();
    saida.gain.value = 0;
    saida.connect(mestre);

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 170;
    filtro.Q.value = 5;
    filtro.connect(saida);

    [[41.2, 'sawtooth', 0.5], [41.9, 'sawtooth', 0.5], [61.8, 'sine', 0.35], [123.1, 'sine', 0.06]].forEach(function (c) {
      const o = ctx.createOscillator();
      o.type = c[1];
      o.frequency.value = c[0];
      const g = ctx.createGain();
      g.gain.value = c[2];
      o.connect(g);
      g.connect(filtro);
      o.start();
    });

    // Oscilação lenta do filtro: o zumbido "respira".
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const profundidade = ctx.createGain();
    profundidade.gain.value = 70;
    lfo.connect(profundidade);
    profundidade.connect(filtro.frequency);
    lfo.start();

    const vento = fonteRuido('marrom');
    const filtroVento = ctx.createBiquadFilter();
    filtroVento.type = 'lowpass';
    filtroVento.frequency.value = 420;
    const ganhoVento = ctx.createGain();
    ganhoVento.gain.value = 0.55;
    vento.connect(filtroVento);
    filtroVento.connect(ganhoVento);
    ganhoVento.connect(saida);
    vento.start();

    drone = { saida: saida };
  }

  function droneVolume(volume, segundos) {
    quandoPronto(function () {
      if (!drone) criarDrone();
      const t = ctx.currentTime;
      const g = drone.saida.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(volume, t + (segundos === undefined ? 4 : segundos));
    }, true);
  }

  /* ---------- Batimento cardíaco ---------- */

  function pulso(atraso, intensidade) {
    const t = ctx.currentTime + atraso + 0.02;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85 * intensidade, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g);
    g.connect(mestre);
    o.start(t);
    o.stop(t + 0.36);
  }

  function batimento(novoBpm) {
    quandoPronto(function () {
      const estavaParado = !bpm;
      bpm = Math.max(30, Math.min(180, novoBpm));
      if (!estavaParado && timerBatida) return;
      (function ciclo() {
        if (!bpm) { timerBatida = null; return; }
        pulso(0, 1);
        pulso(0.27, 0.65);
        timerBatida = setTimeout(ciclo, 60000 / bpm);
      })();
    }, true);
  }

  function pararBatimento() {
    bpm = 0;
    clearTimeout(timerBatida);
    timerBatida = null;
  }

  /* ---------- Efeitos curtos ---------- */

  function estatica(duracao, volume) {
    quandoPronto(function () {
      const d = duracao || 0.25;
      const v = volume || 0.2;
      const t = ctx.currentTime;
      const s = fonteRuido('branco');
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2200 + Math.random() * 2200;
      f.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(v, t);
      // Pequenos cortes deixam o chiado mais "quebrado".
      for (let i = 0.03; i < d; i += 0.04 + Math.random() * 0.05) {
        g.gain.setValueAtTime(Math.random() < 0.3 ? v * 0.15 : v, t + i);
      }
      g.gain.linearRampToValueAtTime(0, t + d);
      s.connect(f);
      f.connect(g);
      g.connect(mestre);
      s.start(t, Math.random() * 1.5);
      s.stop(t + d + 0.05);
    }, false);
  }

  function tecla() {
    quandoPronto(function () {
      const t = ctx.currentTime;
      const s = ctx.createBufferSource();
      s.buffer = ruido('branco');
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 1800 + Math.random() * 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      s.connect(f);
      f.connect(g);
      g.connect(mestre);
      s.start(t, Math.random() * 1.8);
      s.stop(t + 0.04);
    }, false);
  }

  function impacto() {
    quandoPronto(function () {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(62, t);
      o.frequency.exponentialRampToValueAtTime(24, t + 1.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g);
      g.connect(mestre);
      o.start(t);
      o.stop(t + 2.5);

      const s = fonteRuido('branco');
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(3000, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.8);
      const gr = ctx.createGain();
      gr.gain.setValueAtTime(0.5, t);
      gr.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      s.connect(f);
      f.connect(gr);
      gr.connect(mestre);
      s.start(t);
      s.stop(t + 1);
    }, false);
  }

  // Três batidas abafadas, como alguém batendo numa porta.
  function batidasNaPorta() {
    quandoPronto(function () {
      [0, 0.32, 0.64].forEach(function (atraso, i) {
        const t = ctx.currentTime + atraso + Math.random() * 0.04;
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(130, t);
        o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
        const g = ctx.createGain();
        const v = i === 2 ? 0.9 : 0.7;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 600;
        o.connect(g);
        g.connect(f);
        f.connect(mestre);
        o.start(t);
        o.stop(t + 0.2);

        const s = ctx.createBufferSource();
        s.buffer = ruido('branco');
        const fr = ctx.createBiquadFilter();
        fr.type = 'bandpass';
        fr.frequency.value = 900;
        const gr = ctx.createGain();
        gr.gain.setValueAtTime(0.25, t);
        gr.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        s.connect(fr);
        fr.connect(gr);
        gr.connect(mestre);
        s.start(t, Math.random());
        s.stop(t + 0.06);
      });
    }, false);
  }

  function alternarMudo() {
    mudo = !mudo;
    try { sessionStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0'); } catch (e) { /* nada */ }
    if (mestre) mestre.gain.setTargetAtTime(mudo ? 0 : 1, ctx.currentTime, 0.05);
    return mudo;
  }

  window.Som = {
    habilitado: habilitado,
    desbloquear: desbloquear,
    tentarIniciar: tentarIniciar,
    droneVolume: droneVolume,
    batimento: batimento,
    pararBatimento: pararBatimento,
    estatica: estatica,
    tecla: tecla,
    impacto: impacto,
    batidasNaPorta: batidasNaPorta,
    alternarMudo: alternarMudo,
    estaMudo: function () { return mudo; },
    bpm: function () { return bpm; }
  };
})();
