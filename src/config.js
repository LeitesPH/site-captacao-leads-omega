/**
 * Configuracao do sistema.
 * Le o arquivo .env (se existir) sem precisar de biblioteca externa.
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function carregarEnv() {
  const caminho = path.join(RAIZ, ".env")
  if (!fs.existsSync(caminho)) return
  const conteudo = fs.readFileSync(caminho, "utf8")
  for (const linha of conteudo.split(/\r?\n/)) {
    const limpa = linha.trim()
    if (!limpa || limpa.startsWith("#")) continue
    const separador = limpa.indexOf("=")
    if (separador === -1) continue
    const chave = limpa.slice(0, separador).trim()
    let valor = limpa.slice(separador + 1).trim()
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1)
    }
    if (process.env[chave] === undefined) process.env[chave] = valor
  }
}

carregarEnv()

export const PASTA_DADOS = process.env.PASTA_DADOS
  ? path.resolve(process.env.PASTA_DADOS)
  : path.join(RAIZ, "dados")

fs.mkdirSync(PASTA_DADOS, { recursive: true })

/**
 * Segredo usado para assinar o cookie de login do painel.
 * Se nao existir, criamos um e guardamos em dados/.segredo para que
 * reiniciar o servidor nao desconecte quem ja estava logado.
 */
function obterSegredo() {
  if (process.env.SEGREDO) return process.env.SEGREDO
  const caminho = path.join(PASTA_DADOS, ".segredo")
  try {
    if (fs.existsSync(caminho)) {
      const salvo = fs.readFileSync(caminho, "utf8").trim()
      if (salvo) return salvo
    }
  } catch {
    /* segue e gera um novo */
  }
  const novo = crypto.randomBytes(32).toString("hex")
  try {
    fs.writeFileSync(caminho, novo, { mode: 0o600 })
  } catch {
    /* ambiente somente leitura: usa o segredo apenas em memoria */
  }
  return novo
}

export const config = {
  porta: Number(process.env.PORTA || process.env.PORT || 3000),
  tokenWebhook: process.env.TOKEN_WEBHOOK || "",
  segredo: obterSegredo(),
  nomePrograma: process.env.NOME_PROGRAMA || "Programa de Parceria",
  whatsappContato: (process.env.WHATSAPP_CONTATO || "").replace(/\D/g, ""),
  arquivoLeads: path.join(PASTA_DADOS, "leads.json"),
  /**
   * Marca o cookie de login como "Secure" (so trafega em https).
   *   "auto"  - liga sozinho quando o pedido chegou por https (recomendado)
   *   "sempre" - sempre ligado (use se o site so responde em https)
   *   "nunca" - sempre desligado (so para depurar em http)
   */
  cookieSeguro: process.env.COOKIE_SEGURO || "auto",
  /** Duracao da sessao do painel, em horas */
  horasSessao: 12,
  /** Limite de inscricoes por IP em 10 minutos (anti-spam) */
  limiteEnviosPorIp: 5,
}

export function avisosDeConfiguracao() {
  const avisos = []
  if (!config.tokenWebhook) {
    avisos.push(
      "TOKEN_WEBHOOK nao configurado: a rota /api/webhook/lead fica desligada ate voce definir um token no .env.",
    )
  }
  return avisos
}
