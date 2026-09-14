/**
 * Painel de leads: mostra os leads separados em A, B e C,
 * permite arrastar entre as colunas, mudar status, anotar e exportar.
 */
import {
  alternarTema,
  aplicarTemaSalvo,
  avisar,
  criar,
  formatarData,
  pedir,
  tempoRelativo,
} from "./comum.js"

aplicarTemaSalvo()

const ROTULOS_STATUS = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  reuniao: "Reunião marcada",
  fechou: "Fechou",
  recusou: "Recusou",
}

const estado = {
  configuracao: null,
  leads: [],
  metricas: null,
  leadAberto: null,
  visao: "quadro",
  rotulosDeOpcao: {},
  camposPorId: {},
}

const el = (id) => document.getElementById(id)

// ---------------------------------------------------------------- inicio

async function iniciar() {
  try {
    estado.configuracao = await pedir("/api/painel")
  } catch (erro) {
    if (erro.status === 401) {
      window.location.href = "/entrar"
      return
    }
    avisar("Não consegui carregar o painel.")
    return
  }

  document.title = `Painel de leads · ${estado.configuracao.nomePrograma}`

  const eu = estado.configuracao.usuario
  if (eu) {
    el("quem-sou").textContent = `${eu.nome || eu.login}${eu.papel === "admin" ? "" : " · vendedor"}`
  }

  for (const campo of estado.configuracao.campos) {
    estado.camposPorId[campo.id] = campo
    for (const opcao of campo.opcoes || []) {
      estado.rotulosDeOpcao[`${campo.id}:${opcao.valor}`] = opcao.rotulo
    }
  }

  preencherFiltros()
  ligarEventos()
  await recarregar()
}

function preencherFiltros() {
  const filtroStatus = el("filtro-status")
  for (const status of estado.configuracao.status) {
    filtroStatus.append(criar("option", { value: status, texto: ROTULOS_STATUS[status] || status }))
  }

  const campoOrigem = estado.camposPorId.origem
  if (campoOrigem) {
    const filtroOrigem = el("filtro-origem")
    for (const opcao of campoOrigem.opcoes) {
      filtroOrigem.append(criar("option", { value: opcao.valor, texto: opcao.rotulo }))
    }
  } else {
    el("filtro-origem").classList.add("esconder")
  }
}

function ligarEventos() {
  el("botao-tema").addEventListener("click", alternarTema)

  el("botao-sair").addEventListener("click", async () => {
    await pedir("/api/logout", { method: "POST" }).catch(() => {})
    window.location.href = "/entrar"
  })

  el("botao-exportar").addEventListener("click", () => {
    window.location.href = `/api/exportar.csv?${montarFiltros()}`
  })

  el("botao-limpar").addEventListener("click", () => {
    el("busca").value = ""
    el("filtro-status").value = ""
    el("filtro-origem").value = ""
    el("filtro-periodo").value = "0"
    el("ordenar").value = "recentes"
    recarregar()
  })

  let tempoBusca
  el("busca").addEventListener("input", () => {
    clearTimeout(tempoBusca)
    tempoBusca = setTimeout(recarregar, 250)
  })

  for (const id of ["filtro-status", "filtro-origem", "filtro-periodo", "ordenar"]) {
    el(id).addEventListener("change", recarregar)
  }

  for (const botao of document.querySelectorAll(".abas button")) {
    botao.addEventListener("click", () => {
      for (const outro of document.querySelectorAll(".abas button")) {
        outro.classList.toggle("ativa", outro === botao)
      }
      estado.visao = botao.dataset.visao
      el("visao-quadro").classList.toggle("esconder", estado.visao !== "quadro")
      el("visao-lista").classList.toggle("esconder", estado.visao !== "lista")
      desenharLeads()
    })
  }

  el("fundo-escuro").addEventListener("click", fecharGaveta)
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharGaveta()
  })
}

