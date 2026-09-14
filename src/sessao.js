/**
 * Login do painel: um cookie assinado, sem biblioteca externa.
 *
 * O cookie guarda o login da pessoa, a data de validade e uma assinatura
 * feita com o segredo do servidor. Se alguem editar qualquer parte do
 * cookie - inclusive trocar o login por outro - a assinatura quebra e o
 * servidor recusa.
 */
import crypto from "node:crypto"
import { config } from "./config.js"
import { lerCookies, montarCookie, pedidoEhSeguro } from "./http.js"
import { buscarUsuario, semSegredo } from "./usuarios.js"

export const NOME_COOKIE = "sessao_painel"

function assinar(dados) {
  return crypto.createHmac("sha256", config.segredo).update(dados).digest("hex")
}

export function criarToken(login) {
  const expiraEm = Date.now() + config.horasSessao * 60 * 60 * 1000
  // O login vai em base64url porque ele pode conter ponto, e o ponto e o
  // separador das partes do token.
  const dados = `${Buffer.from(String(login), "utf8").toString("base64url")}.${expiraEm}`
  return `${dados}.${assinar(dados)}`
}

/** Devolve o login guardado no cookie, ou null se o cookie nao for valido. */
export function loginDoToken(token) {
  if (typeof token !== "string") return null
  const partes = token.split(".")
  if (partes.length !== 3) return null

  const [loginCodificado, expiraEm, assinatura] = partes
  const esperada = assinar(`${loginCodificado}.${expiraEm}`)

  const a = Buffer.from(assinatura)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  if (!(Number(expiraEm) > Date.now())) return null

  try {
    const login = Buffer.from(loginCodificado, "base64url").toString("utf8")
    return login || null
  } catch {
    return null
  }
}

/**
 * Quem esta logado neste pedido.
 * Confere tambem se a conta ainda existe: removeu a conta, o acesso cai
 * na hora, sem esperar a sessao expirar.
 */
export function usuarioLogado(req) {
  const login = loginDoToken(lerCookies(req)[NOME_COOKIE])
  if (!login) return null
  return semSegredo(buscarUsuario(login))
}

export function estaLogado(req) {
  return usuarioLogado(req) !== null
}

function usarSecure(req) {
  if (config.cookieSeguro === "sempre") return true
  if (config.cookieSeguro === "nunca") return false
  return pedidoEhSeguro(req)
}

export function cookieDeLogin(req, login) {
  return montarCookie(NOME_COOKIE, criarToken(login), {
    maxAge: config.horasSessao * 60 * 60,
    seguro: usarSecure(req),
  })
}

export function cookieDeLogout(req) {
  return montarCookie(NOME_COOKIE, "", { maxAge: 0, seguro: usarSecure(req) })
}
