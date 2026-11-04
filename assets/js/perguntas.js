/* =====================================================================
   CONFIGURAÇÃO E PERGUNTAS
   ---------------------------------------------------------------------
   Este é o único arquivo que você precisa editar para trocar textos e
   perguntas. Cada pergunta é um objeto com estes campos:

     id          identificador único (sem espaços nem acentos)
     tipo        'texto' | 'numero' | 'lista' | 'escolha' | 'multipla'
                 'escala' | 'hora' | 'agenda' | 'longo'
     titulo      o enunciado. Pode usar {apelido} e {nome}.
     ajuda       (opcional) texto pequeno abaixo do enunciado
     opcoes      (escolha, multipla, lista) lista de opções
     rotulos     (escala) texto das pontas: ['Discordo', 'Concordo']
     obrigatoria (opcional) true para obrigar a resposta
     placeholder (opcional) texto de exemplo dentro do campo
     nivel       (só etapa 2) de 1 a 4. Quanto maior, mais estranha a
                 página fica quando a pessoa chega nessa pergunta.
     sussurro    (opcional) frase que substitui o enunciado por uma
                 fração de segundo, de vez em quando.
     som         (só etapa 3) 'batidas' | 'estatica' | 'impacto'
                 toca um som quando a pergunta aparece na tela.
   ===================================================================== */