function montarFiltros() {
  const parametros = new URLSearchParams()
  const busca = el("busca").value.trim()
  if (busca) parametros.set("busca", busca)
  if (el("filtro-status").value) parametros.set("status", el("filtro-status").value)
  if (el("filtro-origem").value) parametros.set("origem", el("filtro-origem").value)
  if (el("filtro-periodo").value !== "0") parametros.set("dias", el("filtro-periodo").value)
  parametros.set("ordenar", el("ordenar").value)
  return parametros.toString()
}

async function recarregar() {
  try {
    const [resultado, metricas] = await Promise.all([
      pedir(`/api/leads?${montarFiltros()}`),
      pedir("/api/metricas"),
    ])
    estado.leads = resultado.leads
    estado.metricas = metricas
    desenharIndicadores()
    desenharLeads()
  } catch (erro) {
    if (erro.status === 401) window.location.href = "/entrar"
    else avisar(erro.message || "Erro ao carregar os leads")
  }
}

// ---------------------------------------------------------------- topo

function desenharIndicadores() {
  const m = estado.metricas
  const cartoes = [
    { rotulo: "Total de leads", valor: m.total, apoio: `${m.hoje} hoje · ${m.ultimos7Dias} em 7 dias` },
    { rotulo: "Lead A", valor: m.porClasse.A, apoio: "Prontos para fechar", classe: "indicador--a" },
    { rotulo: "Lead B", valor: m.porClasse.B, apoio: "Precisam de nutrição", classe: "indicador--b" },
    { rotulo: "Lead C", valor: m.porClasse.C, apoio: "Fora do perfil agora", classe: "indicador--c" },
    { rotulo: "Nota média", valor: m.notaMedia, apoio: "de 0 a 100" },
    { rotulo: "Fechados", valor: m.fechados, apoio: `${m.taxaFechamento}% da base` },
  ]

  el("indicadores").replaceChildren(
    ...cartoes.map((cartao) =>
      criar("div", { class: `cartao indicador ${cartao.classe || ""}` }, [
        criar("div", { class: "rotulo", texto: cartao.rotulo }),
        criar("div", { class: "valor", texto: String(cartao.valor) }),
        criar("div", { class: "apoio", texto: cartao.apoio }),
      ]),
    ),
  )
}

// ---------------------------------------------------------------- listagem

function desenharLeads() {
  if (estado.visao === "quadro") desenharQuadro()
  else desenharTabela()
}

function desenharQuadro() {
  const faixas = estado.configuracao.faixas
  const colunas = ["A", "B", "C"].map((classe) => {
    const daClasse = estado.leads.filter((lead) => lead.classe === classe)

    const lista = criar("div", { class: "lista-coluna", "data-classe": classe })
    if (daClasse.length === 0) {
      lista.append(
        criar("div", { class: "vazio" }, [
          criar("div", { class: "icone", texto: "—" }),
          criar("p", { texto: "Nenhum lead aqui" }),
        ]),
      )
    } else {
      lista.append(...daClasse.map(montarCartaoLead))
    }

    const coluna = criar("div", { class: `coluna coluna--${classe.toLowerCase()}` }, [
      criar("div", { class: "cabecalho-coluna" }, [
        criar("span", { class: `etiqueta etiqueta--${classe.toLowerCase()}`, texto: classe }),
        criar("div", {}, [
          criar("div", { class: "titulo", texto: faixas[classe].rotulo }),
          criar("div", { class: "descricao", texto: faixas[classe].descricao }),
        ]),
        criar("span", { class: "contagem", texto: String(daClasse.length) }),
      ]),
      lista,
    ])

    prepararSolta(coluna, classe)
    return coluna
  })

  el("quadro").replaceChildren(...colunas)
}

