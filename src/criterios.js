/**
 * ====================================================================
 *  ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA MUDAR O SISTEMA
 * ====================================================================
 *
 * Contexto: a Omega é uma clínica de radiologia odontológica.
 * O "parceiro" é o DENTISTA que passa a indicar exames para a Omega
 * com recorrência. Por isso o que vale ponto aqui é volume de exames,
 * tamanho da clínica e intenção de indicar - não tem nada de comissão,
 * revenda ou investimento.
 *
 * Aqui ficam:
 *   1) as perguntas do formulário de inscrição (o site público monta
 *      o formulário sozinho a partir desta lista);
 *   2) quantos pontos cada resposta vale;
 *   3) as faixas que decidem se o lead é A, B ou C.
 *
 * Mudou aqui, mudou no site e na classificação ao mesmo tempo.
 *
 * COMO FUNCIONA A PONTUAÇÃO
 *   Cada opção tem "pontos" de 0 a 10.
 *   Cada pergunta tem um "peso" (o quanto ela importa).
 *   Nota final = soma(pontos x peso) convertida para uma nota de 0 a 100.
 *
 * TIPOS DE CAMPO ACEITOS
 *   "texto", "email", "telefone", "textarea", "selecao" (lista de opções)
 */

export const CLASSES = ["A", "B", "C"]

/** Faixas de nota que definem a classe. Ajuste os números se quiser ser mais ou menos exigente. */
export const FAIXAS = {
  A: {
    minimo: 70,
    rotulo: "Lead A",
    descricao: "Volume alto e quer indicar. Fale hoje.",
  },
  B: {
    minimo: 45,
    rotulo: "Lead B",
    descricao: "Tem potencial. Vale aproximar e nutrir.",
  },
  C: {
    minimo: 0,
    rotulo: "Lead C",
    descricao: "Pouco volume agora. Deixe na base.",
  },
}

/** Textos do site público. */
export const TEXTOS_SITE = {
  chamada: "Seja parceiro da Omega",
  subChamada:
    "Indique seus exames para a Omega e tenha laudo rápido, contato direto com quem faz o exame e condições exclusivas. Preencha o formulário e nosso time entra em contato pelo WhatsApp.",
  beneficios: [
    "Seu exame pronto em até 24 horas",
    "Conversa direta com o nosso time a qualquer momento, para o exame sair do jeito que você precisa",
    "Descontos exclusivos para clínicas parceiras",
  ],
  tituloFormulario: "Inscrição para parceria",
  subtituloFormulario: "Leva menos de 3 minutos. Todos os campos com * são obrigatórios.",
  textoBotao: "Quero ser parceiro",
  mensagemSucesso:
    "Inscrição recebida! Nosso time vai analisar seu perfil e falar com você pelo WhatsApp.",
}

/**
 * As perguntas.
 * - id: nome interno (não use espaços nem acentos)
 * - peso: 0 = não pontua, só coleta informação
 */
