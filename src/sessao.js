/**
 * Login do painel: um cookie assinado, sem biblioteca externa.
 * O cookie guarda a data de expiracao e uma assinatura feita com o
 * segredo do servidor - se alguem editar o cookie, a assinatura quebra.
 */
import crypto from "node:crypto"
import { config } from "./config.js"
import { lerCookies, montarCookie } from "./http.js"

export const NOME_COOKIE = "sessao_painel"

function assinar(dados) {
  return crypto.createHmac("sha256", config.segredo).update(dados).digest("hex")
}

export function criarToken() {
  const expiraEm = Date.now() + config.horasSessao * 60 * 60 * 1000
  const dados = `painel.${expiraEm}`
  return `${dados}.${assinar(dados)}`
}

export function tokenValido(token) {
  if (typeof token !== "string") return false
  const partes = token.split(".")
  if (partes.length !== 3) return false
  const [prefixo, expiraEm, assinatura] = partes
  if (prefixo !== "painel") return false

  const esperada = assinar(`${prefixo}.${expiraEm}`)
  const a = Buffer.from(assinatura)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

  return Number(expiraEm) > Date.now()
}

export function estaLogado(req) {
  return tokenValido(lerCookies(req)[NOME_COOKIE])
}

export function senhaCorreta(senhaEnviada) {
  const enviada = Buffer.from(String(senhaEnviada || ""))
  const correta = Buffer.from(config.senhaPainel)
  if (enviada.length !== correta.length) return false
  return crypto.timingSafeEqual(enviada, correta)
}

export function cookieDeLogin() {
  return montarCookie(NOME_COOKIE, criarToken(), { maxAge: config.horasSessao * 60 * 60 })
}

export function cookieDeLogout() {
  return montarCookie(NOME_COOKIE, "", { maxAge: 0 })
}
