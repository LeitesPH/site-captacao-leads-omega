/**
 * Contas de acesso ao painel.
 *
 * As senhas NUNCA sao guardadas como texto. Guardamos um "hash" (um
 * embaralhado irreversivel, feito com scrypt + sal aleatorio). Mesmo
 * quem abrir o arquivo dados/usuarios.json nao consegue ler a senha
 * de ninguem - so consegue conferir se uma senha digitada bate.
 *
 * Continua sem biblioteca externa: scrypt ja vem no Node.
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { PASTA_DADOS } from "./config.js"

const ARQUIVO = path.join(PASTA_DADOS, "usuarios.json")

/** admin faz tudo; vendedor atende os leads mas nao pode excluir. */
export const PAPEIS = ["admin", "vendedor"]

let cache = null

function carregar() {
  if (cache) return cache
  try {
    if (fs.existsSync(ARQUIVO)) {
      const dados = JSON.parse(fs.readFileSync(ARQUIVO, "utf8"))
      cache = Array.isArray(dados?.usuarios) ? dados : { usuarios: [] }
    } else {
      cache = { usuarios: [] }
    }
  } catch (erro) {
    console.error("[contas] Nao consegui ler usuarios.json:", erro.message)
    cache = { usuarios: [] }
  }
  return cache
}

function salvar() {
  const dados = carregar()
  const temporario = `${ARQUIVO}.tmp`
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), { mode: 0o600 })
  fs.renameSync(temporario, ARQUIVO)
}

export function recarregar() {
  cache = null
  return carregar()
}

/** O login e sempre comparado em minusculas e sem espacos nas pontas. */
export function normalizarLogin(login) {
  return String(login || "").trim().toLowerCase()
}

/** Transforma a senha em um hash com sal aleatorio. */
export function criarHash(senha) {
  const sal = crypto.randomBytes(16)
  const derivada = crypto.scryptSync(String(senha), sal, 64)
  return `scrypt$${sal.toString("hex")}$${derivada.toString("hex")}`
}

/** Confere a senha digitada contra o hash guardado, em tempo constante. */
export function conferirSenha(senha, hashGuardado) {
  const partes = String(hashGuardado || "").split("$")
  if (partes.length !== 3 || partes[0] !== "scrypt") return false

  let sal
  let esperado
  try {
    sal = Buffer.from(partes[1], "hex")
    esperado = Buffer.from(partes[2], "hex")
  } catch {
    return false
  }
  if (!sal.length || !esperado.length) return false

  let derivada
  try {
    derivada = crypto.scryptSync(String(senha), sal, esperado.length)
  } catch {
    return false
  }
  return derivada.length === esperado.length && crypto.timingSafeEqual(derivada, esperado)
}

/** Dados que podem ser mostrados na tela (sem o hash da senha). */
export function semSegredo(usuario) {
  if (!usuario) return null
  const { senha_hash, ...resto } = usuario
  return resto
}

export function listarUsuarios() {
  return carregar().usuarios.map(semSegredo)
}

export function buscarUsuario(login) {
  const alvo = normalizarLogin(login)
  return carregar().usuarios.find((u) => u.login === alvo) || null
}

export function criarUsuario({ login, senha, nome = "", papel = "admin" }) {
  const limpo = normalizarLogin(login)

  if (!/^[a-z0-9._-]{3,32}$/.test(limpo)) {
    throw new Error("O login deve ter de 3 a 32 caracteres, usando letras, numeros, ponto, hifen ou _")
  }
  if (String(senha || "").length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres")
  }
  if (!PAPEIS.includes(papel)) {
    throw new Error(`Papel invalido. Use um destes: ${PAPEIS.join(", ")}`)
  }
  if (buscarUsuario(limpo)) {
    throw new Error(`Ja existe uma conta com o login "${limpo}"`)
  }

  const usuario = {
    login: limpo,
    nome: String(nome || limpo).trim(),
    papel,
    senha_hash: criarHash(senha),
    criado_em: new Date().toISOString(),
    ultimo_acesso: null,
  }

  carregar().usuarios.push(usuario)
  salvar()
  return semSegredo(usuario)
}

export function alterarSenha(login, novaSenha) {
  const usuario = buscarUsuario(login)
  if (!usuario) throw new Error(`Nao existe conta com o login "${normalizarLogin(login)}"`)
  if (String(novaSenha || "").length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres")
  }
  usuario.senha_hash = criarHash(novaSenha)
  salvar()
  return semSegredo(usuario)
}

export function removerUsuario(login) {
  const dados = carregar()
  const alvo = normalizarLogin(login)
  const indice = dados.usuarios.findIndex((u) => u.login === alvo)
  if (indice === -1) return false
  if (dados.usuarios.length === 1) {
    throw new Error("Esta e a unica conta que existe. Crie outra antes de remover esta.")
  }
  dados.usuarios.splice(indice, 1)
  salvar()
  return true
}

/**
 * Confere login e senha.
 * Quando o login nao existe, ainda assim gastamos o tempo de um calculo
 * de hash: sem isso, a diferenca de tempo entregaria quais logins existem.
 */
const HASH_FANTASMA = criarHash(crypto.randomBytes(16).toString("hex"))

export function autenticar(login, senha) {
  const usuario = buscarUsuario(login)
  if (!usuario) {
    conferirSenha(senha, HASH_FANTASMA)
    return null
  }
  if (!conferirSenha(senha, usuario.senha_hash)) return null

  usuario.ultimo_acesso = new Date().toISOString()
  salvar()
  return semSegredo(usuario)
}

/**
 * Na primeira vez que o site sobe, cria a conta inicial.
 * Se nao houver USUARIO_INICIAL e SENHA_INICIAL no .env, sorteamos uma
 * senha e mostramos uma unica vez no terminal - melhor do que deixar
 * uma senha padrao conhecida no ar.
 */
export function garantirContaInicial() {
  if (carregar().usuarios.length > 0) return null

  const login = normalizarLogin(process.env.USUARIO_INICIAL || "admin")
  const senhaDoEnv = process.env.SENHA_INICIAL || ""
  const senha = senhaDoEnv || crypto.randomBytes(9).toString("base64url")

  criarUsuario({ login, senha, nome: process.env.NOME_INICIAL || login, papel: "admin" })
  return { login, senha, sorteada: !senhaDoEnv }
}