function montarCartaoLead(lead) {
  const cartao = criar(
    "div",
    { class: "cartao-lead", draggable: "true", "data-id": lead.id },
    [
      criar("div", { class: "linha-topo" }, [
        criar("span", { class: "ponto-status", "data-status": lead.status }),
        criar("span", { class: "nome", texto: lead.respostas.nome || "Sem nome" }),
        criar("span", { class: "nota", texto: `${lead.nota}` }),
      ]),
      criar("div", { class: "detalhe", texto: lead.respostas.cidade || lead.respostas.email || "" }),
      criar("div", { class: "rodape" }, [
        criar("span", { class: "etiqueta etiqueta--neutra", texto: ROTULOS_STATUS[lead.status] }),
        lead.classe_manual ? criar("span", { class: "etiqueta etiqueta--neutra", texto: "manual" }) : null,
        criar("span", { class: "detalhe", texto: tempoRelativo(lead.criado_em) }),
      ]),
    ],
  )

  cartao.addEventListener("click", () => abrirGaveta(lead.id))
  cartao.addEventListener("dragstart", (evento) => {
    evento.dataTransfer.setData("text/plain", lead.id)
    evento.dataTransfer.effectAllowed = "move"
    cartao.classList.add("arrastando")
  })
  cartao.addEventListener("dragend", () => cartao.classList.remove("arrastando"))
  return cartao
}

function prepararSolta(coluna, classe) {
  coluna.addEventListener("dragover", (evento) => {
    evento.preventDefault()
    evento.dataTransfer.dropEffect = "move"
    coluna.classList.add("recebendo")
  })
  coluna.addEventListener("dragleave", (evento) => {
    if (!coluna.contains(evento.relatedTarget)) coluna.classList.remove("recebendo")
  })
  coluna.addEventListener("drop", async (evento) => {
    evento.preventDefault()
    coluna.classList.remove("recebendo")
    const id = evento.dataTransfer.getData("text/plain")
    const lead = estado.leads.find((item) => item.id === id)
    if (!lead || lead.classe === classe) return
    await salvarLead(id, { classe })
    avisar(`${lead.respostas.nome || "Lead"} movido para ${classe}`)
  })
}

function desenharTabela() {
  const corpo = el("corpo-tabela")
  el("lista-vazia").classList.toggle("esconder", estado.leads.length > 0)

  corpo.replaceChildren(
    ...estado.leads.map((lead) => {
      const linha = criar("tr", { "data-id": lead.id }, [
        criar("td", {}, [
          criar("span", {
            class: `etiqueta etiqueta--${lead.classe.toLowerCase()}`,
            texto: lead.classe,
          }),
        ]),
        criar("td", { texto: String(lead.nota) }),
        criar("td", { texto: lead.respostas.nome || "-" }),
        criar("td", {}, [
          criar("div", { texto: lead.respostas.email || "-" }),
          criar("div", { class: "detalhe", texto: lead.respostas.whatsapp || "" }),
        ]),
        criar("td", { texto: lead.respostas.cidade || "-" }),
        criar("td", {}, [
          criar("span", { class: "etiqueta etiqueta--neutra", texto: ROTULOS_STATUS[lead.status] }),
        ]),
        criar("td", { texto: formatarData(lead.criado_em) }),
      ])
      linha.addEventListener("click", () => abrirGaveta(lead.id))
      return linha
    }),
  )
}

// ---------------------------------------------------------------- gaveta

async function abrirGaveta(id) {
  try {
    estado.leadAberto = await pedir(`/api/leads/${id}`)
  } catch {
    avisar("Não consegui abrir esse lead.")
    return
  }
  desenharGaveta()
  el("gaveta").classList.add("aberta")
  el("gaveta").setAttribute("aria-hidden", "false")
  el("fundo-escuro").classList.add("aberto")
}

function fecharGaveta() {
  el("gaveta").classList.remove("aberta")
  el("gaveta").setAttribute("aria-hidden", "true")
  el("fundo-escuro").classList.remove("aberto")
  estado.leadAberto = null
}

