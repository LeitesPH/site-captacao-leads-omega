/**
 * Todas as rotas da API.
 *
 * Publicas (qualquer pessoa):
 *   GET  /api/formulario      -> perguntas para montar o formulario
 *   POST /api/inscricao       -> recebe a inscricao e classifica em A, B ou C
 *   POST /api/webhook/lead    -> mesma coisa, para sites externos (usa token)
 *
 * Do painel (precisa estar logado):
 *   POST   /api/login         GET /api/sessao        POST /api/logout
 *   GET    /api/leads         GET /api/leads/:id
 *   PATCH  /api/leads/:id     DELETE /api/leads/:id
 *   GET    /api/metricas      GET /api/exportar.csv
 */
import { config } from "./config.js"
import {
  CAMPOS,
  FAIXAS,
  MENSAGENS_WHATSAPP,
  TEXTOS_SITE,
  APELIDOS_WEBHOOK,
} from "./criterios.js"
import { classificar, validarRespostas } from "./classificador.js"
import {
  STATUS_LEAD,
  atualizarLead,
  buscarPorContato,
  buscarPorId,
  calcularMetricas,
  criarLead,
  listarLeads,
  registrarReinscricao,
  removerLead,
} from "./db.js"
import {
  criarLimitador,
  ipDoPedido,
  lerCorpoJson,
  responderJson,
  responderTexto,
} from "./http.js"
import { cookieDeLogin, cookieDeLogout, usuarioLogado } from "./sessao.js"
import { autenticar } from "./usuarios.js"

const limitadorInscricao = criarLimitador({
  limite: config.limiteEnviosPorIp,
  janelaMs: 10 * 60 * 1000,
})
const limitadorLogin = criarLimitador({ limite: 10, janelaMs: 10 * 60 * 1000 })

/** Campos enviados ao navegador (sem as funcoes de regra). */
function campoPublico(campo) {
  return {
    id: campo.id,
    rotulo: campo.rotulo,
    tipo: campo.tipo,
    obrigatorio: Boolean(campo.obrigatorio),
    placeholder: campo.placeholder || "",
    grupo: campo.grupo || "",
    opcoes: (campo.opcoes || []).map((o) => ({ valor: o.valor, rotulo: o.rotulo })),
  }
}

/**
 * Trata uma inscricao (do site ou do webhook) e devolve a resposta pronta.
 */
function processarInscricao(entrada, origem) {
  const { valido, erros, respostas } = validarRespostas(entrada)
  if (!valido) {
    return { status: 400, corpo: { ok: false, erro: "Confira os campos destacados", erros } }
  }

  const existente = buscarPorContato({
    email: respostas.email,
    whatsappDigitos: respostas.whatsapp_digitos,
  })
  if (existente) {
    registrarReinscricao(existente.id)
    return {
      status: 200,
      corpo: {
        ok: true,
        jaInscrito: true,
        mensagem: "Você já está inscrito! Nosso time vai falar com você em breve.",
      },
    }
  }

  const analise = classificar(respostas)
  const lead = criarLead({ respostas, analise, origem })

  return {
    status: 201,
    corpo: {
      ok: true,
      id: lead.id,
      mensagem: TEXTOS_SITE.mensagemSucesso,
    },
  }
}

/** Converte nomes de campo de formularios externos para os nossos. */
function normalizarEntradaWebhook(bruto) {
  const entrada = { ...bruto }
  for (const [nosso, apelidos] of Object.entries(APELIDOS_WEBHOOK)) {
    if (entrada[nosso]) continue
    for (const apelido of apelidos) {
      const achado = Object.keys(bruto).find((k) => k.toLowerCase() === apelido.toLowerCase())
      if (achado && bruto[achado]) {
        entrada[nosso] = bruto[achado]
        break
      }
    }
  }
  return entrada
}