window.PERFIL = {

  config: {
    instituicao: 'Programa Perfil Estudantil',
    titulo: 'Avaliação de Perfil do Estudante',
    ano: '2026',
    tempoEstimado: '8 minutos',

    // MODO DE TESTE: true permite avançar sem preencher nada (nenhuma
    // pergunta fica obrigatória). Troque para false antes da apresentação.
    modoTeste: true,

    // Segundos de glitch depois de clicar em "Enviar respostas", antes da
    // página de terror.
    segundosAteRedirecionar: 3,

    // Link quase invisível na tela preta do final da página de terror.
    // Deixe '' para não mostrar link.
    linkNoEscuro: 'https://bit.ly/4sEvwFL',

    // true mostra, antes das perguntas da etapa 3, o texto de terminal que
    // "lê" as respostas da pessoa (nome, quem mora com ela, horários...).
    mostrarTextoDoTerminal: false,

    // Sons gerados pelo navegador (zumbido, batimento, estática).
    som: true,

    // Mensagem final explicando que é um projeto escolar e que nada foi
    // enviado. Recomendado manter ligado.
    mostrarRevelacaoFinal: false,

    // Mostra a cidade aproximada da pessoa (pelo IP, usando a API pública
    // get.geojs.io). Em redes de escola a cidade costuma sair errada,
    // por isso vem desligado.
    usarLocalizacaoAproximada: false
  },

  /* -------------------------------------------------------------------
     ETAPA 1 — Identificação e perfil (tudo normal)
     ------------------------------------------------------------------- */
  etapa1: [
    {
      titulo: 'Identificação',
      descricao: 'Usamos estes dados apenas para organizar as respostas por turma.',
      perguntas: [
        { id: 'nome', tipo: 'texto', titulo: 'Nome completo', placeholder: 'Digite seu nome', obrigatoria: true, autocomplete: 'name' },
        { id: 'apelido', tipo: 'texto', titulo: 'Como você prefere ser chamado(a)?', placeholder: 'Ex.: Ana, Juninho, Duda', ajuda: 'Opcional. Vamos usar esse nome ao longo da avaliação.' },
        { id: 'tratamento', tipo: 'escolha', titulo: 'Como prefere ser tratado(a)?', opcoes: ['Ele / dele', 'Ela / dela', 'Prefiro não informar'] },
        { id: 'idade', tipo: 'numero', titulo: 'Idade', min: 12, max: 70, placeholder: 'Ex.: 16' },
        { id: 'serie', tipo: 'escolha', titulo: 'Série / módulo', opcoes: ['1º ano', '2º ano', '3º ano', 'Outro'], obrigatoria: true },
        { id: 'turno', tipo: 'escolha', titulo: 'Turno', opcoes: ['Manhã', 'Tarde', 'Noite', 'Integral'] }
      ]
    },
    {
      titulo: 'Personalidade',
      descricao: 'Indique o quanto você concorda com cada frase. Não existem respostas certas ou erradas.',
      perguntas: [
        { id: 'p_grupo', tipo: 'escala', titulo: 'Gosto de trabalhar em grupo.', rotulos: ['Discordo totalmente', 'Concordo totalmente'] },
        { id: 'p_planejar', tipo: 'escala', titulo: 'Prefiro planejar antes de começar uma tarefa.', rotulos: ['Discordo totalmente', 'Concordo totalmente'] },
        { id: 'p_mudancas', tipo: 'escala', titulo: 'Me adapto com facilidade a mudanças.', rotulos: ['Discordo totalmente', 'Concordo totalmente'], sussurro: 'Me adapto com facilidade ao escuro.' },
        { id: 'p_publico', tipo: 'escala', titulo: 'Fico à vontade falando em público.', rotulos: ['Discordo totalmente', 'Concordo totalmente'] },
        { id: 'p_sozinho', tipo: 'escala', titulo: 'Gosto de passar tempo sozinho(a).', rotulos: ['Discordo totalmente', 'Concordo totalmente'] }
      ]
    },
    {
      titulo: 'Preferências',
      descricao: 'Conte um pouco sobre o que você gosta.',
      perguntas: [
        { id: 'materia', tipo: 'escolha', titulo: 'Qual área você mais gosta de estudar?', opcoes: ['Exatas', 'Humanas', 'Linguagens', 'Ciências da natureza', 'Disciplinas técnicas'] },
        { id: 'estudo', tipo: 'escolha', titulo: 'Como você prefere estudar?', opcoes: ['Sozinho(a)', 'Em grupo', 'Com música', 'Em silêncio total'] },
        { id: 'periodo', tipo: 'escolha', titulo: 'Em que período do dia você rende mais?', opcoes: ['Manhã', 'Tarde', 'Noite', 'Madrugada'] },
        { id: 'hobbies', tipo: 'multipla', titulo: 'O que você gosta de fazer no tempo livre?', ajuda: 'Marque quantas opções quiser.', opcoes: ['Jogos', 'Esportes', 'Música', 'Leitura', 'Séries e filmes', 'Desenho', 'Redes sociais', 'Sair com amigos', 'Cozinhar'] },
        { id: 'filme', tipo: 'escolha', titulo: 'Gênero de filme favorito', opcoes: ['Comédia', 'Ação', 'Romance', 'Terror', 'Ficção científica', 'Animação', 'Documentário'] }
      ]
    }
  ],

  /* -------------------------------------------------------------------
     ETAPA 2 — Rotina e bem-estar (vai ficando específica)
     ------------------------------------------------------------------- */
  etapa2: [
    {
      titulo: 'Rotina',
      descricao: 'Algumas perguntas sobre o seu dia a dia.',
      perguntas: [
        { id: 'transporte', nivel: 1, tipo: 'escolha', titulo: 'Como você costuma vir para a escola?', opcoes: ['A pé', 'Ônibus', 'Carro', 'Bicicleta', 'Outro'] },
        { id: 'trajeto', nivel: 1, tipo: 'escolha', titulo: 'Quanto tempo dura o trajeto?', opcoes: ['Até 15 min', '15 a 30 min', '30 a 60 min', 'Mais de 1 hora'] },
        { id: 'ambiente', nivel: 1, tipo: 'escolha', titulo: 'Em que tipo de ambiente você se concentra melhor?', opcoes: ['Silencioso', 'Com algum barulho', 'Movimentado'] },
        { id: 'cansaco', nivel: 1, tipo: 'escala', titulo: 'Com que frequência você se sente cansado(a) durante as aulas?', rotulos: ['Nunca', 'Sempre'] }
      ]
    },
    {
      titulo: 'Bem-estar',
      descricao: 'Estas perguntas ajudam a entender como você se sente em diferentes situações.',
      perguntas: [
        { id: 'olhares', nivel: 2, tipo: 'escala', titulo: 'Você se sente desconfortável quando há pessoas te olhando?', rotulos: ['Nem um pouco', 'Muito'], sussurro: 'Você sente quando alguém está te olhando?' },
        { id: 'observado', nivel: 2, tipo: 'escolha', titulo: 'Com que frequência você sente que está sendo observado(a)?', opcoes: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'], sussurro: 'Agora, por exemplo?' },
        { id: 'pessoas', nivel: 2, tipo: 'numero', titulo: 'Quantas pessoas moram na sua casa, contando com você?', min: 1, max: 20, placeholder: 'Ex.: 4', sussurro: 'Quantas pessoas sentiriam a sua falta?' },
        { id: 'quarto', nivel: 2, tipo: 'escolha', titulo: 'Você tem um quarto só seu?', opcoes: ['Sim', 'Não, divido com alguém'] }
      ]
    },
    {
      titulo: 'Ambiente doméstico',
      descricao: 'Informações sobre a sua rotina em casa.',
      perguntas: [
        { id: 'sozinho', nivel: 3, tipo: 'agenda', titulo: 'Em que momentos da semana você costuma ficar sozinho(a) em casa?', ajuda: 'Marque todos os períodos que se aplicam.', sussurro: 'Em que momentos ninguém ouviria você?' },
        { id: 'tranca', nivel: 3, tipo: 'escolha', titulo: '{apelido}, você costuma trancar a porta quando está sozinho(a)?', opcoes: ['Sempre', 'Às vezes', 'Nunca', 'Não sei'], sussurro: 'Tem certeza?' },
        { id: 'janela', nivel: 3, tipo: 'escolha', titulo: 'A janela do seu quarto dá para a rua?', opcoes: ['Sim', 'Não', 'Meu quarto não tem janela'] },
        { id: 'dorme', nivel: 3, tipo: 'hora', titulo: 'Por volta de que horas você costuma dormir?', sussurro: 'Por volta de que horas você para de prestar atenção?' }
      ]
    },
    {
      titulo: 'Para finalizar',
      descricao: 'Últimas perguntas. Responda com sinceridade.',
      perguntas: [
        { id: 'sozinho_agora', nivel: 4, tipo: 'escolha', titulo: 'Neste momento, você está sozinho(a)?', opcoes: ['Sim', 'Não'] },
        { id: 'alguem_sabe', nivel: 4, tipo: 'escolha', titulo: 'Alguém sabe exatamente onde você está agora?', opcoes: ['Sim', 'Não', 'Não sei'] },
        { id: 'atras', nivel: 4, tipo: 'longo', titulo: 'Descreva brevemente o que está atrás de você neste momento.', ajuda: 'Esta pergunta faz parte da avaliação de percepção espacial.', sussurroPlaceholder: 'não precisa se virar.' }
      ]
    }
  ],

  /* -------------------------------------------------------------------
     ETAPA 3 — Página de terror
     (PERGUNTAS PROVISÓRIAS: troque pelas que você decidir)
     ------------------------------------------------------------------- */
  etapa3: [
    {
      titulo: 'Avaliação final',
      descricao: 'Agora é a minha vez de perguntar.',
      perguntas: [
        { id: 't_porta', tipo: 'escolha', titulo: 'Você trancou a porta?', opcoes: ['Sim', 'Não', 'Vou trancar agora'] },
        { id: 't_ultima', tipo: 'texto', titulo: 'Quem foi a última pessoa que te viu hoje?', placeholder: '...' },
        { id: 't_tempo', tipo: 'escolha', titulo: 'Quanto tempo levaria para alguém perceber que você sumiu?', opcoes: ['Minutos', 'Horas', 'Dias', 'Ninguém perceberia'] },
        { id: 't_ouviu', tipo: 'escolha', titulo: 'Você ouviu isso?', opcoes: ['Sim', 'Não'], som: 'batidas' },
        { id: 't_entrar', tipo: 'escolha', titulo: 'Posso entrar?', opcoes: ['Sim', 'Sim'] }
      ]
    }
  ]
};