export const CAMPOS = [
  {
    id: "nome",
    rotulo: "Seu nome",
    tipo: "texto",
    obrigatorio: true,
    peso: 0,
    placeholder: "Nome do dentista responsável",
    grupo: "Seus dados",
  },
  {
    id: "clinica",
    rotulo: "Nome da sua clínica",
    tipo: "texto",
    obrigatorio: true,
    peso: 0,
    placeholder: "Como a clínica é conhecida",
    grupo: "Seus dados",
  },
  {
    id: "email",
    rotulo: "E-mail",
    tipo: "email",
    obrigatorio: true,
    peso: 0,
    placeholder: "voce@email.com",
    grupo: "Seus dados",
  },
  {
    id: "whatsapp",
    rotulo: "WhatsApp (com DDD)",
    tipo: "telefone",
    obrigatorio: true,
    peso: 0,
    placeholder: "(11) 99999-9999",
    grupo: "Seus dados",
  },
  {
    id: "cidade",
    rotulo: "Cidade e estado da clínica",
    tipo: "texto",
    obrigatorio: true,
    peso: 0,
    placeholder: "São Paulo / SP",
    grupo: "Seus dados",
  },

  {
    id: "exames_dia",
    rotulo: "Quantos exames de imagem você pede por dia?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 3,
    grupo: "Sua clínica",
    opcoes: [
      { valor: "mais_10", rotulo: "Mais de 10 por dia", pontos: 10 },
      { valor: "6_10", rotulo: "De 6 a 10 por dia", pontos: 9 },
      { valor: "3_5", rotulo: "De 3 a 5 por dia", pontos: 7 },
      { valor: "1_2", rotulo: "De 1 a 2 por dia", pontos: 4 },
      { valor: "poucos", rotulo: "Menos de 1 por dia", pontos: 2 },
      { valor: "nenhum", rotulo: "Hoje eu não peço exames de imagem", pontos: 0 },
    ],
  },
  {
    id: "pacientes_semana",
    rotulo: "Quantos pacientes você atende por semana?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 3,
    grupo: "Sua clínica",
    opcoes: [
      { valor: "mais_100", rotulo: "Mais de 100", pontos: 10 },
      { valor: "51_100", rotulo: "De 51 a 100", pontos: 8 },
      { valor: "21_50", rotulo: "De 21 a 50", pontos: 6 },
      { valor: "10_20", rotulo: "De 10 a 20", pontos: 3 },
      { valor: "menos_10", rotulo: "Menos de 10", pontos: 1 },
    ],
  },
  {
    id: "equipe",
    rotulo: "Quantas pessoas trabalham com você na clínica?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 1,
    grupo: "Sua clínica",
    opcoes: [
      { valor: "mais_10", rotulo: "Mais de 10 pessoas", pontos: 10 },
      { valor: "6_10", rotulo: "De 6 a 10 pessoas", pontos: 8 },
      { valor: "3_5", rotulo: "De 3 a 5 pessoas", pontos: 6 },
      { valor: "2", rotulo: "Somos 2", pontos: 4 },
      { valor: "sozinho", rotulo: "Trabalho sozinho", pontos: 2 },
    ],
  },
  {
    id: "faturamento",
    rotulo: "Qual o faturamento médio mensal da clínica?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sua clínica",
    opcoes: [
      { valor: "acima_150k", rotulo: "Acima de R$ 150 mil", pontos: 10 },
      { valor: "80_150k", rotulo: "De R$ 80 mil a R$ 150 mil", pontos: 9 },
      { valor: "40_80k", rotulo: "De R$ 40 mil a R$ 80 mil", pontos: 7 },
      { valor: "15_40k", rotulo: "De R$ 15 mil a R$ 40 mil", pontos: 5 },
      { valor: "ate_15k", rotulo: "Até R$ 15 mil", pontos: 2 },
      { valor: "prefiro_nao", rotulo: "Prefiro não informar", pontos: 4 },
    ],
  },

  {
    id: "dificuldade",
    rotulo: "Qual sua maior dificuldade hoje com exames?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "demora", rotulo: "A demora para receber o laudo", pontos: 10 },
      { valor: "qualidade", rotulo: "A qualidade da imagem ou do laudo", pontos: 10 },
      { valor: "contato", rotulo: "Não conseguir falar com quem faz o exame", pontos: 9 },
      { valor: "distancia", rotulo: "Não ter um laboratório perto da clínica", pontos: 8 },
      { valor: "preco", rotulo: "O preço para o paciente", pontos: 7 },
      { valor: "sem_dificuldade", rotulo: "Não tenho dificuldade hoje", pontos: 2 },
    ],
  },
  {
    id: "objetivo_parceria",
    rotulo: "O que você procura ao ser parceiro da Omega?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "recorrencia", rotulo: "Passar a indicar meus exames com recorrência", pontos: 10 },
      { valor: "prazo", rotulo: "Receber os exames em até 24 horas", pontos: 9 },
      { valor: "suporte", rotulo: "Falar direto com o time durante o exame", pontos: 8 },
      { valor: "desconto", rotulo: "Condições e descontos de parceiro", pontos: 7 },
      { valor: "conhecer", rotulo: "Só estou conhecendo por enquanto", pontos: 1 },
    ],
  },
  {
    id: "origem",
    rotulo: "Como você chegou até aqui?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 0,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "indicacao", rotulo: "Indicação de outro dentista", pontos: 0 },
      { valor: "representante", rotulo: "Representante da Omega", pontos: 0 },
      { valor: "instagram", rotulo: "Instagram", pontos: 0 },
      { valor: "google", rotulo: "Google", pontos: 0 },
      { valor: "evento", rotulo: "Congresso ou evento", pontos: 0 },
      { valor: "outro", rotulo: "Outro", pontos: 0 },
    ],
  },
  {
    id: "observacao",
    rotulo: "Quer contar mais alguma coisa?",
    tipo: "textarea",
    obrigatorio: false,
    peso: 0,
    placeholder: "Tipos de exame que mais pede, o que espera da parceria...",
    grupo: "Sobre a parceria",
  },
]

