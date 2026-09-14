import test from "node:test"
import assert from "node:assert/strict"
import { classificar, classePelaNota, validarRespostas } from "../src/classificador.js"
import { FAIXAS, PONTUACAO_MAXIMA } from "../src/criterios.js"

const CONTATO = {
  nome: "Maria Souza",
  clinica: "Clinica Souza",
  email: "maria@exemplo.com",
  whatsapp: "(11) 98888-7777",
  cidade: "Sao Paulo / SP",
}

/** Dentista de alto volume que quer indicar tudo para a Omega. */
const PERFIL_TOPO = {
  ...CONTATO,
  exames_dia: "mais_10",
  pacientes_semana: "mais_100",
  equipe: "mais_10",
  faturamento: "acima_150k",
  dificuldade: "demora",
  objetivo_parceria: "recorrencia",
  origem: "indicacao",
}

/** Consultorio pequeno, sem volume e sem dor. */
const PERFIL_FRACO = {
  ...CONTATO,
  exames_dia: "poucos",
  pacientes_semana: "menos_10",
  equipe: "sozinho",
  faturamento: "ate_15k",
  dificuldade: "sem_dificuldade",
  objetivo_parceria: "desconto",
  origem: "google",
}

test("dentista de alto volume vira A com nota 100", () => {
  const resultado = classificar(PERFIL_TOPO)
  assert.equal(resultado.nota, 100)
  assert.equal(resultado.classe, "A")
  assert.equal(resultado.pontuacao, PONTUACAO_MAXIMA)
})

test("consultorio pequeno e sem dor vira C", () => {
  const resultado = classificar(PERFIL_FRACO)
  assert.equal(resultado.classe, "C")
  assert.ok(resultado.nota < FAIXAS.B.minimo)
})

test("clinica de porte medio vira B", () => {
  const resultado = classificar({
    ...CONTATO,
    exames_dia: "1_2",
    pacientes_semana: "21_50",
    equipe: "3_5",
    faturamento: "15_40k",
    dificuldade: "preco",
    objetivo_parceria: "desconto",
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

test("o volume de exames pesa mais do que o faturamento", () => {
  const muitosExames = classificar({
    ...PERFIL_FRACO,
    exames_dia: "mais_10",
  })
  const muitoFaturamento = classificar({
    ...PERFIL_FRACO,
    faturamento: "acima_150k",
  })
  assert.ok(
    muitosExames.nota > muitoFaturamento.nota,
    "quem pede mais exames tem que pontuar mais do que quem so fatura mais",
  )
})

// ------------------------------------------------------------- regras

test("regra: quem nao pede exames de imagem nao passa de C", () => {
  const resultado = classificar({ ...PERFIL_TOPO, exames_dia: "nenhum" })
  assert.equal(resultado.classe, "C")
  assert.equal(resultado.classePorNota, "A")
  assert.equal(resultado.regrasAplicadas[0].id, "nao_pede_exames")
  assert.match(resultado.explicacao, /colocou o lead em C/)
})

test("regra: quem so esta conhecendo nao passa de B", () => {
  const resultado = classificar({ ...PERFIL_TOPO, objetivo_parceria: "conhecer" })
  assert.equal(resultado.classe, "B")
  assert.equal(resultado.regrasAplicadas[0].id, "so_conhecendo")
})

test("regra: muito volume mais intencao de indicar entra como A", () => {
  const resultado = classificar({
    ...PERFIL_FRACO,
    exames_dia: "6_10",
    objetivo_parceria: "recorrencia",
  })
  assert.equal(resultado.classe, "A")
  assert.equal(resultado.regrasAplicadas[0].id, "volume_alto")
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
    equipe: "sozinho",
    faturamento: "ate_15k",
  })
  assert.ok(resultado.pontosFortes.length > 0)
  assert.ok(resultado.pontosFracos.length > 0)
  assert.ok(resultado.pontosFracos.some((p) => p.campo === "faturamento"))
})

// ------------------------------------------------------------- validacao

test("validacao aponta os campos obrigatorios que faltam", () => {
  const { valido, erros } = validarRespostas({ nome: "So o nome" })
  assert.equal(valido, false)
  assert.equal(erros.clinica, "Campo obrigatório")
  assert.equal(erros.email, "Campo obrigatório")
  assert.equal(erros.whatsapp, "Campo obrigatório")
  assert.equal(erros.exames_dia, "Campo obrigatório")
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
  const { erros } = validarRespostas({ ...PERFIL_TOPO, exames_dia: "quinhentos" })
  assert.equal(erros.exames_dia, "Opção inválida")
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
  const { respostas } = validarRespostas({ ...PERFIL_TOPO, clinica: "   Clinica Souza   " })
  assert.equal(respostas.clinica, "Clinica Souza")
})
