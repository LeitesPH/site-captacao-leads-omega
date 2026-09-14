/** Funcoes usadas pelas duas telas (site publico e painel). */

export function aplicarTemaSalvo() {
  const salvo = localStorage.getItem("tema")
  const prefereEscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches
  document.documentElement.dataset.tema = salvo || (prefereEscuro ? "escuro" : "claro")
}

export function alternarTema() {
  const atual = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro"
  document.documentElement.dataset.tema = atual
  localStorage.setItem("tema", atual)
  return atual
}

export async function pedir(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
    body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
  })
  const tipo = resposta.headers.get("content-type") || ""
  const dados = tipo.includes("application/json") ? await resposta.json() : null
  if (!resposta.ok) {
    const erro = new Error(dados?.erro || `Erro ${resposta.status}`)
    erro.status = resposta.status
    erro.dados = dados
    throw erro
  }
  return dados
}

export function criar(tag, atributos = {}, filhos = []) {
  const elemento = document.createElement(tag)
  for (const [chave, valor] of Object.entries(atributos)) {
    if (chave === "class") elemento.className = valor
    else if (chave === "texto") elemento.textContent = valor
    else if (chave.startsWith("on") && typeof valor === "function") {
      elemento.addEventListener(chave.slice(2).toLowerCase(), valor)
    } else if (valor !== null && valor !== undefined && valor !== false) {
      elemento.setAttribute(chave, valor)
    }
  }
  for (const filho of [].concat(filhos)) {
    if (filho == null || filho === false) continue
    elemento.append(filho instanceof Node ? filho : document.createTextNode(String(filho)))
  }
  return elemento
}

export function formatarData(iso, comHora = false) {
  if (!iso) return "-"
  const data = new Date(iso)
  const opcoes = comHora
    ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "2-digit", year: "numeric" }
  return data.toLocaleString("pt-BR", opcoes)
}

export function tempoRelativo(iso) {
  if (!iso) return ""
  const diferenca = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(diferenca / 60000)
  if (minutos < 1) return "agora"
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return "ontem"
  if (dias < 30) return `há ${dias} dias`
  return formatarData(iso)
}

let tempoNotificacao
export function avisar(texto) {
  let caixa = document.querySelector(".notificacao")
  if (!caixa) {
    caixa = criar("div", { class: "notificacao" })
    document.body.append(caixa)
  }
  caixa.textContent = texto
  caixa.classList.add("visivel")
  clearTimeout(tempoNotificacao)
  tempoNotificacao = setTimeout(() => caixa.classList.remove("visivel"), 2600)
}
