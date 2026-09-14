/**
 * Banco de dados simples em arquivo JSON.
 * Sem instalar nada: os leads ficam em dados/leads.json.
 *
 * A gravacao e atomica (escreve num arquivo temporario e so depois
 * renomeia), entao um desligamento no meio do caminho nao corrompe a base.
 */
import fs from "node:fs"
import crypto from "node:crypto"
import { config } from "./config.js"

/** @typedef {{id:string, criado_em:string, atualizado_em:string, respostas:Record<string,string>, nota:number, classe:"A"|"B"|"C", classe_automatica:"A"|"B"|"C", classe_manual:boolean, status:string, observacoes:string, tags:string[], origem:string, analise:object, historico:Array<object>, reinscricoes:number}} Lead */

export const STATUS_LEAD = [
  "novo",
  "contatado",
  "respondeu",
  "reuniao",
  "fechou",
  "recusou",
]

let cache = null
let filaDeEscrita = Promise.resolve()

function carregar() {
  if (cache) return cache
  try {
    if (fs.existsSync(config.arquivoLeads)) {
      const bruto = fs.readFileSync(config.arquivoLeads, "utf8")
      const dados = JSON.parse(bruto)
      cache = Array.isArray(dados?.leads) ? dados : { leads: [] }
    } else {
      cache = { leads: [] }
    }
  } catch (erro) {
    console.error("[banco] Nao consegui ler leads.json, comecando com base vazia:", erro.message)
    const backup = `${config.arquivoLeads}.corrompido-${Date.now()}`
    try {
      fs.copyFileSync(config.arquivoLeads, backup)
      console.error(`[banco] Copia do arquivo problematico salva em ${backup}`)
    } catch {
      /* sem backup possivel */
    }
    cache = { leads: [] }
  }
  return cache
}

function salvar() {
  const dados = carregar()
  filaDeEscrita = filaDeEscrita.then(async () => {
    const temporario = `${config.arquivoLeads}.tmp`
    await fs.promises.writeFile(temporario, JSON.stringify(dados, null, 2), "utf8")
    await fs.promises.rename(temporario, config.arquivoLeads)
  })
  return filaDeEscrita.catch((erro) => {
    console.error("[banco] Falha ao gravar leads.json:", erro.message)
  })
}

/** Espera todas as gravacoes pendentes terminarem (usado nos testes e no desligamento). */
export function aguardarGravacoes() {
  return filaDeEscrita
}

/** Recarrega do disco. Usado nos testes. */
export function recarregar() {
  cache = null
  return carregar()
}

export function listarLeads() {
  return carregar().leads
}

export function buscarPorId(id) {
  return carregar().leads.find((lead) => lead.id === id) || null
}

export function buscarPorContato({ email, whatsappDigitos }) {
  const leads = carregar().leads
  const emailNormalizado = String(email || "").trim().toLowerCase()
  return (
    leads.find((lead) => {
      const mesmoEmail =
        emailNormalizado &&
        String(lead.respostas?.email || "").trim().toLowerCase() === emailNormalizado
      const mesmoZap =
        whatsappDigitos && lead.respostas?.whatsapp_digitos === whatsappDigitos
      return mesmoEmail || mesmoZap
    }) || null
  )
}

/**
 * Cria um lead novo ja classificado.
 * @param {{respostas:Record<string,string>, analise:object, origem?:string}} dados
 */
export function criarLead({ respostas, analise, origem = "site" }) {
  const agora = new Date().toISOString()
  /** @type {Lead} */
  const lead = {
    id: crypto.randomUUID(),
    criado_em: agora,
    atualizado_em: agora,
    origem,
    respostas,
    nota: analise.nota,
    classe: analise.classe,
    classe_automatica: analise.classe,
    classe_manual: false,
    status: "novo",
    observacoes: "",
    tags: [],
    reinscricoes: 0,
    analise: {
      explicacao: analise.explicacao,
      detalhes: analise.detalhes,
      pontosFortes: analise.pontosFortes,
      pontosFracos: analise.pontosFracos,
      regrasAplicadas: analise.regrasAplicadas,
      pontuacao: analise.pontuacao,
      pontuacaoMaxima: analise.pontuacaoMaxima,
    },
    historico: [{ em: agora, acao: "criado", detalhe: `Entrou como Lead ${analise.classe}` }],
  }

  carregar().leads.unshift(lead)
  salvar()
  return lead
}