/**
 * Regras que passam por cima da nota.
 *   tipo "limite": não deixa passar dessa classe (mesmo com nota alta)
 *   tipo "piso":   garante no mínimo essa classe (mesmo com nota baixa)
 * A primeira regra que bater é aplicada.
 */
export const REGRAS = [
  {
    id: "nao_pede_exames",
    descricao: "Hoje não pede exames de imagem: no máximo C",
    tipo: "limite",
    classe: "C",
    quando: (r) => r.exames_dia === "nenhum",
  },
  {
    id: "so_conhecendo",
    descricao: "Só está conhecendo por enquanto: no máximo B",
    tipo: "limite",
    classe: "B",
    quando: (r) => r.objetivo_parceria === "conhecer",
  },
  {
    id: "volume_alto",
    descricao: "Pede muitos exames por dia e quer indicar com recorrência: entra como A",
    tipo: "piso",
    classe: "A",
    quando: (r) =>
      ["mais_10", "6_10"].includes(r.exames_dia) &&
      ["recorrencia", "prazo"].includes(r.objetivo_parceria),
  },
]

/** Mensagem sugerida no WhatsApp para cada classe (usada no painel). */
export const MENSAGENS_WHATSAPP = {
  A: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time da Omega Diagnóstico Odontológico. Recebi sua inscrição de parceria${daClinica(lead)} e queria te mostrar hoje como funciona o envio dos exames, o laudo em 24 horas e as condições de parceiro. Consegue falar agora?`,
  B: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time da Omega Diagnóstico Odontológico. Recebi sua inscrição de parceria${daClinica(lead)} e queria entender melhor como funcionam seus exames hoje para te mostrar o que faz sentido. Pode me contar um pouco?`,
  C: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time da Omega Diagnóstico Odontológico. Obrigado pela inscrição${daClinica(lead)}! Vou te mandar nossos materiais e, quando precisar de um exame, é só me chamar por aqui.`,
}

function primeiroNome(lead) {
  const nome = String(lead?.respostas?.nome || "").trim()
  return nome.split(/\s+/)[0] || "tudo bem"
}

function daClinica(lead) {
  const clinica = String(lead?.respostas?.clinica || "").trim()
  return clinica ? ` da ${clinica}` : ""
}

/**
 * Apelidos aceitos no webhook, para quando o formulário externo
 * usa outro nome de campo (ex.: "full_name" vira "nome").
 */
export const APELIDOS_WEBHOOK = {
  nome: ["nome", "name", "full_name", "nome_completo", "seu_nome", "dentista"],
  clinica: ["clinica", "clinic", "consultorio", "nome_clinica", "empresa"],
  email: ["email", "e_mail", "e-mail", "mail"],
  whatsapp: ["whatsapp", "telefone", "phone", "celular", "fone", "tel"],
  cidade: ["cidade", "city", "cidade_estado", "localizacao"],
}

/** Lista de campos que pontuam, usada pelo classificador. */
export const CAMPOS_PONTUAVEIS = CAMPOS.filter((c) => c.peso > 0 && Array.isArray(c.opcoes))

/** Nota máxima possível (soma de 10 pontos x peso de cada campo). */
export const PONTUACAO_MAXIMA = CAMPOS_PONTUAVEIS.reduce((total, campo) => {
  const maiorPontuacao = Math.max(...campo.opcoes.map((o) => o.pontos))
  return total + maiorPontuacao * campo.peso
}, 0)
