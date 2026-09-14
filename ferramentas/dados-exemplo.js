/**
 * Cria leads de exemplo (dentistas) para voce ver o painel funcionando.
 *
 * Uso:  node ferramentas/dados-exemplo.js
 *
 * IMPORTANTE: rode com o servidor PARADO. Este script escreve direto
 * no arquivo dados/leads.json; se o servidor estiver ligado ao mesmo
 * tempo, um pode sobrescrever o que o outro gravou.
 *
 * Use apenas para testar - depois apague o arquivo dados/leads.json
 * para comecar limpo.
 */
import { config } from "../src/config.js"
import { classificar, validarRespostas } from "../src/classificador.js"
import { criarLead, listarLeads } from "../src/db.js"

const EXEMPLOS = [
  {
    nome: "Marina Alves",
    clinica: "Clínica Alves Odontologia",
    email: "marina.alves@exemplo.com",
    whatsapp: "(11) 98123-4567",
    cidade: "São Paulo / SP",
    exames_dia: "mais_10",
    pacientes_semana: "mais_100",
    equipe: "mais_10",
    faturamento: "acima_150k",
    dificuldade: "demora",
    objetivo_parceria: "recorrencia",
    origem: "indicacao",
    observacao: "Peço muita tomografia para implante e o laudo sempre demora.",
  },
  {
    nome: "Rodrigo Tavares",
    clinica: "Odonto Tavares",
    email: "rodrigo.tavares@exemplo.com",
    whatsapp: "(41) 99654-3210",
    cidade: "Curitiba / PR",
    exames_dia: "6_10",
    pacientes_semana: "51_100",
    equipe: "6_10",
    faturamento: "80_150k",
    dificuldade: "contato",
    objetivo_parceria: "prazo",
    origem: "representante",
    observacao: "Trabalho muito com ortodontia e preciso de documentação rápida.",
  },
  {
    nome: "Camila Nunes",
    clinica: "Espaço Sorriso",
    email: "camila.nunes@exemplo.com",
    whatsapp: "(21) 98777-1122",
    cidade: "Rio de Janeiro / RJ",
    exames_dia: "3_5",
    pacientes_semana: "21_50",
    equipe: "3_5",
    faturamento: "40_80k",
    dificuldade: "preco",
    objetivo_parceria: "desconto",
    origem: "instagram",
    observacao: "Meus pacientes reclamam do preço do exame.",
  },
  {
    nome: "Paulo Bianchi",
    clinica: "Consultório Bianchi",
    email: "paulo.bianchi@exemplo.com",
    whatsapp: "(51) 99444-8899",
    cidade: "Porto Alegre / RS",
    exames_dia: "1_2",
    pacientes_semana: "10_20",
    equipe: "2",
    faturamento: "15_40k",
    dificuldade: "distancia",
    objetivo_parceria: "suporte",
    origem: "google",
    observacao: "O laboratório mais perto fica a 40 minutos da clínica.",
  },
  {
    nome: "Beatriz Lima",
    clinica: "Lima Odontologia Integrada",
    email: "beatriz.lima@exemplo.com",
    whatsapp: "(85) 98222-3344",
    cidade: "Fortaleza / CE",
    exames_dia: "6_10",
    pacientes_semana: "51_100",
    equipe: "6_10",
    faturamento: "80_150k",
    dificuldade: "qualidade",
    objetivo_parceria: "conhecer",
    origem: "evento",
    observacao: "Conheci no congresso, ainda estou avaliando mudar de laboratório.",
  },
  {
    nome: "Thiago Moura",
    clinica: "Thiago Moura Odontologia",
    email: "thiago.moura@exemplo.com",
    whatsapp: "(31) 98555-6677",
    cidade: "Belo Horizonte / MG",
    exames_dia: "nenhum",
    pacientes_semana: "menos_10",
    equipe: "sozinho",
    faturamento: "ate_15k",
    dificuldade: "sem_dificuldade",
    objetivo_parceria: "conhecer",
    origem: "instagram",
    observacao: "Acabei de abrir o consultório.",
  },
  {
    nome: "Fernanda Rocha",
    clinica: "Clínica Rocha",
    email: "fernanda.rocha@exemplo.com",
    whatsapp: "(47) 99111-2233",
    cidade: "Joinville / SC",
    exames_dia: "3_5",
    pacientes_semana: "21_50",
    equipe: "3_5",
    faturamento: "40_80k",
    dificuldade: "demora",
    objetivo_parceria: "recorrencia",
    origem: "indicacao",
    observacao: "Quero um laboratório fixo para mandar todos os meus exames.",
  },
  {
    nome: "André Siqueira",
    clinica: "Instituto Siqueira de Implantes",
    email: "andre.siqueira@exemplo.com",
    whatsapp: "(62) 98888-0011",
    cidade: "Goiânia / GO",
    exames_dia: "mais_10",
    pacientes_semana: "mais_100",
    equipe: "mais_10",
    faturamento: "acima_150k",
    dificuldade: "qualidade",
    objetivo_parceria: "recorrencia",
    origem: "indicacao",
    observacao: "Faço só implante e cirurgia, preciso de tomografia de alta qualidade.",
  },
]

const jaExistem = listarLeads().length
if (jaExistem > 0) {
  console.log(
    `\nJá existem ${jaExistem} leads em ${config.arquivoLeads}.\n` +
      "Apague esse arquivo se quiser recomeçar do zero.\n",
  )
}

let criados = 0
for (const exemplo of EXEMPLOS) {
  const { valido, erros, respostas } = validarRespostas(exemplo)
  if (!valido) {
    console.error(`Exemplo "${exemplo.nome}" inválido:`, erros)
    continue
  }
  const analise = classificar(respostas)
  criarLead({ respostas, analise, origem: "exemplo" })
  criados += 1
  console.log(`  ${analise.classe}  ${String(analise.nota).padStart(3)}  ${exemplo.nome}`)
}

console.log(`\n${criados} leads de exemplo criados. Abra o painel para ver.\n`)
