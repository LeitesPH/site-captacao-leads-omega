/**
 * Monta o formulario publico a partir de /api/formulario
 * (as perguntas vem de src/criterios.js, entao voce edita num lugar so)
 * e envia a inscricao para /api/inscricao.
 */
import { alternarTema, aplicarTemaSalvo, criar, pedir } from "./comum.js"

aplicarTemaSalvo()

const elementos = {
  campos: document.getElementById("campos"),
  formulario: document.getElementById("formulario"),
  erroGeral: document.getElementById("erro-geral"),
  botaoEnviar: document.getElementById("botao-enviar"),
  caixaFormulario: document.getElementById("caixa-formulario"),
}

document.getElementById("ano").textContent = String(new Date().getFullYear())
document.getElementById("botao-tema").addEventListener("click", alternarTema)

let configuracao = null

async function iniciar() {
  try {
    configuracao = await pedir("/api/formulario")
  } catch {
    elementos.campos.innerHTML =
      '<p class="mensagem-erro">Não consegui carregar o formulário. Atualize a página.</p>'
    return
  }

  const { nomePrograma, textos, campos } = configuracao

  document.title = `${textos.tituloFormulario} · ${nomePrograma}`
  document.getElementById("nome-programa").textContent = nomePrograma
  for (const no of document.querySelectorAll(".nome-programa-rodape")) {
    no.textContent = nomePrograma
  }
  document.getElementById("chamada").textContent = textos.chamada
  document.getElementById("sub-chamada").textContent = textos.subChamada
  document.getElementById("titulo-formulario").textContent = textos.tituloFormulario
  document.getElementById("subtitulo-formulario").textContent = textos.subtituloFormulario
  elementos.botaoEnviar.textContent = textos.textoBotao

  const beneficios = document.getElementById("beneficios")
  beneficios.replaceChildren(...textos.beneficios.map((item) => criar("li", { texto: item })))

  desenharCampos(campos)
}

function desenharCampos(campos) {
  const grupos = new Map()
  for (const campo of campos) {
    const nome = campo.grupo || "Informações"
    if (!grupos.has(nome)) grupos.set(nome, [])
    grupos.get(nome).push(campo)
  }

  const blocos = []
  for (const [nomeGrupo, camposDoGrupo] of grupos) {
    blocos.push(
      criar("fieldset", { class: "grupo-campos" }, [
        criar("legend", { texto: nomeGrupo }),
        ...camposDoGrupo.map(montarCampo),
      ]),
    )
  }
  elementos.campos.replaceChildren(...blocos)
}

function montarCampo(campo) {
  const idControle = `campo-${campo.id}`
  const rotulo = criar("label", { for: idControle }, [
    campo.rotulo,
    campo.obrigatorio ? criar("span", { class: "obrigatorio", texto: " *" }) : null,
  ])

  let controle
  if (campo.tipo === "selecao") {
    controle = criar("select", { id: idControle, name: campo.id }, [
      criar("option", { value: "", texto: "Selecione..." }),
      ...campo.opcoes.map((o) => criar("option", { value: o.valor, texto: o.rotulo })),
    ])
  } else if (campo.tipo === "textarea") {
    controle = criar("textarea", {
      id: idControle,
      name: campo.id,
      placeholder: campo.placeholder,
      rows: 4,
    })
  } else {
    const tipoHtml =
      campo.tipo === "email" ? "email" : campo.tipo === "telefone" ? "tel" : "text"
    controle = criar("input", {
      id: idControle,
      name: campo.id,
      type: tipoHtml,
      placeholder: campo.placeholder,
      autocomplete:
        campo.id === "nome"
          ? "name"
          : campo.id === "email"
            ? "email"
            : campo.id === "whatsapp"
              ? "tel"
              : "off",
    })
  }

  if (campo.tipo === "telefone") {
    controle.addEventListener("input", () => {
      controle.value = formatarTelefone(controle.value)
    })
  }

  controle.addEventListener("input", () => limparErro(campo.id))
  controle.addEventListener("change", () => limparErro(campo.id))

  return criar("div", { class: "campo", "data-campo": campo.id }, [
    rotulo,
    controle,
    criar("span", { class: "mensagem-erro", "data-erro": campo.id }),
  ])
}

function formatarTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

function limparErro(id) {
  const caixa = document.querySelector(`[data-campo="${id}"]`)
  caixa?.classList.remove("campo--erro")
  const alvo = document.querySelector(`[data-erro="${id}"]`)
  if (alvo) alvo.textContent = ""
}

function mostrarErros(erros) {
  let primeiro = null
  for (const [id, mensagem] of Object.entries(erros)) {
    const caixa = document.querySelector(`[data-campo="${id}"]`)
    caixa?.classList.add("campo--erro")
    const alvo = document.querySelector(`[data-erro="${id}"]`)
    if (alvo) alvo.textContent = mensagem
    if (!primeiro && caixa) primeiro = caixa
  }
  primeiro?.scrollIntoView({ behavior: "smooth", block: "center" })
}

elementos.formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  elementos.erroGeral.textContent = ""
  for (const campo of configuracao?.campos || []) limparErro(campo.id)

  const dados = Object.fromEntries(new FormData(elementos.formulario).entries())

  elementos.botaoEnviar.disabled = true
  elementos.botaoEnviar.textContent = "Enviando..."

  try {
    const resposta = await pedir("/api/inscricao", { method: "POST", corpo: dados })
    mostrarSucesso(resposta.mensagem)
  } catch (erro) {
    if (erro.dados?.erros) {
      mostrarErros(erro.dados.erros)
      elementos.erroGeral.textContent = erro.message
    } else {
      elementos.erroGeral.textContent = erro.message || "Não consegui enviar. Tente de novo."
    }
    elementos.botaoEnviar.disabled = false
    elementos.botaoEnviar.textContent = configuracao?.textos.textoBotao || "Enviar"
  }
})

function mostrarSucesso(mensagem) {
  elementos.caixaFormulario.replaceChildren(
    criar("div", { class: "caixa-sucesso" }, [
      criar("div", { class: "icone-sucesso", texto: "✓" }),
      criar("h2", { texto: "Inscrição enviada!" }),
      criar("p", { class: "subtitulo", texto: mensagem }),
    ]),
  )
  elementos.caixaFormulario.scrollIntoView({ behavior: "smooth", block: "center" })
}

iniciar()
