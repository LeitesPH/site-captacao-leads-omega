/**
 * ====================================================================
 *  ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA MUDAR O SISTEMA
 * ====================================================================
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
  A: { minimo: 70, rotulo: "Lead A", descricao: "Pronto para fechar. Fale hoje." },
  B: { minimo: 45, rotulo: "Lead B", descricao: "Tem potencial. Precisa de nutrição." },
  C: { minimo: 0, rotulo: "Lead C", descricao: "Fora do perfil agora. Deixe na base." },
}

/** Textos do site público. */
export const TEXTOS_SITE = {
  chamada: "Seja parceiro e cresça com a gente",
  subChamada:
    "Preencha o formulário abaixo. Em até 48 horas nosso time analisa seu perfil e entra em contato pelo WhatsApp.",
  beneficios: [
    "Comissões recorrentes sobre cada cliente ativo",
    "Material de vendas, treinamento e suporte dedicado",
    "Time comercial para te ajudar a fechar os primeiros contratos",
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
    rotulo: "Nome completo",
    tipo: "texto",
    obrigatorio: true,
    peso: 0,
    placeholder: "Seu nome",
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
    rotulo: "Cidade e estado",
    tipo: "texto",
    obrigatorio: true,
    peso: 0,
    placeholder: "São Paulo / SP",
    grupo: "Seus dados",
  },
  {
    id: "instagram",
    rotulo: "Instagram ou site (opcional)",
    tipo: "texto",
    obrigatorio: false,
    peso: 0,
    placeholder: "@seuperfil",
    grupo: "Seus dados",
  },

  {
    id: "area",
    rotulo: "Qual sua área de atuação hoje?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 1,
    grupo: "Seu negócio",
    opcoes: [
      { valor: "mesmo_setor", rotulo: "Já atuo no mesmo setor que vocês", pontos: 10 },
      { valor: "setor_proximo", rotulo: "Atuo em um setor parecido / complementar", pontos: 8 },
      { valor: "vendas", rotulo: "Trabalho com vendas ou comercial em geral", pontos: 6 },
      { valor: "outro", rotulo: "Outra área", pontos: 3 },
      { valor: "sem_area", rotulo: "Ainda não atuo profissionalmente", pontos: 0 },
    ],
  },
  {
    id: "faturamento",
    rotulo: "Qual seu faturamento médio por mês?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 3,
    grupo: "Seu negócio",
    opcoes: [
      { valor: "acima_100k", rotulo: "Acima de R$ 100 mil", pontos: 10 },
      { valor: "50k_100k", rotulo: "Entre R$ 50 mil e R$ 100 mil", pontos: 9 },
      { valor: "20k_50k", rotulo: "Entre R$ 20 mil e R$ 50 mil", pontos: 7 },
      { valor: "5k_20k", rotulo: "Entre R$ 5 mil e R$ 20 mil", pontos: 4 },
      { valor: "ate_5k", rotulo: "Até R$ 5 mil", pontos: 2 },
      { valor: "sem_faturamento", rotulo: "Ainda não faturo", pontos: 0 },
    ],
  },
  {
    id: "tempo_mercado",
    rotulo: "Há quanto tempo você está no mercado?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 1,
    grupo: "Seu negócio",
    opcoes: [
      { valor: "mais_5_anos", rotulo: "Mais de 5 anos", pontos: 10 },
      { valor: "2_5_anos", rotulo: "De 2 a 5 anos", pontos: 8 },
      { valor: "1_2_anos", rotulo: "De 1 a 2 anos", pontos: 6 },
      { valor: "menos_1_ano", rotulo: "Menos de 1 ano", pontos: 3 },
      { valor: "comecando", rotulo: "Estou começando agora", pontos: 1 },
    ],
  },
  {
    id: "equipe",
    rotulo: "Quantas pessoas trabalham com você?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 1,
    grupo: "Seu negócio",
    opcoes: [
      { valor: "mais_10", rotulo: "Mais de 10 pessoas", pontos: 10 },
      { valor: "4_10", rotulo: "De 4 a 10 pessoas", pontos: 8 },
      { valor: "2_3", rotulo: "De 2 a 3 pessoas", pontos: 5 },
      { valor: "sozinho", rotulo: "Trabalho sozinho", pontos: 2 },
    ],
  },
  {
    id: "carteira",
    rotulo: "Você já tem uma carteira de clientes para indicar?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Seu negócio",
    opcoes: [
      { valor: "mais_50", rotulo: "Sim, mais de 50 clientes", pontos: 10 },
      { valor: "10_50", rotulo: "Sim, de 10 a 50 clientes", pontos: 8 },
      { valor: "ate_10", rotulo: "Sim, até 10 clientes", pontos: 5 },
      { valor: "rede", rotulo: "Não tenho carteira, mas tenho boa rede de contatos", pontos: 4 },
      { valor: "nenhum", rotulo: "Não tenho", pontos: 0 },
    ],
  },

  {
    id: "experiencia",
    rotulo: "Você já trabalhou como parceiro/revendedor antes?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "sim_resultado", rotulo: "Sim, e tive bons resultados", pontos: 10 },
      { valor: "sim_pouco", rotulo: "Sim, mas sem resultado expressivo", pontos: 6 },
      { valor: "nao_conheco", rotulo: "Nunca fui, mas conheço o modelo", pontos: 4 },
      { valor: "nao", rotulo: "Nunca fui e não conheço", pontos: 1 },
    ],
  },
  {
    id: "investimento",
    rotulo: "Quanto você pode investir para começar?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 3,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "acima_20k", rotulo: "Acima de R$ 20 mil", pontos: 10 },
      { valor: "10k_20k", rotulo: "De R$ 10 mil a R$ 20 mil", pontos: 9 },
      { valor: "5k_10k", rotulo: "De R$ 5 mil a R$ 10 mil", pontos: 7 },
      { valor: "1k_5k", rotulo: "De R$ 1 mil a R$ 5 mil", pontos: 4 },
      { valor: "ate_1k", rotulo: "Até R$ 1 mil", pontos: 2 },
      { valor: "nao_posso", rotulo: "Não posso investir agora", pontos: 0 },
    ],
  },
  {
    id: "dedicacao",
    rotulo: "Quantas horas por semana você pode dedicar?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "integral", rotulo: "Dedicação integral (40h ou mais)", pontos: 10 },
      { valor: "20_40", rotulo: "De 20 a 40 horas", pontos: 8 },
      { valor: "10_20", rotulo: "De 10 a 20 horas", pontos: 5 },
      { valor: "menos_10", rotulo: "Menos de 10 horas", pontos: 2 },
    ],
  },
  {
    id: "inicio",
    rotulo: "Quando você quer começar?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 3,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "imediato", rotulo: "Imediatamente", pontos: 10 },
      { valor: "30_dias", rotulo: "Nos próximos 30 dias", pontos: 8 },
      { valor: "90_dias", rotulo: "Nos próximos 3 meses", pontos: 5 },
      { valor: "sem_previsao", rotulo: "Sem previsão, só pesquisando", pontos: 0 },
    ],
  },
  {
    id: "decisor",
    rotulo: "Você decide sozinho sobre essa parceria?",
    tipo: "selecao",
    obrigatorio: true,
    peso: 2,
    grupo: "Sobre a parceria",
    opcoes: [
      { valor: "sim", rotulo: "Sim, a decisão é minha", pontos: 10 },
      { valor: "socio", rotulo: "Decido junto com um sócio", pontos: 7 },
      { valor: "nao", rotulo: "Outra pessoa decide", pontos: 2 },
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
      { valor: "indicacao", rotulo: "Indicação de um parceiro", pontos: 0 },
      { valor: "instagram", rotulo: "Instagram", pontos: 0 },
      { valor: "google", rotulo: "Google", pontos: 0 },
      { valor: "youtube", rotulo: "YouTube", pontos: 0 },
      { valor: "evento", rotulo: "Evento", pontos: 0 },
      { valor: "outro", rotulo: "Outro", pontos: 0 },
    ],
  },
  {
    id: "objetivo",
    rotulo: "Conte rapidamente por que quer ser parceiro",
    tipo: "textarea",
    obrigatorio: false,
    peso: 0,
    placeholder: "Escreva em poucas linhas...",
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
    id: "sem_previsao_e_c",
    descricao: "Sem previsão para começar: no máximo C",
    tipo: "limite",
    classe: "C",
    quando: (r) => r.inicio === "sem_previsao",
  },
  {
    id: "sem_investimento_maximo_b",
    descricao: "Não pode investir agora: no máximo B",
    tipo: "limite",
    classe: "B",
    quando: (r) => r.investimento === "nao_posso",
  },
  {
    id: "perfil_premium",
    descricao: "Fatura alto, investe alto e quer começar já: entra como A",
    tipo: "piso",
    classe: "A",
    quando: (r) =>
      ["acima_100k", "50k_100k"].includes(r.faturamento) &&
      ["acima_20k", "10k_20k"].includes(r.investimento) &&
      ["imediato", "30_dias"].includes(r.inicio),
  },
]