function filtrarLeads(leads, url) {
  const p = url.searchParams
  const classe = p.get("classe") || ""
  const status = p.get("status") || ""
  const origem = p.get("origem") || ""
  const busca = (p.get("busca") || "").trim().toLowerCase()
  const dias = Number(p.get("dias") || 0)
  const limiteData = dias > 0 ? Date.now() - dias * 24 * 60 * 60 * 1000 : null

  let resultado = leads

  if (classe) resultado = resultado.filter((l) => l.classe === classe)
  if (status) resultado = resultado.filter((l) => l.status === status)
  if (origem) resultado = resultado.filter((l) => (l.respostas?.origem || "") === origem)
  if (limiteData) resultado = resultado.filter((l) => new Date(l.criado_em).getTime() >= limiteData)

  if (busca) {
    resultado = resultado.filter((lead) => {
      const alvo = [
        lead.respostas?.nome,
        lead.respostas?.email,
        lead.respostas?.whatsapp,
        lead.respostas?.cidade,
        lead.respostas?.instagram,
        lead.observacoes,
        (lead.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase()
      return alvo.includes(busca)
    })
  }

  const ordenar = p.get("ordenar") || "recentes"
  const ordenadores = {
    recentes: (a, b) => new Date(b.criado_em) - new Date(a.criado_em),
    antigos: (a, b) => new Date(a.criado_em) - new Date(b.criado_em),
    nota: (a, b) => b.nota - a.nota,
    nome: (a, b) =>
      String(a.respostas?.nome || "").localeCompare(String(b.respostas?.nome || ""), "pt-BR"),
  }
  return [...resultado].sort(ordenadores[ordenar] || ordenadores.recentes)
}

function linkWhatsapp(lead) {
  const numero = lead.respostas?.whatsapp_digitos
  if (!numero) return null
  const montar = MENSAGENS_WHATSAPP[lead.classe] || MENSAGENS_WHATSAPP.C
  return `https://wa.me/${numero}?text=${encodeURIComponent(montar(lead))}`
}

function comExtras(lead) {
  return { ...lead, whatsapp_link: linkWhatsapp(lead) }
}

function gerarCsv(leads) {
  const colunas = [
    { titulo: "Classe", valor: (l) => l.classe },
    { titulo: "Nota", valor: (l) => l.nota },
    { titulo: "Status", valor: (l) => l.status },
    { titulo: "Inscrito em", valor: (l) => new Date(l.criado_em).toLocaleString("pt-BR") },
    ...CAMPOS.map((c) => ({ titulo: c.rotulo, valor: (l) => rotuloResposta(c, l.respostas?.[c.id]) })),
    { titulo: "Observações", valor: (l) => l.observacoes },
    { titulo: "Tags", valor: (l) => (l.tags || []).join(", ") },
    { titulo: "Classificado manualmente", valor: (l) => (l.classe_manual ? "sim" : "não") },
  ]

  const escapar = (valor) => {
    const texto = valor == null ? "" : String(valor)
    return `"${texto.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`
  }

  const linhas = [colunas.map((c) => escapar(c.titulo)).join(";")]
  for (const lead of leads) {
    linhas.push(colunas.map((c) => escapar(c.valor(lead))).join(";"))
  }
  // BOM para o Excel abrir os acentos corretamente
  return `﻿${linhas.join("\r\n")}`
}

function rotuloResposta(campo, valor) {
  if (!campo.opcoes) return valor || ""
  const opcao = campo.opcoes.find((o) => o.valor === valor)
  return opcao ? opcao.rotulo : valor || ""
}

/**
 * Roteador principal da API.
 * Devolve true se tratou o pedido.
 */
export async function tratarApi(req, res, url) {
  const caminho = url.pathname
  const metodo = req.method

  // ---------- Publicas ----------

  if (caminho === "/api/formulario" && metodo === "GET") {
    responderJson(res, 200, {
      nomePrograma: config.nomePrograma,
      textos: TEXTOS_SITE,
      campos: CAMPOS.map(campoPublico),
    })
    return true
  }

  if (caminho === "/api/inscricao" && metodo === "POST") {
    if (!limitadorInscricao.permitir(ipDoPedido(req))) {
      responderJson(res, 429, {
        ok: false,
        erro: "Muitas inscrições seguidas deste aparelho. Tente de novo em alguns minutos.",
      })
      return true
    }
    let corpo
    try {
      corpo = await lerCorpoJson(req)
    } catch (erro) {
      responderJson(res, 400, { ok: false, erro: erro.message })
      return true
    }
    // Campo isca: robos preenchem tudo, pessoas nao veem este campo.
    if (corpo.website) {
      responderJson(res, 200, { ok: true, mensagem: TEXTOS_SITE.mensagemSucesso })
      return true
    }
    const { status, corpo: resposta } = processarInscricao(corpo, "site")
    responderJson(res, status, resposta)
    return true
  }

  if (caminho === "/api/webhook/lead" && metodo === "POST") {
    if (!config.tokenWebhook) {
      responderJson(res, 503, { ok: false, erro: "Webhook desligado: defina TOKEN_WEBHOOK no .env" })
      return true
    }
    const enviado = req.headers["x-token"] || url.searchParams.get("token") || ""
    if (enviado !== config.tokenWebhook) {
      responderJson(res, 401, { ok: false, erro: "Token inválido" })
      return true
    }
    let corpo
    try {
      corpo = await lerCorpoJson(req)
    } catch (erro) {
      responderJson(res, 400, { ok: false, erro: erro.message })
      return true
    }
    const { status, corpo: resposta } = processarInscricao(
      normalizarEntradaWebhook(corpo),
      "webhook",
    )
    responderJson(res, status, resposta)
    return true
  }

  // ---------- Login ----------

  if (caminho === "/api/login" && metodo === "POST") {
    if (!limitadorLogin.permitir(ipDoPedido(req))) {
      responderJson(res, 429, { ok: false, erro: "Muitas tentativas. Aguarde alguns minutos." })
      return true
    }
    let corpo
    try {
      corpo = await lerCorpoJson(req)
    } catch {
      corpo = {}
    }
    const usuario = autenticar(corpo.usuario, corpo.senha)
    if (!usuario) {
      // Mensagem unica de proposito: dizer "esse login nao existe"
      // entregaria quais logins sao validos para quem esta tentando adivinhar.
      responderJson(res, 401, { ok: false, erro: "Login ou senha incorretos" })
      return true
    }
    responderJson(
      res,
      200,
      { ok: true, usuario },
      { "Set-Cookie": cookieDeLogin(req, usuario.login) },
    )
    return true
  }

  if (caminho === "/api/logout" && metodo === "POST") {
    responderJson(res, 200, { ok: true }, { "Set-Cookie": cookieDeLogout(req) })
    return true
  }

  if (caminho === "/api/sessao" && metodo === "GET") {
    const usuario = usuarioLogado(req)
    responderJson(res, 200, { logado: Boolean(usuario), usuario })
    return true
  }

  // ---------- Daqui para baixo, so logado ----------

  let euSou = null
  if (caminho.startsWith("/api/")) {
    euSou = usuarioLogado(req)
    if (!euSou) {
      responderJson(res, 401, { ok: false, erro: "Faça login para continuar" })
      return true
    }
  }

  if (caminho === "/api/painel" && metodo === "GET") {
    responderJson(res, 200, {
      nomePrograma: config.nomePrograma,
      faixas: FAIXAS,
      status: STATUS_LEAD,
      campos: CAMPOS.map(campoPublico),
      usuario: euSou,
    })
    return true
  }

  if (caminho === "/api/metricas" && metodo === "GET") {
    responderJson(res, 200, calcularMetricas())
    return true
  }

  if (caminho === "/api/leads" && metodo === "GET") {
    const filtrados = filtrarLeads(listarLeads(), url)
    responderJson(res, 200, {
      total: filtrados.length,
      leads: filtrados.map(comExtras),
    })
    return true
  }

  if (caminho === "/api/exportar.csv" && metodo === "GET") {
    const csv = gerarCsv(filtrarLeads(listarLeads(), url))
    const nome = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Content-Length": Buffer.byteLength(csv),
    })
    res.end(csv)
    return true
  }

  const casaLead = caminho.match(/^\/api\/leads\/([\w-]+)$/)
  if (casaLead) {
    const id = casaLead[1]

    if (metodo === "GET") {
      const lead = buscarPorId(id)
      if (!lead) {
        responderJson(res, 404, { ok: false, erro: "Lead não encontrado" })
        return true
      }
      responderJson(res, 200, comExtras(lead))
      return true
    }

    if (metodo === "PATCH") {
      let corpo
      try {
        corpo = await lerCorpoJson(req)
      } catch (erro) {
        responderJson(res, 400, { ok: false, erro: erro.message })
        return true
      }

      if (corpo.classe && !["A", "B", "C"].includes(corpo.classe)) {
        responderJson(res, 400, { ok: false, erro: "Classe inválida" })
        return true
      }
      if (corpo.status && !STATUS_LEAD.includes(corpo.status)) {
        responderJson(res, 400, { ok: false, erro: "Status inválido" })
        return true
      }

      const atualizado = atualizarLead(id, corpo, euSou)
      if (!atualizado) {
        responderJson(res, 404, { ok: false, erro: "Lead não encontrado" })
        return true
      }
      responderJson(res, 200, comExtras(atualizado))
      return true
    }

    if (metodo === "DELETE") {
      if (euSou.papel !== "admin") {
        responderJson(res, 403, {
          ok: false,
          erro: "Somente contas de administrador podem excluir leads",
        })
        return true
      }
      const removido = removerLead(id)
      responderJson(res, removido ? 200 : 404, { ok: removido })
      return true
    }
  }

  if (caminho.startsWith("/api/")) {
    responderTexto(res, 404, "Rota não encontrada")
    return true
  }

  return false
}