function desenharGaveta() {
  const lead = estado.leadAberto
  if (!lead) return
  const classeMinuscula = lead.classe.toLowerCase()

  const seletorClasse = criar(
    "select",
    {
      onchange: (evento) => salvarLead(lead.id, { classe: evento.target.value }),
    },
    ["A", "B", "C"].map((classe) =>
      criar("option", {
        value: classe,
        selected: classe === lead.classe ? "selected" : null,
        texto: `Lead ${classe}`,
      }),
    ),
  )

  const seletorStatus = criar(
    "select",
    {
      onchange: (evento) => salvarLead(lead.id, { status: evento.target.value }),
    },
    estado.configuracao.status.map((status) =>
      criar("option", {
        value: status,
        selected: status === lead.status ? "selected" : null,
        texto: ROTULOS_STATUS[status] || status,
      }),
    ),
  )

  const anotacoes = criar("textarea", {
    placeholder: "O que foi conversado, combinados, próximo passo...",
    texto: lead.observacoes || "",
  })
  let tempoAnotacoes
  anotacoes.addEventListener("input", () => {
    clearTimeout(tempoAnotacoes)
    tempoAnotacoes = setTimeout(() => {
      salvarLead(lead.id, { observacoes: anotacoes.value }, { silencioso: true, semRedesenhar: true })
    }, 700)
  })

  const camposRespostas = estado.configuracao.campos.filter(
    (campo) => lead.respostas[campo.id] && campo.id !== "nome",
  )

  el("gaveta").replaceChildren(
    criar("div", { class: "cabecalho-gaveta" }, [
      criar("div", { style: "flex:1" }, [
        criar("h2", { texto: lead.respostas.nome || "Sem nome" }),
        criar("div", { class: "detalhe", style: "color:var(--texto-suave);font-size:0.88rem" }, [
          `Inscrito em ${formatarData(lead.criado_em, true)}`,
        ]),
      ]),
      criar("span", { class: `etiqueta etiqueta--${classeMinuscula}`, texto: `Lead ${lead.classe}` }),
      criar("button", {
        class: "botao botao--secundario botao--pequeno",
        texto: "Fechar",
        onclick: fecharGaveta,
      }),
    ]),

    criar("div", { class: "corpo-gaveta" }, [
      // --- por que essa classe
      criar("div", { class: "bloco" }, [
        criar("h3", { texto: "Por que esse lead é " + lead.classe }),
        criar("div", { class: "caixa-explicacao" }, [
          criar("div", { texto: lead.analise?.explicacao || "" }),
          criar("div", { class: "medidor" }, [
            criar("div", { style: `width:${Math.max(2, lead.nota)}%` }),
          ]),
          criar("div", {
            class: "detalhe",
            style: "font-size:0.8rem;color:var(--texto-suave)",
            texto: `${lead.nota} de 100 pontos`,
          }),
          lead.classe_manual
            ? criar("div", {
                style: "margin-top:10px;font-size:0.85rem",
                texto: `Classificado à mão. O sistema tinha colocado em ${lead.classe_automatica}.`,
              })
            : null,
        ]),
      ]),

      // --- pontos fortes e fracos
      criar("div", { class: "bloco" }, [
        criar("h3", { texto: "Leitura rápida" }),
        criar("div", { class: "linha-dupla" }, [
          criar("div", {}, [
            criar("div", {
              style: "font-size:0.85rem;font-weight:700;margin-bottom:6px",
              texto: "A favor",
            }),
            criar(
              "ul",
              { class: "lista-pontos lista-pontos--fortes" },
              (lead.analise?.pontosFortes || []).map((ponto) =>
                criar("li", {}, [
                  criar("span", { class: "marcador", texto: "▲" }),
                  criar("span", {}, [
                    criar("span", { class: "pergunta-ponto", texto: `${ponto.pergunta} ` }),
                    criar("strong", { texto: ponto.resposta }),
                  ]),
                ]),
              ),
            ),
          ]),
          criar("div", {}, [
            criar("div", {
              style: "font-size:0.85rem;font-weight:700;margin-bottom:6px",
              texto: "Atenção",
            }),
            criar(
              "ul",
              { class: "lista-pontos lista-pontos--fracos" },
              (lead.analise?.pontosFracos || []).map((ponto) =>
                criar("li", {}, [
                  criar("span", { class: "marcador", texto: "▼" }),
                  criar("span", {}, [
                    criar("span", { class: "pergunta-ponto", texto: `${ponto.pergunta} ` }),
                    criar("strong", { texto: ponto.resposta }),
                  ]),
                ]),
              ),
            ),
          ]),
        ]),
      ]),

      // --- controles
      criar("div", { class: "bloco" }, [
        criar("h3", { texto: "Classificação e atendimento" }),
        criar("div", { class: "linha-dupla" }, [
          criar("div", { class: "campo" }, [criar("label", { texto: "Classe" }), seletorClasse]),
          criar("div", { class: "campo" }, [criar("label", { texto: "Status" }), seletorStatus]),
        ]),
        criar("div", { class: "campo" }, [criar("label", { texto: "Anotações" }), anotacoes]),
      ]),

      // --- respostas
      criar("div", { class: "bloco" }, [
        criar("h3", { texto: "Respostas do formulário" }),
        criar(
          "div",
          { class: "lista-respostas" },
          camposRespostas.map((campo) =>
            criar("div", { class: "item-resposta" }, [
              criar("span", { class: "pergunta", texto: campo.rotulo }),
              criar("span", {
                class: "resposta",
                texto:
                  estado.rotulosDeOpcao[`${campo.id}:${lead.respostas[campo.id]}`] ||
                  lead.respostas[campo.id],
              }),
            ]),
          ),
        ),
      ]),

      // --- historico
      criar("div", { class: "bloco" }, [
        criar("h3", { texto: "Histórico" }),
        criar(
          "ul",
          { class: "historico" },
          (lead.historico || [])
            .slice()
            .reverse()
            .map((item) =>
              criar("li", {}, [
                criar("span", { texto: item.detalhe }),
                criar("span", { texto: tempoRelativo(item.em) }),
              ]),
            ),
        ),
      ]),
    ]),

    criar("div", { class: "rodape-gaveta" }, [
      lead.whatsapp_link
        ? criar("a", {
            class: "botao",
            href: lead.whatsapp_link,
            target: "_blank",
            rel: "noopener",
            texto: "Chamar no WhatsApp",
          })
        : null,
      lead.respostas.email
        ? criar("a", {
            class: "botao botao--secundario",
            href: `mailto:${lead.respostas.email}`,
            texto: "Enviar e-mail",
          })
        : null,
      criar("span", { style: "flex:1" }),
      estado.configuracao.usuario?.papel === "admin"
        ? criar("button", {
            class: "botao botao--perigo botao--pequeno",
            texto: "Excluir",
            onclick: () => excluirLead(lead.id),
          })
        : null,
    ]),
  )
}

// ---------------------------------------------------------------- acoes

async function salvarLead(id, mudancas, { silencioso = false, semRedesenhar = false } = {}) {
  try {
    const atualizado = await pedir(`/api/leads/${id}`, { method: "PATCH", corpo: mudancas })
    if (estado.leadAberto?.id === id) estado.leadAberto = atualizado
    const indice = estado.leads.findIndex((lead) => lead.id === id)
    if (indice !== -1) estado.leads[indice] = atualizado

    if (!semRedesenhar) {
      await recarregar()
      if (estado.leadAberto?.id === id) desenharGaveta()
    }
    if (!silencioso) avisar("Salvo")
  } catch (erro) {
    avisar(erro.message || "Não consegui salvar")
  }
}

async function excluirLead(id) {
  const lead = estado.leadAberto
  const nome = lead?.respostas?.nome || "este lead"
  if (!window.confirm(`Excluir ${nome}? Essa ação não tem volta.`)) return
  try {
    await pedir(`/api/leads/${id}`, { method: "DELETE" })
    fecharGaveta()
    await recarregar()
    avisar("Lead excluido")
  } catch (erro) {
    avisar(erro.message || "Não consegui excluir")
  }
}

iniciar()
