/**
 * Motor de classificacao: transforma as respostas do formulario
 * em uma nota de 0 a 100 e em uma classe A, B ou C.
 *
 * Alem da classe, devolve a explicacao ("por que esse lead e A?"),
 * que aparece no painel para o time comercial confiar no criterio.
 */
import {
  CAMPOS,
  CAMPOS_PONTUAVEIS,
  CLASSES,
  FAIXAS,
  PONTUACAO_MAXIMA,
  REGRAS,
} from "./criterios.js"

/** Ordem de forca das classes: A e a mais forte. */
const FORCA = { A: 3, B: 2, C: 1 }

/**
 * Converte uma nota de 0 a 100 na classe correspondente.
 * @param {number} nota
 * @returns {"A"|"B"|"C"}
 */
export function classePelaNota(nota) {
  if (nota >= FAIXAS.A.minimo) return "A"
  if (nota >= FAIXAS.B.minimo) return "B"
  return "C"
}

/**
 * Calcula nota, classe e explicacao a partir das respostas.
 * @param {Record<string, unknown>} respostas
 */
export function classificar(respostas = {}) {
  const detalhes = []
  let pontuacao = 0

  for (const campo of CAMPOS_PONTUAVEIS) {
    const valor = respostas[campo.id]
    const opcao = campo.opcoes.find((o) => o.valor === valor)
    const pontos = opcao ? opcao.pontos : 0
    const contribuicao = pontos * campo.peso
    pontuacao += contribuicao

    detalhes.push({
      campo: campo.id,
      pergunta: campo.rotulo,
      resposta: opcao ? opcao.rotulo : "(nao respondeu)",
      pontos,
      peso: campo.peso,
      contribuicao,
      maximo: Math.max(...campo.opcoes.map((o) => o.pontos)) * campo.peso,
    })
  }

  const nota = PONTUACAO_MAXIMA > 0 ? Math.round((pontuacao / PONTUACAO_MAXIMA) * 100) : 0
  const classePorNota = classePelaNota(nota)

  let classe = classePorNota
  const regrasAplicadas = []

  for (const regra of REGRAS) {
    let bateu = false
    try {
      bateu = Boolean(regra.quando(respostas))
    } catch {
      bateu = false
    }
    if (!bateu) continue

    if (regra.tipo === "limite" && FORCA[classe] > FORCA[regra.classe]) {
      classe = regra.classe
      regrasAplicadas.push(regra)
      break
    }
    if (regra.tipo === "piso" && FORCA[classe] < FORCA[regra.classe]) {
      classe = regra.classe
      regrasAplicadas.push(regra)
      break
    }
  }

  // Os 3 pontos que mais ajudaram e os 3 que mais atrapalharam.
  // Uma mesma resposta nunca aparece nos dois lados: se ela ficou perto
  // do maximo da pergunta, conta como ponto forte e sai da lista de atencao.
  const aproveitamento = (d) => (d.maximo > 0 ? d.contribuicao / d.maximo : 0)

  const pontosFortes = detalhes
    .filter((d) => d.contribuicao > 0 && aproveitamento(d) >= 0.7)
    .sort((a, b) => b.contribuicao - a.contribuicao)
    .slice(0, 3)

  const idsFortes = new Set(pontosFortes.map((d) => d.campo))
  const pontosFracos = detalhes
    .filter((d) => !idsFortes.has(d.campo) && d.maximo - d.contribuicao > 0)
    .sort((a, b) => b.maximo - b.contribuicao - (a.maximo - a.contribuicao))
    .slice(0, 3)

  return {
    nota,
    classe,
    classePorNota,
    pontuacao,
    pontuacaoMaxima: PONTUACAO_MAXIMA,
    detalhes,
    pontosFortes,
    pontosFracos,
    regrasAplicadas: regrasAplicadas.map((r) => ({ id: r.id, descricao: r.descricao })),
    explicacao: montarExplicacao(nota, classe, classePorNota, regrasAplicadas),
  }
}

function montarExplicacao(nota, classe, classePorNota, regrasAplicadas) {
  if (regrasAplicadas.length > 0) {
    const regra = regrasAplicadas[0]
    return `Nota ${nota}/100 (daria ${classePorNota}), mas a regra "${regra.descricao}" colocou o lead em ${classe}.`
  }
  return `Nota ${nota}/100, dentro da faixa do Lead ${classe} (a partir de ${FAIXAS[classe].minimo} pontos).`
}

/**
 * Valida as respostas recebidas do formulario.
 * Devolve { valido, erros, respostas } com os valores ja limpos.
 */
export function validarRespostas(entrada = {}) {
  const erros = {}
  const respostas = {}

  for (const campo of CAMPOS) {
    const bruto = entrada[campo.id]
    const valor = typeof bruto === "string" ? bruto.trim() : bruto == null ? "" : String(bruto)

    if (!valor) {
      if (campo.obrigatorio) erros[campo.id] = "Campo obrigatório"
      respostas[campo.id] = ""
      continue
    }

    if (valor.length > 2000) {
      erros[campo.id] = "Resposta muito longa"
      continue
    }

    if (campo.tipo === "email" && !ehEmailValido(valor)) {
      erros[campo.id] = "E-mail inválido"
      continue
    }

    if (campo.tipo === "telefone") {
      const digitos = valor.replace(/\D/g, "")
      if (digitos.length < 10 || digitos.length > 13) {
        erros[campo.id] = "Telefone inválido (use DDD + número)"
        continue
      }
      respostas[campo.id] = valor
      respostas[`${campo.id}_digitos`] = digitos.length <= 11 ? `55${digitos}` : digitos
      continue
    }

    if (campo.tipo === "selecao") {
      const existe = campo.opcoes.some((o) => o.valor === valor)
      if (!existe) {
        erros[campo.id] = "Opção inválida"
        continue
      }
    }

    respostas[campo.id] = valor
  }

  return { valido: Object.keys(erros).length === 0, erros, respostas }
}

export function ehEmailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor))
}

export { CLASSES, FAIXAS }
