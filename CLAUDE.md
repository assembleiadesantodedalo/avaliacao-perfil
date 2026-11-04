# Contexto do projeto para o Claude

Projeto escolar: um site de terror disfarçado de formulário institucional
("Avaliação de Perfil do Estudante"). Começa normal e vai ficando estranho até
virar uma página de terror. Tudo em português do Brasil.

## Regras que não podem quebrar

- **Nada é enviado para servidor.** As respostas ficam só no `sessionStorage` do
  navegador de quem responde e são apagadas na tela final. Não adicionar banco
  de dados, formulários com `action` nem chamadas de rede com as respostas.
- **Site estático.** HTML, CSS e JavaScript puros, sem build e sem
  dependências. Precisa abrir com dois cliques no `index.html` (file://).
- **Fontes locais** em `assets/fonts/` (Fontsource). Sons gerados com a Web
  Audio API em `assets/js/som.js` (nenhum arquivo de áudio).
- **Dados da pessoa** entram na página com `textContent`, nunca `innerHTML`.
- **Fotossensibilidade:** nada de piscadas rápidas nem inversão de cores
  (no máximo 3 flashes por segundo).
- Respeitar `prefers-reduced-motion` nas animações novas.

## Fluxo atual

1. `index.html` (etapa 1): identificação, personalidade e preferências.
   Totalmente normal.
2. `etapa-2.html` (etapa 2): rotina e bem-estar. A página fica estranha aos
   poucos (`assets/js/anomalias.js`, níveis 1 a 4 definidos por pergunta).
   - Botão "Voltar": não volta; dá um glitch e some.
   - "Enviar respostas": glitch por `segundosAteRedirecionar` segundos, sem
     mensagem de erro, e `location.replace('falha.html')`.
3. `falha.html` (página de terror): abre já preta, direto nas perguntas da
   etapa 3. Ao clicar em "Entregar": sem glitch, tela preta, aparece
   "Você já tentou sair dessa sala?", a frase some e fica só o link
   (`linkNoEscuro`) quase invisível no centro. A mensagem "Isto foi um
   projeto escolar" aparece depois do clique no link (ou após 1 minuto).

## Decisões do dono do projeto (não desfazer sem ele pedir)

- Sem o olho grande na página de terror (o logotipo das etapas 1 e 2 e o
  ícone da aba continuam sendo olhos).
- Sem a tela "Falha no envio" / "Tentar novamente" e sem as linhas
  "reconectando" / "conexão restabelecida".
- Sem a janela "Erro ao enviar" na etapa 2.
- Sem a pergunta "Curso técnico".
- O texto de terminal que "lê" as respostas está **desligado**
  (`mostrarTextoDoTerminal: false`), mas o código continua em `falha.js`.
- Toda página nova abre no topo (`formulario.js`, `irParaOTopo`).
- Clique, toque, Espaço ou Enter completam a frase sendo digitada e pulam a
  pausa (função `pular` em `falha.js`).
- No final, o link aparece sozinho, sem nenhum outro texto na tela.

## Onde mexer

| Arquivo | Conteúdo |
|---|---|
| `assets/js/perguntas.js` | **Todas as perguntas e opções** (`config`, `etapa1`, `etapa2`, `etapa3`). O começo explica cada campo. |
| `assets/js/formulario.js` | Monta as perguntas, salva no `sessionStorage`, valida, personaliza `{apelido}` e "sozinho(a)". |
| `assets/js/inicio.js` | Etapas 1 e 2: botões Continuar, Enviar (glitch) e Voltar (some). |
| `assets/js/anomalias.js` | Efeitos estranhos das etapas 1 e 2. |
| `assets/js/falha.js` | Página de terror: etapa 3, final com o link, revelação, terminal opcional. |
| `assets/js/som.js` | Zumbido, batimento, estática, batidas na porta. |
| `assets/css/estilo.css` / `falha.css` | Visual das etapas 1–2 e da página de terror. |

## Pendências conhecidas

- `modoTeste: true` em `perguntas.js` (nada é obrigatório e aparece um aviso).
  Trocar para `false` antes da apresentação.
- As perguntas da etapa 3 são provisórias.
- O destino do link `https://bit.ly/4sEvwFL` não foi conferido.

## Como testar

Abrir `index.html` no navegador, ou rodar `python3 -m http.server 8000` e
acessar `http://localhost:8000`. Para recomeçar, feche a aba.

Teste automático do fluxo completo (Playwright):

```bash
npm install playwright
npx playwright install chromium
node testes/fluxo-completo.js
```

Depois de qualquer mudança, rode esse teste e confira no celular (o público
usa principalmente celular).
