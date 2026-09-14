/**
 * Teste de ponta a ponta: sobe o servidor de verdade numa pasta de dados
 * temporaria e exercita as rotas como o navegador faria.
 */
import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const pastaTemporaria = fs.mkdtempSync(path.join(os.tmpdir(), "leads-teste-"))
process.env.PASTA_DADOS = pastaTemporaria
process.env.SENHA_PAINEL = "senha-de-teste"
process.env.TOKEN_WEBHOOK = "token-de-teste"
process.env.PORTA = "0"

const { config } = await import("../src/config.js")
const { tratarApi } = await import("../src/rotas.js")
const { aguardarGravacoes } = await import("../src/db.js")
const http = await import("node:http")

let servidor
let base
let cookie = ""

before(async () => {
  servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (await tratarApi(req, res, url)) return
    res.writeHead(404).end("nao encontrado")
  })
  await new Promise((resolve) => servidor.listen(0, resolve))
  base = `http://localhost:${servidor.address().port}`
})

after(async () => {
  await aguardarGravacoes()
  await new Promise((resolve) => servidor.close(resolve))
  fs.rmSync(pastaTemporaria, { recursive: true, force: true })
})

async function chamar(caminho, opcoes = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(opcoes.headers || {}),
    },
    body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
  })
  const guardar = resposta.headers.get("set-cookie")
  if (guardar) cookie = guardar.split(";")[0]
  const tipo = resposta.headers.get("content-type") || ""
  const dados = tipo.includes("json") ? await resposta.json() : await resposta.text()
  return { status: resposta.status, dados, resposta }
}

const INSCRICAO_A = {
  nome: "Joao Parceiro",
  email: "joao@exemplo.com",
  whatsapp: "(11) 97777-6666",
  cidade: "Campinas / SP",
  area: "mesmo_setor",
  faturamento: "acima_100k",
  tempo_mercado: "mais_5_anos",
  equipe: "mais_10",
  carteira: "mais_50",
  experiencia: "sim_resultado",
  investimento: "acima_20k",
  dedicacao: "integral",
  inicio: "imediato",
  decisor: "sim",
  origem: "indicacao",
}

const INSCRICAO_C = {
  nome: "Ana Curiosa",
  email: "ana@exemplo.com",
  whatsapp: "(21) 96666-5555",
  cidade: "Rio de Janeiro / RJ",
  area: "sem_area",
  faturamento: "sem_faturamento",
  tempo_mercado: "comecando",
  equipe: "sozinho",
  carteira: "nenhum",
  experiencia: "nao",
  investimento: "ate_1k",
  dedicacao: "menos_10",
  inicio: "sem_previsao",
  decisor: "nao",
  origem: "google",
}

test("o formulario publico e servido sem login", async () => {
  const { status, dados } = await chamar("/api/formulario")
  assert.equal(status, 200)
  assert.ok(Array.isArray(dados.campos))
  assert.ok(dados.campos.some((campo) => campo.id === "faturamento"))
  // as funcoes de regra e os pontos nao vazam para o navegador
  const opcao = dados.campos.find((c) => c.id === "faturamento").opcoes[0]
  assert.deepEqual(Object.keys(opcao).sort(), ["rotulo", "valor"])
})

test("inscricao valida e aceita e classificada", async () => {
  const { status, dados } = await chamar("/api/inscricao", { method: "POST", corpo: INSCRICAO_A })
  assert.equal(status, 201)
  assert.equal(dados.ok, true)
  assert.ok(dados.id)
})

test("inscricao incompleta volta com a lista de erros", async () => {
  const { status, dados } = await chamar("/api/inscricao", {
    method: "POST",
    corpo: { nome: "Sem contato" },
  })
  assert.equal(status, 400)
  assert.equal(dados.ok, false)
  assert.equal(dados.erros.email, "Campo obrigatório")
})

test("o mesmo e-mail nao cria um lead duplicado", async () => {
  const { status, dados } = await chamar("/api/inscricao", { method: "POST", corpo: INSCRICAO_A })
  assert.equal(status, 200)
  assert.equal(dados.jaInscrito, true)
})

test("o campo isca descarta robos sem criar lead", async () => {
  const { status, dados } = await chamar("/api/inscricao", {
    method: "POST",
    corpo: { ...INSCRICAO_C, email: "robo@exemplo.com", website: "http://spam.com" },
  })
  assert.equal(status, 200)
  assert.equal(dados.ok, true)
  assert.equal(dados.id, undefined)
})

test("o painel exige login", async () => {
  const { status } = await chamar("/api/leads")
  assert.equal(status, 401)
})

test("webhook recusa token errado", async () => {
  const { status } = await chamar("/api/webhook/lead", {
    method: "POST",
    headers: { "x-token": "errado" },
    corpo: INSCRICAO_C,
  })
  assert.equal(status, 401)
})

