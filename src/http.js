/**
 * Utilidades de HTTP: ler o corpo do pedido, responder JSON,
 * servir arquivos estaticos e um limitador simples anti-spam.
 */
import fs from "node:fs"
import path from "node:path"

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
}

const CABECALHOS_SEGURANCA = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

export function responderJson(res, status, dados, cabecalhosExtras = {}) {
  const corpo = JSON.stringify(dados)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(corpo),
    ...CABECALHOS_SEGURANCA,
    ...cabecalhosExtras,
  })
  res.end(corpo)
}

export function responderTexto(res, status, texto, tipo = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": tipo,
    "Content-Length": Buffer.byteLength(texto),
    ...CABECALHOS_SEGURANCA,
  })
  res.end(texto)
}

export function redirecionar(res, destino, cabecalhosExtras = {}) {
  res.writeHead(302, { Location: destino, ...CABECALHOS_SEGURANCA, ...cabecalhosExtras })
  res.end()
}

const TAMANHO_MAXIMO_CORPO = 256 * 1024

export function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let bruto = ""
    let tamanho = 0
    req.on("data", (pedaco) => {
      tamanho += pedaco.length
      if (tamanho > TAMANHO_MAXIMO_CORPO) {
        reject(new Error("Corpo do pedido muito grande"))
        req.destroy()
        return
      }
      bruto += pedaco
    })
    req.on("end", () => {
      if (!bruto) return resolve({})
      try {
        resolve(JSON.parse(bruto))
      } catch {
        reject(new Error("JSON inválido"))
      }
    })
    req.on("error", reject)
  })
}

export function lerCookies(req) {
  const cabecalho = req.headers.cookie
  if (!cabecalho) return {}
  const cookies = {}
  for (const parte of cabecalho.split(";")) {
    const igual = parte.indexOf("=")
    if (igual === -1) continue
    const nome = parte.slice(0, igual).trim()
    const valor = parte.slice(igual + 1).trim()
    cookies[nome] = decodeURIComponent(valor)
  }
  return cookies
}

export function montarCookie(nome, valor, { maxAge, httpOnly = true, seguro = false } = {}) {
  const partes = [`${nome}=${encodeURIComponent(valor)}`, "Path=/", "SameSite=Lax"]
  if (httpOnly) partes.push("HttpOnly")
  if (seguro) partes.push("Secure")
  if (typeof maxAge === "number") partes.push(`Max-Age=${maxAge}`)
  return partes.join("; ")
}

/**
 * O pedido chegou por https?
 * Atras de uma hospedagem (Render, Railway, nginx) a conexao ate o Node e
 * http, e quem avisa que o visitante usou https e o cabecalho
 * x-forwarded-proto.
 */
export function pedidoEhSeguro(req) {
  const protocoloEncaminhado = req.headers["x-forwarded-proto"]
  if (typeof protocoloEncaminhado === "string" && protocoloEncaminhado) {
    return protocoloEncaminhado.split(",")[0].trim().toLowerCase() === "https"
  }
  return Boolean(req.socket?.encrypted)
}

export function ipDoPedido(req) {
  const encaminhado = req.headers["x-forwarded-for"]
  if (typeof encaminhado === "string" && encaminhado) return encaminhado.split(",")[0].trim()
  return req.socket.remoteAddress || "desconhecido"
}

/** Limitador simples em memoria: N acoes por janela de tempo, por IP. */
export function criarLimitador({ limite, janelaMs }) {
  const registros = new Map()
  return {
    permitir(chave) {
      const agora = Date.now()
      const anteriores = (registros.get(chave) || []).filter((t) => agora - t < janelaMs)
      if (anteriores.length >= limite) {
        registros.set(chave, anteriores)
        return false
      }
      anteriores.push(agora)
      registros.set(chave, anteriores)
      if (registros.size > 5000) registros.clear()
      return true
    },
  }
}

/**
 * Serve um arquivo da pasta publica, bloqueando qualquer tentativa
 * de sair dela com caminhos do tipo "../../".
 */
export function servirEstatico(res, pastaPublica, caminhoPedido) {
  const relativo = decodeURIComponent(caminhoPedido.split("?")[0]).replace(/^\/+/, "")
  const completo = path.resolve(pastaPublica, relativo || "index.html")

  if (!completo.startsWith(path.resolve(pastaPublica))) {
    responderTexto(res, 403, "Acesso negado")
    return true
  }

  let alvo = completo
  if (!fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
    const comHtml = `${completo}.html`
    if (fs.existsSync(comHtml)) {
      alvo = comHtml
    } else if (fs.existsSync(path.join(completo, "index.html"))) {
      alvo = path.join(completo, "index.html")
    } else {
      return false
    }
  }

  const extensao = path.extname(alvo).toLowerCase()
  const conteudo = fs.readFileSync(alvo)
  res.writeHead(200, {
    "Content-Type": TIPOS[extensao] || "application/octet-stream",
    "Content-Length": conteudo.length,
    "Cache-Control": extensao === ".html" ? "no-cache" : "public, max-age=3600",
    ...CABECALHOS_SEGURANCA,
  })
  res.end(conteudo)
  return true
}