/**
 * Atualiza campos editaveis pelo painel.
 * @param {string} id
 * @param {{classe?:string, status?:string, observacoes?:string, tags?:string[]}} mudancas
 */
export function atualizarLead(id, mudancas) {
  const lead = buscarPorId(id)
  if (!lead) return null
  const agora = new Date().toISOString()

  if (mudancas.classe && mudancas.classe !== lead.classe) {
    lead.historico.push({
      em: agora,
      acao: "classe",
      detalhe: `Movido de ${lead.classe} para ${mudancas.classe}`,
    })
    lead.classe = mudancas.classe
    lead.classe_manual = mudancas.classe !== lead.classe_automatica
  }

  if (mudancas.status && mudancas.status !== lead.status) {
    lead.historico.push({
      em: agora,
      acao: "status",
      detalhe: `Status: ${lead.status} -> ${mudancas.status}`,
    })
    lead.status = mudancas.status
  }

  if (typeof mudancas.observacoes === "string") {
    lead.observacoes = mudancas.observacoes.slice(0, 5000)
  }

  if (Array.isArray(mudancas.tags)) {
    lead.tags = mudancas.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
  }

  lead.atualizado_em = agora
  salvar()
  return lead
}

export function registrarReinscricao(id) {
  const lead = buscarPorId(id)
  if (!lead) return null
  lead.reinscricoes = (lead.reinscricoes || 0) + 1
  lead.atualizado_em = new Date().toISOString()
  lead.historico.push({
    em: lead.atualizado_em,
    acao: "reinscricao",
    detalhe: "Tentou se inscrever de novo",
  })
  salvar()
  return lead
}

export function removerLead(id) {
  const dados = carregar()
  const indice = dados.leads.findIndex((lead) => lead.id === id)
  if (indice === -1) return false
  dados.leads.splice(indice, 1)
  salvar()
  return true
}

/** Numeros do topo do painel. */
export function calcularMetricas() {
  const leads = listarLeads()
  const porClasse = { A: 0, B: 0, C: 0 }
  const porStatus = Object.fromEntries(STATUS_LEAD.map((s) => [s, 0]))
  const porOrigem = {}
  let somaNotas = 0

  const inicioDoDia = new Date()
  inicioDoDia.setHours(0, 0, 0, 0)
  const seteDiasAtras = Date.now() - 7 * 24 * 60 * 60 * 1000
  let hoje = 0
  let ultimos7Dias = 0

  for (const lead of leads) {
    if (porClasse[lead.classe] !== undefined) porClasse[lead.classe] += 1
    if (porStatus[lead.status] !== undefined) porStatus[lead.status] += 1
    const origemFormulario = lead.respostas?.origem || lead.origem || "nao_informado"
    porOrigem[origemFormulario] = (porOrigem[origemFormulario] || 0) + 1
    somaNotas += lead.nota || 0
    const criadoEm = new Date(lead.criado_em).getTime()
    if (criadoEm >= inicioDoDia.getTime()) hoje += 1
    if (criadoEm >= seteDiasAtras) ultimos7Dias += 1
  }

  return {
    total: leads.length,
    porClasse,
    porStatus,
    porOrigem,
    hoje,
    ultimos7Dias,
    notaMedia: leads.length ? Math.round(somaNotas / leads.length) : 0,
    fechados: porStatus.fechou || 0,
    taxaFechamento: leads.length ? Math.round(((porStatus.fechou || 0) / leads.length) * 100) : 0,
  }
}
