// Teste automático do fluxo completo, num celular simulado:
// etapa 1 -> etapa 2 -> página de terror (etapa 3) -> final com o link.
//
// Uso (na pasta do projeto):
//   npm install playwright
//   npx playwright install chromium
//   node testes/fluxo-completo.js
const path = require('path');
const { chromium, devices } = require('playwright');

const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const ok = (msg) => console.log('OK  ' + msg);

(async () => {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ ...devices['Pixel 7'] });
  const p = await contexto.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

  // Etapa 1
  await p.goto(RAIZ + 'index.html');
  await p.fill('#q-nome', 'Mariana Souza Lima');
  await p.fill('#q-apelido', 'Mari');
  await p.click('[data-id="tratamento"] >> text=Ela / dela');
  await p.click('[data-id="serie"] >> text=2º ano');
  await p.check('#declaracao');
  await p.click('#botao-continuar');
  await p.waitForURL('**/etapa-2.html');
  if ((await p.evaluate(() => window.scrollY)) !== 0) throw new Error('a etapa 2 não abriu no topo');
  ok('etapa 1 -> etapa 2 (abre no topo)');

  // Etapa 2
  await p.fill('#q-pessoas', '4');
  await p.click('.agenda input[value="ter-tarde"] >> xpath=..');
  await p.click('#botao-voltar');
  await p.waitForSelector('#botao-voltar', { state: 'detached', timeout: 3000 });
  ok('botão "Voltar" glitchou e sumiu');
  await p.click('#botao-enviar');
  await p.waitForURL('**/falha.html', { timeout: 10000 });

  // Se mostrarTextoDoTerminal estiver ligado, clica para pular o texto.
  const limite = Date.now() + 90000;
  while (await p.evaluate(() => document.getElementById('tela-etapa3').hidden)) {
    if (Date.now() > limite) throw new Error('a etapa 3 não apareceu');
    await p.mouse.click(200, 300);
    await p.waitForTimeout(150);
  }
  ok('envio da etapa 2 -> perguntas da etapa 3');

  // Etapa 3 e final (precisa de linkNoEscuro preenchido em perguntas.js)
  await p.click('[data-id="t_porta"] >> text=Não');
  await p.click('#botao-entregar');
  await p.waitForFunction(() => document.getElementById('fim-texto').textContent.endsWith('sala?'), null, { timeout: 15000 });
  ok('final: "Você já tentou sair dessa sala?"');
  await p.waitForSelector('#fim-link:not([hidden])', { timeout: 10000 });
  if (!(await p.evaluate(() => document.getElementById('fim-texto').hidden))) throw new Error('o texto não sumiu antes do link');
  ok('link aparece sozinho na tela preta');
  await Promise.all([contexto.waitForEvent('page'), p.click('#fim-link')]);
  await p.waitForSelector('#revelacao:not([hidden])', { timeout: 5000 });
  ok('clique no link -> mensagem de projeto escolar');

  if (erros.length) throw new Error('erros no console: ' + erros.join(' | '));
  ok('nenhum erro no console');
  await navegador.close();
})().catch((e) => {
  console.error('FALHOU: ' + e.message);
  process.exit(1);
});
