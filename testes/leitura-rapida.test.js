/**
 * A "leitura rapida" do painel (pontos a favor e pontos de atencao)
 * precisa ser coerente: nada pode aparecer nos dois lados ao mesmo tempo.
 */
import test from "node:test"
import assert from "node:assert/strict"
import { classificar } from "../src/classificador.js"

const BASE = {
  nome: "Teste",
  email: "teste@exemplo.com",
  whatsapp: "(11) 98888-7777",
  cidade: "Sao Paulo / SP",
  area: "mesmo_setor",
  faturamento: "50k_100k",
  tempo_mercado: "2_5_anos",
  equipe: "4_10",
  carteira: "10_50",
  experiencia: "sim_resultado",
  investimento: "10k_20k",
  dedicacao: "integral",
  inicio: "imediato",
  decisor: "sim",
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
  const { pontosFracos } = classificar({ ...BASE, investimento: "nao_posso" })
  assert.ok(pontosFracos.some((p) => p.campo === "investimento"))
})

test("perfil perfeito nao tem pontos de atencao", () => {
  const { pontosFortes, pontosFracos } = classificar({
    ...BASE,
    area: "mesmo_setor",
    faturamento: "acima_100k",
    tempo_mercado: "mais_5_anos",
    equipe: "mais_10",
    carteira: "mais_50",
    investimento: "acima_20k",
  })
  assert.equal(pontosFracos.length, 0)
  assert.equal(pontosFortes.length, 3)
})

test("perfil zerado nao tem pontos fortes", () => {
  const { pontosFortes, pontosFracos } = classificar({})
  assert.equal(pontosFortes.length, 0)
  assert.ok(pontosFracos.length > 0)
})
