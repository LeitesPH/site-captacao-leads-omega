import test from "node:test"
import assert from "node:assert/strict"
import { classificar, classePelaNota, validarRespostas } from "../src/classificador.js"
import { FAIXAS, PONTUACAO_MAXIMA } from "../src/criterios.js"

const CONTATO = {
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  whatsapp: "(11) 98888-7777",
  cidade: "Sao Paulo / SP",
}

const PERFIL_TOPO = {
  ...CONTATO,
  area: "mesmo_setor",
  faturamento: "acima_100k",
  tempo_mercado: "mais_5_anos",
  equipe: "mais_10",
  carteira: "mais_50",
  experiencia: "sim_resultado",
  investimento: "acima_20k",
  dedicacao: "integral",
  inicio: "imediato",
  decisor: "sim",
  origem: "indicacao",
}

const PERFIL_FRACO = {
  ...CONTATO,
  area: "sem_area",
  faturamento: "sem_faturamento",
  tempo_mercado: "comecando",
  equipe: "sozinho",
  carteira: "nenhum",
  experiencia: "nao",
  investimento: "ate_1k",
  dedicacao: "menos_10",
  inicio: "90_dias",
  decisor: "nao",
  origem: "google",
}

test("perfil no topo de todas as respostas vira A com nota 100", () => {
  const resultado = classificar(PERFIL_TOPO)
  assert.equal(resultado.nota, 100)
  assert.equal(resultado.classe, "A")
  assert.equal(resultado.pontuacao, PONTUACAO_MAXIMA)
})

test("perfil fraco vira C", () => {
  const resultado = classificar(PERFIL_FRACO)
  assert.equal(resultado.classe, "C")
  assert.ok(resultado.nota < FAIXAS.B.minimo)
})

test("perfil intermediario vira B", () => {
  const resultado = classificar({
    ...CONTATO,
    area: "vendas",
    faturamento: "20k_50k",
    tempo_mercado: "1_2_anos",
    equipe: "2_3",
    carteira: "ate_10",
    experiencia: "nao_conheco",
    investimento: "1k_5k",
    dedicacao: "10_20",
    inicio: "30_dias",
    decisor: "socio",
    origem: "instagram",
  })
  assert.equal(resultado.classe, "B")
  assert.ok(resultado.nota >= FAIXAS.B.minimo && resultado.nota < FAIXAS.A.minimo)
})

test("respostas vazias nao quebram e caem em C", () => {
  const resultado = classificar({})
  assert.equal(resultado.nota, 0)
  assert.equal(resultado.classe, "C")
})

test('regra de limite: "sem previsao para comecar" derruba um perfil de topo para C', () => {
  const resultado = classificar({ ...PERFIL_TOPO, inicio: "sem_previsao" })
  assert.equal(resultado.classe, "C")
  assert.equal(resultado.classePorNota, "A")
  assert.equal(resultado.regrasAplicadas[0].id, "sem_previsao_e_c")
  assert.match(resultado.explicacao, /colocou o lead em C/)
})

test("regra de limite: quem nao pode investir agora nao passa de B", () => {
  const resultado = classificar({ ...PERFIL_TOPO, investimento: "nao_posso" })
  assert.equal(resultado.classe, "B")
})

test("regra de piso: fatura alto, investe alto e comeca ja entra como A", () => {
  const resultado = classificar({
    ...PERFIL_FRACO,
    faturamento: "acima_100k",
    investimento: "acima_20k",
    inicio: "imediato",
  })
  assert.equal(resultado.classe, "A")
  assert.equal(resultado.regrasAplicadas[0].id, "perfil_premium")
})

test("faixas de nota respeitam os limites configurados", () => {
  assert.equal(classePelaNota(FAIXAS.A.minimo), "A")
  assert.equal(classePelaNota(FAIXAS.A.minimo - 1), "B")
  assert.equal(classePelaNota(FAIXAS.B.minimo), "B")
  assert.equal(classePelaNota(FAIXAS.B.minimo - 1), "C")
  assert.equal(classePelaNota(0), "C")
})

test("a explicacao cita a nota e a classe", () => {
  const resultado = classificar(PERFIL_TOPO)
  assert.match(resultado.explicacao, /100\/100/)
  assert.match(resultado.explicacao, /Lead A/)
})

test("pontos fortes e fracos sao listados", () => {
  const resultado = classificar({
    ...PERFIL_TOPO,
    dedicacao: "menos_10",
    carteira: "nenhum",
  })
  assert.ok(resultado.pontosFortes.length > 0)
  assert.ok(resultado.pontosFracos.length > 0)
  assert.ok(resultado.pontosFracos.some((p) => p.campo === "carteira"))
})

// ------------------------------------------------------------- validacao

test("validacao aponta os campos obrigatorios que faltam", () => {
  const { valido, erros } = validarRespostas({ nome: "So o nome" })
  assert.equal(valido, false)
  assert.equal(erros.email, "Campo obrigatório")
  assert.equal(erros.whatsapp, "Campo obrigatório")
})

test("validacao recusa e-mail invalido", () => {
  const { erros } = validarRespostas({ ...PERFIL_TOPO, email: "nao-e-email" })
  assert.equal(erros.email, "E-mail inválido")
})

test("validacao recusa telefone curto", () => {
  const { erros } = validarRespostas({ ...PERFIL_TOPO, whatsapp: "1234" })
  assert.match(erros.whatsapp, /Telefone inválido/)
})

test("validacao recusa opcao que nao existe na lista", () => {
  const { erros } = validarRespostas({ ...PERFIL_TOPO, faturamento: "um_bilhao" })
  assert.equal(erros.faturamento, "Opção inválida")
})

test("telefone vira numero pronto para o WhatsApp com DDI 55", () => {
  const { valido, respostas } = validarRespostas(PERFIL_TOPO)
  assert.equal(valido, true)
  assert.equal(respostas.whatsapp_digitos, "5511988887777")
})

test("telefone que ja veio com DDI nao ganha outro 55", () => {
  const { respostas } = validarRespostas({ ...PERFIL_TOPO, whatsapp: "5511988887777" })
  assert.equal(respostas.whatsapp_digitos, "5511988887777")
})

test("espacos em branco sao removidos das respostas", () => {
  const { respostas } = validarRespostas({ ...PERFIL_TOPO, nome: "   Maria Souza   " })
  assert.equal(respostas.nome, "Maria Souza")
})
