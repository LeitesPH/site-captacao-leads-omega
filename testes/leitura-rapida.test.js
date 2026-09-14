/**
 * A "leitura rapida" do painel (pontos a favor e pontos de atencao)
 * precisa ser coerente: nada pode aparecer nos dois lados ao mesmo tempo.
 */
import test from "node:test"
import assert from "node:assert/strict"
import { classificar } from "../src/classificador.js"

const BASE = {
  nome: "Teste",
  clinica: "Clinica Teste",
  email: "teste@exemplo.com",
  whatsapp: "(11) 98888-7777",
  cidade: "Sao Paulo / SP",
  exames_dia: "6_10",
  pacientes_semana: "51_100",
  equipe: "6_10",
  faturamento: "80_150k",
  dificuldade: "demora",
  objetivo_parceria: "recorrencia",
  origem: "indicacao",
}

test("nenhuma resposta aparece ao mesmo tempo como forte e como atencao", () => {
  const { pontosFortes, pontosFracos } = classificar(BASE)
  const fortes = new Set(pontosFortes.map((p) => p.campo))
  for (const fraco of pontosFracos) {
    assert.ok(!fortes.has(fraco.campo), `"${fraco.campo}" aparece nos dois lados`)
  }
})

test("so entra como ponto forte quem chegou perto do maximo da pergunta", () => {
  const { pontosFortes } = classificar(BASE)
  for (const ponto of pontosFortes) {
    assert.ok(
      ponto.contribuicao / ponto.maximo >= 0.7,
      `"${ponto.campo}" aproveitou pouco da pergunta e nao deveria ser ponto forte`,
    )
  }
})

test("a resposta pior pontuada aparece entre os pontos de atencao", () => {
  const { pontosFracos } = classificar({ ...BASE, faturamento: "ate_15k" })
  assert.ok(pontosFracos.some((p) => p.campo === "faturamento"))
})

test("perfil perfeito nao tem pontos de atencao", () => {
  const { pontosFortes, pontosFracos } = classificar({
    ...BASE,
    exames_dia: "mais_10",
    pacientes_semana: "mais_100",
    equipe: "mais_10",
    faturamento: "acima_150k",
    dificuldade: "demora",
    objetivo_parceria: "recorrencia",
  })
  assert.equal(pontosFracos.length, 0)
  assert.equal(pontosFortes.length, 3)
})

test("perfil zerado nao tem pontos fortes", () => {
  const { pontosFortes, pontosFracos } = classificar({})
  assert.equal(pontosFortes.length, 0)
  assert.ok(pontosFracos.length > 0)
})