test("webhook aceita token certo e traduz nomes de campo externos", async () => {
  const { status, dados } = await chamar("/api/webhook/lead", {
    method: "POST",
    headers: { "x-token": config.tokenWebhook },
    corpo: {
      full_name: "Ana Curiosa",
      "e-mail": "ana@exemplo.com",
      phone: "(21) 96666-5555",
      city: "Rio de Janeiro / RJ",
      area: INSCRICAO_C.area,
      faturamento: INSCRICAO_C.faturamento,
      tempo_mercado: INSCRICAO_C.tempo_mercado,
      equipe: INSCRICAO_C.equipe,
      carteira: INSCRICAO_C.carteira,
      experiencia: INSCRICAO_C.experiencia,
      investimento: INSCRICAO_C.investimento,
      dedicacao: INSCRICAO_C.dedicacao,
      inicio: INSCRICAO_C.inicio,
      decisor: INSCRICAO_C.decisor,
      origem: INSCRICAO_C.origem,
    },
  })
  assert.equal(status, 201)
  assert.equal(dados.ok, true)
})

test("login com senha errada e recusado", async () => {
  const { status } = await chamar("/api/login", { method: "POST", corpo: { senha: "errada" } })
  assert.equal(status, 401)
})

test("login com a senha certa libera o painel", async () => {
  const { status } = await chamar("/api/login", {
    method: "POST",
    corpo: { senha: "senha-de-teste" },
  })
  assert.equal(status, 200)
  const sessao = await chamar("/api/sessao")
  assert.equal(sessao.dados.logado, true)
})

test("os leads aparecem separados em A e C", async () => {
  const { dados } = await chamar("/api/leads")
  assert.equal(dados.total, 2)

  const joao = dados.leads.find((l) => l.respostas.email === "joao@exemplo.com")
  const ana = dados.leads.find((l) => l.respostas.email === "ana@exemplo.com")

  assert.equal(joao.classe, "A")
  assert.equal(joao.nota, 100)
  assert.equal(ana.classe, "C")
  assert.ok(joao.whatsapp_link.startsWith("https://wa.me/5511977776666"))
})

test("filtro por classe devolve so a classe pedida", async () => {
  const { dados } = await chamar("/api/leads?classe=A")
  assert.equal(dados.total, 1)
  assert.equal(dados.leads[0].classe, "A")
})

test("busca encontra por nome, e-mail ou cidade", async () => {
  const porNome = await chamar("/api/leads?busca=ana")
  assert.equal(porNome.dados.total, 1)
  const porCidade = await chamar("/api/leads?busca=campinas")
  assert.equal(porCidade.dados.total, 1)
  const semResultado = await chamar("/api/leads?busca=ninguem")
  assert.equal(semResultado.dados.total, 0)
})

test("mover o lead de classe a mao registra que foi manual", async () => {
  const lista = await chamar("/api/leads?classe=C")
  const id = lista.dados.leads[0].id

  const { status, dados } = await chamar(`/api/leads/${id}`, {
    method: "PATCH",
    corpo: { classe: "B", status: "contatado", observacoes: "Ligou pedindo material" },
  })

  assert.equal(status, 200)
  assert.equal(dados.classe, "B")
  assert.equal(dados.classe_manual, true)
  assert.equal(dados.classe_automatica, "C")
  assert.equal(dados.status, "contatado")
  assert.equal(dados.observacoes, "Ligou pedindo material")
  assert.ok(dados.historico.some((h) => h.acao === "classe"))
})

test("classe invalida e recusada", async () => {
  const lista = await chamar("/api/leads")
  const id = lista.dados.leads[0].id
  const { status } = await chamar(`/api/leads/${id}`, { method: "PATCH", corpo: { classe: "Z" } })
  assert.equal(status, 400)
})

test("as metricas batem com a base", async () => {
  const { dados } = await chamar("/api/metricas")
  assert.equal(dados.total, 2)
  assert.equal(dados.porClasse.A, 1)
  assert.equal(dados.porClasse.B, 1)
  assert.equal(dados.porClasse.C, 0)
  assert.equal(dados.porStatus.contatado, 1)
})

test("a exportacao gera um CSV com cabecalho e uma linha por lead", async () => {
  const { status, dados, resposta } = await chamar("/api/exportar.csv")
  assert.equal(status, 200)
  assert.match(resposta.headers.get("content-type"), /text\/csv/)
  const linhas = dados.trim().split("\r\n")
  assert.equal(linhas.length, 3)
  assert.match(linhas[0], /Classe/)
  assert.match(dados, /joao@exemplo\.com/)
})

test("excluir remove o lead da base", async () => {
  const lista = await chamar("/api/leads?classe=B")
  const id = lista.dados.leads[0].id
  const { status } = await chamar(`/api/leads/${id}`, { method: "DELETE" })
  assert.equal(status, 200)

  const depois = await chamar("/api/leads")
  assert.equal(depois.dados.total, 1)
})

test("sair encerra a sessao", async () => {
  await chamar("/api/logout", { method: "POST" })
  const { status } = await chamar("/api/leads")
  assert.equal(status, 401)
})
