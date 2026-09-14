# Captação e separação de leads A / B / C

Um site de **inscrição para parceria** que recebe as pessoas interessadas, dá uma nota
para cada uma com base nas respostas e **separa automaticamente em Lead A, Lead B e Lead C**.

São duas telas:

| Tela | Endereço | Quem usa |
| --- | --- | --- |
| Formulário de inscrição | `/` | O público (quem quer ser parceiro) |
| Painel de leads | `/painel` | Seu time comercial (com senha) |

No painel os leads aparecem em três colunas — A, B e C — e você pode arrastar um lead de
uma coluna para outra, mudar o status do atendimento, anotar o que foi conversado,
chamar a pessoa no WhatsApp com uma mensagem já escrita e exportar tudo para Excel.

**Não precisa instalar nada além do Node.js.** O projeto não usa nenhuma biblioteca externa.

---

## Índice

- [Como rodar em 3 passos](#como-rodar-em-3-passos)
- [Como funciona a separação A / B / C](#como-funciona-a-separação-a--b--c)
- [Como mudar as perguntas e os critérios](#como-mudar-as-perguntas-e-os-critérios)
- [Usando o painel no dia a dia](#usando-o-painel-no-dia-a-dia)
- [Receber inscrições de outro site (webhook)](#receber-inscrições-de-outro-site-webhook)
- [Colocar o site no ar](#colocar-o-site-no-ar)
- [Onde ficam os dados](#onde-ficam-os-dados)
- [Perguntas comuns](#perguntas-comuns)
- [Para quem for mexer no código](#para-quem-for-mexer-no-código)

---

## Como rodar em 3 passos

Você precisa do [Node.js](https://nodejs.org) versão 20 ou mais nova instalado.

**1. Crie o arquivo de configuração.** Copie o `.env.example` para um arquivo chamado `.env`
e troque a senha:

```bash
cp .env.example .env
```

Abra o `.env` num editor de texto e ajuste:

```
PORTA=3000
SENHA_PAINEL=uma-senha-forte-sua
TOKEN_WEBHOOK=um-texto-secreto-qualquer
NOME_PROGRAMA=Programa de Parceria da Minha Empresa
WHATSAPP_CONTATO=5511999999999
```

**2. Ligue o site:**

```bash
npm start
```

**3. Abra no navegador:**

- Formulário público: <http://localhost:3000>
- Painel de leads: <http://localhost:3000/painel> (entre com a senha do `.env`)

Para parar o site, aperte `Ctrl + C` no terminal.

### Quer ver o painel cheio antes de ter leads de verdade?

Com o site **parado**, rode:

```bash
npm run exemplo
```

Isso cria 8 inscrições fictícias, já separadas em A, B e C. Para limpar depois,
apague o arquivo `dados/leads.json`.

---

## Como funciona a separação A / B / C

Cada pergunta do formulário tem **um peso** (o quanto ela importa) e cada resposta vale
**de 0 a 10 pontos**. O sistema soma tudo e converte numa **nota de 0 a 100**:

```
Nota de 0 a 100  →  70 ou mais = Lead A
                 →  45 a 69    = Lead B
                 →  abaixo de 45 = Lead C
```

As perguntas que mais pesam hoje são **faturamento**, **quanto pode investir** e
**quando quer começar** (peso 3 cada). As que menos pesam são tempo de mercado e
tamanho da equipe (peso 1).

### As regras que passam por cima da nota

Algumas respostas são decisivas, não importa o resto. Por isso existem três regras:

| Regra | O que faz |
| --- | --- |
| Marcou "sem previsão, só pesquisando" | Vai para **C**, mesmo com nota alta |
| Marcou "não posso investir agora" | No máximo **B** |
| Fatura alto + investe alto + quer começar já | Entra como **A**, mesmo com nota baixa |

Exemplo real: alguém que fatura mais de R$ 100 mil e tem equipe grande tira nota 93,
mas se marcar "sem previsão para começar" vai para a coluna C — porque não adianta o
time comercial gastar energia com quem não vai decidir agora.

No painel, cada lead mostra **por que** ficou naquela classe, com a nota e a regra que
foi aplicada. Ninguém precisa confiar na caixa-preta.

---

## Como mudar as perguntas e os critérios

Tudo fica em **um arquivo só**: `src/criterios.js`.

Abra ele num editor de texto. Mudou lá, muda no formulário e na classificação ao mesmo
tempo — você não precisa mexer em mais nada.

### Mudar quantos pontos uma resposta vale

Procure a pergunta e mude o número em `pontos`:

```js
{ valor: "acima_100k", rotulo: "Acima de R$ 100 mil", pontos: 10 },
{ valor: "50k_100k",  rotulo: "Entre R$ 50 mil e R$ 100 mil", pontos: 9 },
```

### Mudar o quanto uma pergunta importa

Mude o `peso` da pergunta (0 = só coleta a informação e não pontua):

```js
{
  id: "faturamento",
  rotulo: "Qual seu faturamento médio por mês?",
  peso: 3,        // <- de 0 a 3, quanto maior mais importa
  ...
}
```

### Ficar mais exigente (ou menos) na hora de dar um A

Mude as faixas no começo do arquivo:

```js
export const FAIXAS = {
  A: { minimo: 70, ... },   // suba para 80 se quiser menos leads A
  B: { minimo: 45, ... },
  C: { minimo: 0, ... },
}
```

### Trocar os textos do site

Também no mesmo arquivo, em `TEXTOS_SITE`: título, subtítulo, lista de benefícios e o
texto do botão.

### Criar uma pergunta nova

Copie um bloco de pergunta inteiro, cole no final da lista `CAMPOS` e troque o `id`
(sem espaços e sem acentos), o `rotulo` e as `opcoes`.

> Depois de qualquer mudança, pare o site (`Ctrl + C`) e rode `npm start` de novo.
> Rode também `npm test` para conferir que não quebrou nada.

---

## Usando o painel no dia a dia

**Os números do topo** mostram quantos leads entraram no total, quantos são A, B e C,
a nota média e quantos já fecharam.

**As três colunas** são a separação automática. Você pode **arrastar um card de uma
coluna para outra** quando discordar do sistema — o lead fica marcado como "manual" e o
painel guarda qual era a classificação original.

**Clicando num lead** abre o detalhe do lado direito, com:

- por que ele é A, B ou C, com a nota e a barra de pontuação;
- **leitura rápida**: os pontos a favor e os pontos de atenção daquela pessoa;
- todas as respostas do formulário;
- os botões para mudar a classe e o **status do atendimento**
  (novo → contatado → respondeu → reunião marcada → fechou / recusou);
- um campo de **anotações** que salva sozinho enquanto você digita;
- o botão **Chamar no WhatsApp**, que já abre a conversa com uma mensagem diferente
  para cada classe (lead A recebe uma abordagem mais direta, lead C uma mais leve);
- o histórico de tudo que aconteceu com aquele lead.

**A aba "Lista"** mostra os mesmos leads em formato de tabela, boa para bater o olho em
muitos de uma vez.

**Exportar CSV** baixa uma planilha com os leads que estão na tela (respeitando os
filtros). O arquivo abre direto no Excel com os acentos corretos.

---

## Receber inscrições de outro site (webhook)

Se você já tem um formulário pronto em outra ferramenta (Tally, Typeform, Elementor,
Google Forms via Zapier, etc.), ela pode mandar as inscrições para cá.

Configure a ferramenta para fazer um `POST` para:

```
https://seusite.com.br/api/webhook/lead
```

com o cabeçalho:

```
x-token: o-token-que-voce-colocou-no-.env
```

e o corpo em JSON. O sistema entende nomes de campo em português e em inglês —
`nome`/`name`/`full_name`, `email`/`e-mail`, `whatsapp`/`phone`/`telefone`,
`cidade`/`city`. Exemplo:

```json
{
  "full_name": "Maria Souza",
  "email": "maria@exemplo.com",
  "phone": "(11) 98888-7777",
  "cidade": "São Paulo / SP",
  "faturamento": "50k_100k",
  "investimento": "10k_20k",
  "inicio": "imediato"
}
```

Os valores das perguntas de múltipla escolha precisam ser os códigos que estão em
`src/criterios.js` (por exemplo `50k_100k`, e não "Entre R$ 50 mil e R$ 100 mil").

O lead entra classificado do mesmo jeito, e no painel aparece com origem "webhook".

---

## Colocar o site no ar

O projeto é um servidor Node comum, então roda em qualquer lugar que aceite Node.js
(Render, Railway, Fly.io, uma VPS, etc.).

Na hospedagem, configure:

- **Comando de start:** `npm start`
- **Variáveis de ambiente:** as mesmas do `.env` (`SENHA_PAINEL`, `TOKEN_WEBHOOK`,
  `NOME_PROGRAMA`, `WHATSAPP_CONTATO`). A porta normalmente é definida pela hospedagem
  sozinha — o sistema aceita tanto `PORTA` quanto `PORT`.
- **Disco:** os leads são gravados na pasta `dados/`. Em hospedagens que apagam os
  arquivos a cada deploy, aponte a variável `PASTA_DADOS` para um disco permanente,
  senão você perde os leads na próxima publicação.

### Antes de divulgar o link, confira:

- [ ] Troquei a `SENHA_PAINEL` (o painel avisa em amarelo se ainda estiver a padrão)
- [ ] O site está em **https** (a hospedagem normalmente cuida disso)
- [ ] A pasta `dados/` está num disco que não some entre deploys
- [ ] Fiz uma inscrição de teste e ela apareceu no painel

---

## Onde ficam os dados

Tudo fica no arquivo **`dados/leads.json`**, dentro da própria pasta do projeto.

- Para **fazer backup**, é só copiar esse arquivo.
- Para **começar do zero**, apague o arquivo e reinicie o site.
- Esse arquivo **não vai para o GitHub** (está no `.gitignore`), então os dados das
  pessoas não ficam públicos por acidente.

A gravação é feita de forma segura: o sistema escreve num arquivo temporário e só depois
substitui o original, então uma queda de energia no meio não corrompe sua base.

---

## Perguntas comuns

**Preciso de banco de dados?**
Não. Os leads ficam num arquivo JSON. Para o volume de um programa de parcerias
(milhares de inscrições) isso funciona bem e simplifica muito a vida.

**Duas pessoas podem usar o painel ao mesmo tempo?**
Podem. Todos entram com a mesma senha.

**E se a mesma pessoa se inscrever duas vezes?**
O sistema reconhece pelo e-mail ou pelo WhatsApp, não cria lead duplicado e registra no
histórico que ela tentou de novo (sinal de interesse, aliás).

**Como o site se protege de robô e spam?**
Tem um campo invisível que só robô preenche, e um limite de 5 inscrições a cada 10
minutos por aparelho. O login do painel também limita tentativas de senha.

**Dá para mudar as cores?**
Sim, no começo do arquivo `publico/css/estilo.css`. As cores de A, B e C estão logo nas
primeiras linhas. O site já vem com tema claro e escuro.

**O que acontece se eu mudar os pontos depois de já ter leads?**
Os leads antigos mantêm a nota que tiraram na hora da inscrição. Só as inscrições novas
usam os critérios novos.

---

## Para quem for mexer no código

```
server.js                  liga o servidor e serve as páginas
src/
  criterios.js             PERGUNTAS, PESOS E FAIXAS  <- é aqui que se mexe
  classificador.js         calcula a nota, aplica as regras e explica o resultado
  db.js                    lê e grava o arquivo de leads
  rotas.js                 todas as rotas da API
  sessao.js                login do painel (cookie assinado)
  http.js                  utilidades de HTTP e o limitador anti-spam
  config.js                lê o .env
publico/
  index.html               formulário de inscrição
  painel.html              painel de leads
  entrar.html              tela de login
  css/estilo.css           todo o visual
  js/                      formulario.js, painel.js e comum.js
testes/                    testes automatizados (npm test)
ferramentas/
  dados-exemplo.js         cria leads fictícios para demonstração
```

Rodar os testes:

```bash
npm test
```

Rodar em modo desenvolvimento (reinicia sozinho a cada alteração):

```bash
npm run dev
```

### A API, em resumo

Públicas:

| Rota | O que faz |
| --- | --- |
| `GET /api/formulario` | Devolve as perguntas para montar o formulário |
| `POST /api/inscricao` | Recebe uma inscrição e classifica |
| `POST /api/webhook/lead` | Mesma coisa, para sites externos (exige token) |

Do painel (exigem login):

| Rota | O que faz |
| --- | --- |
| `POST /api/login` · `POST /api/logout` · `GET /api/sessao` | Sessão |
| `GET /api/leads` | Lista com filtros: `classe`, `status`, `origem`, `busca`, `dias`, `ordenar` |
| `GET /api/leads/:id` · `PATCH /api/leads/:id` · `DELETE /api/leads/:id` | Um lead |
| `GET /api/metricas` | Números do topo do painel |
| `GET /api/exportar.csv` | Exporta a planilha |
