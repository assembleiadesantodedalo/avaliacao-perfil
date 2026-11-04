# Avaliação de Perfil do Estudante (site de terror)

Projeto escolar. O site começa como um formulário institucional comum e,
pergunta após pergunta, vai ficando estranho, até "falhar" no envio e levar a
pessoa para uma página de terror que lê de volta as próprias respostas dela.

Nada é enviado para servidor algum: as respostas ficam só no navegador de quem
responde (sessionStorage) e são apagadas na tela final. Por isso o site aguenta
qualquer número de pessoas respondendo ao mesmo tempo.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Etapa 1: identificação, personalidade e preferências. Totalmente normal. |
| `etapa-2.html` | Etapa 2: rotina e bem-estar. As perguntas e a página ficam mais estranhas. Ao enviar: a página glitcha por 3 segundos e vai para a página de terror. O botão "Voltar" não volta: ele glitcha e some. |
| `falha.html` | Página de terror: abre direto nas perguntas da etapa 3; ao entregar, sobra só a tela preta com o link. |

## Como editar as perguntas

Todas as perguntas e configurações estão em **`assets/js/perguntas.js`**.
O começo do arquivo explica cada campo. Exemplos:

```js
{ id: 'pessoas', nivel: 2, tipo: 'numero', titulo: 'Quantas pessoas moram na sua casa?' }
{ id: 't_ouviu', tipo: 'escolha', titulo: 'Você ouviu isso?', opcoes: ['Sim', 'Não'], som: 'batidas' }
```

- `nivel` (etapa 2, de 1 a 4): quanto maior, mais estranha a página fica quando a pessoa chega nessa pergunta.
- `sussurro`: frase que aparece no lugar do enunciado por uma fração de segundo.
- `{apelido}` dentro de um texto é trocado pelo nome da pessoa.
- `sozinho(a)`, `cansado(a)` etc. viram masculino ou feminino na etapa 2 e 3, conforme a pessoa respondeu na etapa 1.

As perguntas da etapa 3 (`etapa3`) são **provisórias**: troque pelas que você decidir.

Os textos que a página de terror "lê" (ex.: "Você mora com mais 3 pessoas")
usam os `id` das perguntas da etapa 2 (`pessoas`, `sozinho`, `tranca`, `dorme`,
`sozinho_agora`, `alguem_sabe`, `atras`...). Se mudar um desses `id`, ajuste a
função `gerarLeituras` em `assets/js/falha.js`.

### Configurações (`config` em `perguntas.js`)

| Opção | Padrão | Efeito |
|---|---|---|
| `segundosAteRedirecionar` | `3` | Segundos de glitch depois de clicar em "Enviar respostas", antes da página de terror. |
| `linkNoEscuro` | `'https://bit.ly/4sEvwFL'` | Link quase invisível na tela preta do final. Use `''` para não mostrar link. |
| `mostrarTextoDoTerminal` | `false` | Mostra, antes da etapa 3, o texto que lê de volta as respostas da pessoa. |
| `som` | `true` | Liga ou desliga todos os sons. |
| `mostrarRevelacaoFinal` | `true` | Mostra, no final, que é um projeto escolar e que nada foi enviado. |
| `usarLocalizacaoAproximada` | `false` | Mostra a cidade da pessoa pelo IP (API get.geojs.io). Em rede de escola costuma errar. |

## O que vai ficando estranho (e quando)

- **Etapa 1:** quase nada. Uma frase muda por 0,15 s depois de uns 40 s; o contador "estudantes respondendo agora" mostra "1" por um instante; ao trocar de aba, o título muda.
- **Etapa 2, nível 2:** enunciados trocam por um instante; o logotipo (um olho) passa a seguir o cursor; o contador cai; "Etapa 2 de 2" pisca como "Etapa 2 de 3".
- **Nível 3:** as cores esfriam, aparece um granulado, um zumbido grave muito baixo começa, o salvamento automático passa a dizer "Lido às...".
- **Nível 4:** vinheta escura, pequenos tremores, "1 observando", surge uma "Etapa 3" no indicador, e a última caixa de texto escreve sozinha "não precisa se virar."
- **Página de terror:** abre já no escuro, direto nas perguntas da etapa 3, com estática, câmera "REC", batidas na porta, batimento cardíaco e vibração no celular. Ao clicar em "Entregar", tudo some, aparece "Você já tentou sair dessa sala?" e, depois que a frase some, fica só a tela preta com um link quase invisível no meio. A explicação de que é um projeto escolar só aparece depois que a pessoa clica nele (ou depois de 1 minuto). No Chrome o som costuma começar sozinho; nos outros navegadores, no primeiro clique ou toque.
- **Texto do terminal (desligado):** com `mostrarTextoDoTerminal: true`, antes da etapa 3 aparece o texto que lê de volta as respostas da pessoa (quem mora com ela, horários em que fica sozinha, hora, aparelho, bateria). Um clique ou toque completa a frase e pula a pausa.

## Como testar no computador

Abrir o `index.html` direto funciona, mas o ideal é usar um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

Para recomeçar do zero, feche a aba (as respostas ficam guardadas só enquanto a aba estiver aberta).

Teste automático do fluxo completo (precisa do Node.js):

```bash
npm install playwright
npx playwright install chromium
node testes/fluxo-completo.js
```

## Continuar o trabalho com o Claude

O arquivo `CLAUDE.md` resume o projeto, o fluxo atual e as decisões já tomadas.
O Claude Code lê esse arquivo sozinho ao abrir a pasta. No claude.ai, envie o
`CLAUDE.md` junto com os arquivos que quiser mudar.

## Como publicar (gratuito)

- **Netlify Drop:** acesse app.netlify.com/drop e arraste a pasta do projeto. Em segundos sai um link.
- **GitHub Pages:** suba a pasta para um repositório e ative *Settings > Pages* na branch principal.

## Créditos e licenças

- Fontes [Inter](https://github.com/rsms/inter), [VT323](https://fonts.google.com/specimen/VT323) e [Special Elite](https://fonts.google.com/specimen/Special+Elite), via [Fontsource](https://fontsource.org) (SIL OFL / Apache 2.0). Ficam em `assets/fonts/` para o site funcionar sem internet.
- Sons gerados pelo próprio navegador com a Web Audio API (nenhum arquivo de áudio).

## Cuidados

- Os efeitos de tela evitam piscadas rápidas (fotossensibilidade), e quem ativa "reduzir movimento" no aparelho vê menos animações.
- O site não pede câmera, microfone nem localização.
- A tela final explica que é um projeto escolar e apaga as respostas. Recomendo mantê-la ligada.