/** Mensagem sugerida no WhatsApp para cada classe (usada no painel). */
export const MENSAGENS_WHATSAPP = {
  A: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time de parcerias. Vi sua inscrição e seu perfil ficou entre os primeiros da fila. Consegue falar hoje para eu te mostrar como funciona?`,
  B: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time de parcerias. Recebemos sua inscrição e queria entender melhor seu momento para te indicar o melhor caminho. Pode me contar um pouco mais?`,
  C: (lead) =>
    `Oi ${primeiroNome(lead)}! Aqui é do time de parcerias. Obrigado pela inscrição! Vou te mandar nossos materiais para você acompanhar e, quando fizer sentido, a gente retoma a conversa.`,
}

function primeiroNome(lead) {
  const nome = String(lead?.respostas?.nome || "").trim()
  return nome.split(/\s+/)[0] || "tudo bem"
}

/**
 * Apelidos aceitos no webhook, para quando o formulário externo
 * usa outro nome de campo (ex.: "full_name" vira "nome").
 */
export const APELIDOS_WEBHOOK = {
  nome: ["nome", "name", "full_name", "nome_completo", "seu_nome"],
  email: ["email", "e_mail", "e-mail", "mail"],
  whatsapp: ["whatsapp", "telefone", "phone", "celular", "fone", "tel"],
  cidade: ["cidade", "city", "cidade_estado", "localizacao"],
  instagram: ["instagram", "site", "perfil", "url"],
}

/** Lista de campos que pontuam, usada pelo classificador. */
export const CAMPOS_PONTUAVEIS = CAMPOS.filter((c) => c.peso > 0 && Array.isArray(c.opcoes))

/** Nota máxima possível (soma de 10 pontos x peso de cada campo). */
export const PONTUACAO_MAXIMA = CAMPOS_PONTUAVEIS.reduce((total, campo) => {
  const maiorPontuacao = Math.max(...campo.opcoes.map((o) => o.pontos))
  return total + maiorPontuacao * campo.peso
}, 0)
