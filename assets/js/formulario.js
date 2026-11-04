/* =====================================================================
   FORMULÁRIO
   Monta as perguntas definidas em perguntas.js, guarda as respostas
   apenas no navegador da pessoa (sessionStorage) e valida os campos
   obrigatórios. Nenhuma resposta é enviada para servidor algum.
   ===================================================================== */
(function () {
  'use strict';

  const CHAVE = 'perfil.respostas';
  const CHAVE_META = 'perfil.meta';

  /* ---------- Toda página nova começa no topo ---------- */
  // Impede o navegador de voltar para onde a pessoa estava (ao recarregar
  // ou usar o botão voltar).
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* nada */ }
  function irParaOTopo() { window.scrollTo(0, 0); }
  irParaOTopo();
  window.addEventListener('load', irParaOTopo);
  window.addEventListener('pageshow', irParaOTopo);

  /* ---------- Armazenamento ---------- */

  function ler(chave) {
    try { return JSON.parse(sessionStorage.getItem(chave)) || {}; } catch (e) { return {}; }
  }
  function gravar(chave, valor) {
    try { sessionStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* modo privado: segue só na memória */ }
  }
  function vazio(v) {
    return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
  }

  let respostas = ler(CHAVE);
  let meta = ler(CHAVE_META);

  const Respostas = {
    todas() { return Object.assign({}, respostas); },
    obter(id) { return respostas[id]; },
    definir(id, valor) {
      if (vazio(valor)) delete respostas[id]; else respostas[id] = valor;
      gravar(CHAVE, respostas);
      document.dispatchEvent(new CustomEvent('resposta', { detail: { id, valor } }));
    },
    meta() { return Object.assign({}, meta); },
    marcarInicio() {
      if (!meta.inicio) {
        meta.inicio = Date.now();
        meta.sessao = Math.random().toString(16).slice(2, 10).toUpperCase();
        gravar(CHAVE_META, meta);
      }
      return Respostas.meta();
    },
    apagar() {
      respostas = {};
      meta = {};
      try { sessionStorage.removeItem(CHAVE); sessionStorage.removeItem(CHAVE_META); } catch (e) { /* nada */ }
    }
  };

  /* ---------- Dados da pessoa ---------- */

  function primeiroNome(nome) {
    return (nome || '').trim().split(/\s+/)[0] || '';
  }

  const Pessoa = {
    nome() { return (respostas.nome || '').trim().replace(/\s+/g, ' '); },
    apelido() { return (respostas.apelido || '').trim() || primeiroNome(respostas.nome); },
    // Escolhe a palavra conforme o tratamento informado na etapa 1.
    g(masculino, feminino, neutro) {
      const t = respostas.tratamento || '';
      if (t.indexOf('Ele') === 0) return masculino;
      if (t.indexOf('Ela') === 0) return feminino;
      return neutro;
    }
  };

  // Troca {apelido}, {nome} e {curso}. Com genero = true, "sozinho(a)"
  // vira "sozinho" ou "sozinha" conforme o tratamento escolhido.
  function personalizar(texto, genero) {
    const apelido = Pessoa.apelido();
    let t = String(texto || '');
    if (!apelido) {
      t = t.replace(/\{apelido\},\s*/g, '').replace(/,\s*\{apelido\}/g, '').replace(/\{apelido\}/g, '');
    }
    t = t.replace(/\{apelido\}/g, apelido)
      .replace(/\{nome\}/g, Pessoa.nome())
      .replace(/\{curso\}/g, respostas.curso || '');
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (genero) {
      const fem = Pessoa.g(false, true, null);
      if (fem !== null) t = t.replace(/(\p{L}+)o\(a\)/gu, fem ? '$1a' : '$1o');
    }
    return t;
  }

  /* ---------- Utilidades de DOM ---------- */

  function criar(tag, atributos, conteudo) {
    const el = document.createElement(tag);
    if (atributos) {
      Object.keys(atributos).forEach(function (k) {
        const v = atributos[k];
        if (v === false || v === null || v === undefined) return;
        if (k === 'class') el.className = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    if (conteudo !== undefined && conteudo !== null) {
      [].concat(conteudo).forEach(function (c) {
        el.append(c instanceof Node ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  }

  const ICONE_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function horaAgora(comSegundos) {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + (comSegundos ? ':' + p(d.getSeconds()) : '');
  }

  /* ---------- Campos ---------- */

  const DIAS = [['seg', 'Seg'], ['ter', 'Ter'], ['qua', 'Qua'], ['qui', 'Qui'], ['sex', 'Sex'], ['sab', 'Sáb'], ['dom', 'Dom']];
  const DIAS_EXTENSO = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };
  const PERIODOS = [['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite']];

  function campoTexto(p, idCampo, valor) {
    const tipos = { texto: 'text', numero: 'number', lista: 'text', hora: 'time' };
    const input = criar('input', {
      class: 'entrada',
      id: idCampo,
      type: tipos[p.tipo] || 'text',
      name: p.id,
      placeholder: p.placeholder || null,
      autocomplete: p.autocomplete || 'off',
      inputmode: p.tipo === 'numero' ? 'numeric' : null,
      min: p.min !== undefined ? p.min : null,
      max: p.max !== undefined ? p.max : null,
      list: p.tipo === 'lista' ? idCampo + '-opcoes' : null,
      'aria-describedby': p.ajuda ? 'a-' + p.id : null
    });
    if (valor !== undefined) input.value = valor;
    input.addEventListener('input', function () { Respostas.definir(p.id, input.value.trim()); });
    if (p.tipo !== 'lista') return input;
    const lista = criar('datalist', { id: idCampo + '-opcoes' });
    (p.opcoes || []).forEach(function (o) { lista.append(criar('option', { value: o })); });
    const frag = document.createDocumentFragment();
    frag.append(input, lista);
    return frag;
  }

  function campoLongo(p, idCampo, valor) {
    const area = criar('textarea', {
      class: 'entrada', id: idCampo, name: p.id, rows: 4,
      placeholder: p.placeholder || '',
      'data-sussurro-placeholder': p.sussurroPlaceholder || null,
      'aria-describedby': p.ajuda ? 'a-' + p.id : null
    });
    if (valor !== undefined) area.value = valor;
    area.addEventListener('input', function () { Respostas.definir(p.id, area.value.trim()); });
    return area;
  }

  function campoOpcoes(p, idTitulo, valor, multipla) {
    const grupo = criar('div', {
      class: 'opcoes' + (multipla ? ' chips' : ''),
      role: multipla ? 'group' : 'radiogroup',
      'aria-labelledby': idTitulo
    });
    const marcados = multipla ? [].concat(valor || []) : [valor];
    let jaMarcou = false;
    (p.opcoes || []).forEach(function (texto) {
      const input = criar('input', { type: multipla ? 'checkbox' : 'radio', name: 'q-' + p.id, value: texto });
      if (marcados.indexOf(texto) !== -1 && !(jaMarcou && !multipla)) { input.checked = true; jaMarcou = true; }
      const rotulo = criar('label', { class: 'opcao' + (input.checked ? ' marcada' : '') }, [input, criar('span', null, texto)]);
      grupo.append(rotulo);
    });
    grupo.addEventListener('change', function () {
      const inputs = grupo.querySelectorAll('input');
      inputs.forEach(function (i) { i.parentNode.classList.toggle('marcada', i.checked); });
      if (multipla) {
        Respostas.definir(p.id, [].filter.call(inputs, function (i) { return i.checked; }).map(function (i) { return i.value; }));
      } else {
        const marcado = grupo.querySelector('input:checked');
        Respostas.definir(p.id, marcado ? marcado.value : '');
      }
    });
    return grupo;
  }

  function campoEscala(p, idTitulo, valor) {
    const rotulos = p.rotulos || ['Discordo totalmente', 'Concordo totalmente'];
    const botoes = criar('div', { class: 'escala-botoes', role: 'radiogroup', 'aria-labelledby': idTitulo });
    for (let n = 1; n <= 5; n++) {
      const legenda = n === 1 ? rotulos[0] : n === 5 ? rotulos[1] : null;
      const input = criar('input', { type: 'radio', name: 'q-' + p.id, value: String(n), 'aria-label': legenda ? n + ' (' + legenda + ')' : String(n) });
      if (String(valor) === String(n)) input.checked = true;
      botoes.append(criar('label', { class: 'opcao' + (input.checked ? ' marcada' : '') }, [input, criar('span', null, String(n))]));
    }
    botoes.addEventListener('change', function () {
      botoes.querySelectorAll('input').forEach(function (i) { i.parentNode.classList.toggle('marcada', i.checked); });
      const marcado = botoes.querySelector('input:checked');
      Respostas.definir(p.id, marcado ? Number(marcado.value) : '');
    });
    const pontas = criar('div', { class: 'escala-rotulos', 'aria-hidden': 'true' }, [criar('span', null, rotulos[0]), criar('span', null, rotulos[1])]);
    return criar('div', { class: 'escala' }, [botoes, pontas]);
  }

  function campoAgenda(p, idTitulo, valor) {
    const marcados = [].concat(valor || []);
    const grade = criar('div', { class: 'agenda', role: 'group', 'aria-labelledby': idTitulo });
    grade.append(criar('span', { class: 'agenda-cab', 'aria-hidden': 'true' }, ''));
    PERIODOS.forEach(function (per) { grade.append(criar('span', { class: 'agenda-cab', 'aria-hidden': 'true' }, per[1])); });
    DIAS.forEach(function (dia) {
      grade.append(criar('span', { class: 'agenda-dia', 'aria-hidden': 'true' }, dia[1]));
      PERIODOS.forEach(function (per) {
        const v = dia[0] + '-' + per[0];
        const input = criar('input', { type: 'checkbox', value: v, 'aria-label': DIAS_EXTENSO[dia[0]] + ', ' + per[1].toLowerCase() });
        input.checked = marcados.indexOf(v) !== -1;
        const marca = criar('span', { class: 'agenda-check' });
        marca.innerHTML = ICONE_CHECK;
        grade.append(criar('label', { class: 'agenda-celula' + (input.checked ? ' marcada' : '') }, [input, marca]));
      });
    });
    grade.addEventListener('change', function () {
      const inputs = grade.querySelectorAll('input');
      inputs.forEach(function (i) { i.parentNode.classList.toggle('marcada', i.checked); });
      Respostas.definir(p.id, [].filter.call(inputs, function (i) { return i.checked; }).map(function (i) { return i.value; }));
    });
    return grade;
  }

  /* ---------- Pergunta e seções ---------- */

  function criarPergunta(p, numero, opcoes) {
    const valor = respostas[p.id];
    const idCampo = 'q-' + p.id;
    const idTitulo = 't-' + p.id;
    const campoUnico = ['texto', 'numero', 'lista', 'hora', 'longo'].indexOf(p.tipo) !== -1;

    const wrap = criar('div', {
      class: 'pergunta',
      'data-id': p.id,
      'data-tipo': p.tipo,
      'data-nivel': p.nivel || null,
      'data-som': p.som || null,
      'data-obrigatoria': p.obrigatoria ? 'sim' : null
    });

    const texto = criar('span', { class: 'pergunta-texto' }, personalizar(p.titulo, opcoes.genero));
    texto.dataset.original = texto.textContent;
    if (p.sussurro) texto.dataset.sussurro = personalizar(p.sussurro, opcoes.genero);

    const titulo = criar(campoUnico ? 'label' : 'span', { class: 'pergunta-titulo', id: idTitulo, for: campoUnico ? idCampo : null }, texto);
    if (p.obrigatoria) titulo.append(criar('span', { class: 'obrig', 'aria-hidden': 'true' }, ' *'));

    wrap.append(criar('div', { class: 'pergunta-cab' }, [
      criar('span', { class: 'pergunta-num', 'aria-hidden': 'true' }, String(numero).padStart(2, '0')),
      titulo
    ]));
    if (p.ajuda) wrap.append(criar('p', { class: 'pergunta-ajuda', id: 'a-' + p.id }, personalizar(p.ajuda, opcoes.genero)));

    let campo;
    switch (p.tipo) {
      case 'escolha': campo = campoOpcoes(p, idTitulo, valor, false); break;
      case 'multipla': campo = campoOpcoes(p, idTitulo, valor, true); break;
      case 'escala': campo = campoEscala(p, idTitulo, valor); break;
      case 'agenda': campo = campoAgenda(p, idTitulo, valor); break;
      case 'longo': campo = campoLongo(p, idCampo, valor); break;
      default: campo = campoTexto(p, idCampo, valor);
    }
    wrap.append(criar('div', { class: 'pergunta-campo' }, campo));
    wrap.append(criar('p', { class: 'pergunta-erro', role: 'alert', hidden: true }, 'Esta pergunta é obrigatória.'));

    // Remove o aviso de erro assim que a pessoa responde.
    wrap.addEventListener('input', limparErro);
    wrap.addEventListener('change', limparErro);
    function limparErro() {
      if (!wrap.classList.contains('com-erro')) return;
      if (!vazio(respostas[p.id])) {
        wrap.classList.remove('com-erro');
        wrap.querySelector('.pergunta-erro').hidden = true;
      }
    }
    return wrap;
  }

  function renderizar(container, secoes, opcoes) {
    opcoes = opcoes || {};
    let numero = opcoes.numeroInicial || 1;
    container.textContent = '';
    secoes.forEach(function (secao, i) {
      const idSecao = (opcoes.prefixo || 's') + '-' + i;
      const el = criar('section', { class: 'secao cartao', 'aria-labelledby': idSecao });
      const cab = criar('header', { class: 'secao-cab' });
      if (opcoes.rotuloSecao !== false) cab.append(criar('p', { class: 'secao-rotulo' }, 'Seção ' + (i + 1)));
      cab.append(criar('h2', { id: idSecao }, personalizar(secao.titulo, opcoes.genero)));
      if (secao.descricao) cab.append(criar('p', { class: 'secao-desc' }, personalizar(secao.descricao, opcoes.genero)));
      el.append(cab);
      const lista = criar('div', { class: 'perguntas' });
      secao.perguntas.forEach(function (p) { lista.append(criarPergunta(p, numero++, opcoes)); });
      el.append(lista);
      container.append(el);
    });
  }

  // Com modoTeste ligado em perguntas.js, nada é obrigatório.
  const modoTeste = !!(window.PERFIL && PERFIL.config && PERFIL.config.modoTeste);

  function validar(container) {
    if (modoTeste) return true;
    let primeiro = null;
    container.querySelectorAll('.pergunta[data-obrigatoria]').forEach(function (el) {
      const ok = !vazio(respostas[el.dataset.id]);
      el.classList.toggle('com-erro', !ok);
      el.querySelector('.pergunta-erro').hidden = ok;
      if (!ok && !primeiro) primeiro = el;
    });
    if (primeiro) {
      primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const foco = primeiro.querySelector('input, textarea');
      if (foco) setTimeout(function () { foco.focus({ preventScroll: true }); }, 350);
    }
    return !primeiro;
  }

  /* ---------- Progresso e salvamento ---------- */

  function ligarProgresso(container, barra) {
    if (!barra) return;
    function atualizar() {
      const ids = [].map.call(container.querySelectorAll('.pergunta'), function (el) { return el.dataset.id; });
      const feitas = ids.filter(function (id) { return !vazio(respostas[id]); }).length;
      barra.style.width = (ids.length ? Math.round((feitas / ids.length) * 100) : 0) + '%';
    }
    document.addEventListener('resposta', atualizar);
    atualizar();
  }

  function ligarSalvamento(el) {
    if (!el) return;
    document.addEventListener('resposta', function () {
      el.innerHTML = ICONE_CHECK;
      el.append(document.createTextNode('Salvo automaticamente às ' + horaAgora()));
      el.classList.add('ativo');
    });
  }

  function preencherConfig() {
    const cfg = (window.PERFIL && PERFIL.config) || {};
    document.querySelectorAll('[data-config]').forEach(function (el) {
      const v = cfg[el.dataset.config];
      if (v) el.textContent = v;
    });
  }

  function navegar(url) {
    document.body.classList.add('saindo');
    setTimeout(function () { window.location.href = url; }, 260);
  }

  window.Formulario = {
    Respostas: Respostas,
    Pessoa: Pessoa,
    personalizar: personalizar,
    renderizar: renderizar,
    validar: validar,
    modoTeste: modoTeste,
    ligarProgresso: ligarProgresso,
    ligarSalvamento: ligarSalvamento,
    preencherConfig: preencherConfig,
    navegar: navegar,
    irParaOTopo: irParaOTopo,
    horaAgora: horaAgora,
    vazio: vazio,
    ICONE_CHECK: ICONE_CHECK
  };
})();
