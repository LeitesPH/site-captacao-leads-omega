/**
 * Servidor do site de captacao e separacao de leads A / B / C.
 *
 * Para rodar:  npm start
 * Depois abra: http://localhost:3000        (formulario publico)
 *              http://localhost:3000/painel (painel de leads)
 *
 * Nao usa nenhuma biblioteca externa: so o que ja vem no Node.
 */
import http from "node:http"
import path from "node:path"
import { config, RAIZ, avisosDeConfiguracao } from "./src/config.js"
import { tratarApi } from "./src/rotas.js"
import { redirecionar, responderTexto, servirEstatico } from "./src/http.js"
import { estaLogado } from "./src/sessao.js"
import { aguardarGravacoes } from "./src/db.js"

const PASTA_PUBLICA = path.join(RAIZ, "publico")

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)

  try {
    if (await tratarApi(req, res, url)) return

    // O painel so abre para quem ja fez login.
    if (url.pathname === "/painel" || url.pathname === "/painel.html") {
      if (!estaLogado(req)) {
        redirecionar(res, "/entrar")
        return
      }
      if (servirEstatico(res, PASTA_PUBLICA, "/painel.html")) return
    }

    if (url.pathname === "/entrar") {
      if (servirEstatico(res, PASTA_PUBLICA, "/entrar.html")) return
    }

    if (servirEstatico(res, PASTA_PUBLICA, url.pathname)) return

    responderTexto(res, 404, "Página não encontrada")
  } catch (erro) {
    console.error("[erro]", req.method, url.pathname, erro)
    if (!res.headersSent) responderTexto(res, 500, "Erro interno no servidor")
    else res.end()
  }
})

servidor.listen(config.porta, () => {
  const linha = "─".repeat(58)
  console.log(`\n${linha}`)
  console.log(`  ${config.nomePrograma} — captacao e separacao de leads A/B/C`)
  console.log(linha)
  console.log(`  Formulario publico : http://localhost:${config.porta}`)
  console.log(`  Painel de leads    : http://localhost:${config.porta}/painel`)
  console.log(`  Base de dados      : ${config.arquivoLeads}`)
  console.log(linha)
  for (const aviso of avisosDeConfiguracao()) {
    console.log(`  ⚠  ${aviso}`)
  }
  console.log("")
})

async function desligar() {
  console.log("\nEncerrando... salvando os dados.")
  servidor.close()
  await aguardarGravacoes()
  process.exit(0)
}

process.on("SIGINT", desligar)
process.on("SIGTERM", desligar)
