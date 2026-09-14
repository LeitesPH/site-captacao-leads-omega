/**
 * Cria leads de exemplo para voce ver o painel funcionando.
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
    email: "marina.alves@exemplo.com",
    whatsapp: "(11) 98123-4567",
    cidade: "São Paulo / SP",
    instagram: "@marinaalves.oficial",
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
    objetivo: "Quero levar a solução para a minha carteira de clientes já em setembro.",
  },
  {
    nome: "Rodrigo Tavares",
    email: "rodrigo.tavares@exemplo.com",
    whatsapp: "(41) 99654-3210",
    cidade: "Curitiba / PR",
    area: "setor_proximo",
    faturamento: "50k_100k",
    tempo_mercado: "2_5_anos",
    equipe: "4_10",
    carteira: "10_50",
    experiencia: "sim_resultado",
    investimento: "10k_20k",
    dedicacao: "20_40",
    inicio: "30_dias",
    decisor: "socio",
    origem: "instagram",
    objetivo: "Já represento duas marcas e quero somar mais uma linha de receita.",
  },
  {
    nome: "Camila Nunes",
    email: "camila.nunes@exemplo.com",
    whatsapp: "(21) 98777-1122",
    cidade: "Rio de Janeiro / RJ",
    area: "vendas",
    faturamento: "20k_50k",
    tempo_mercado: "1_2_anos",
    equipe: "2_3",
    carteira: "ate_10",
    experiencia: "nao_conheco",
    investimento: "5k_10k",
    dedicacao: "20_40",
    inicio: "30_dias",
    decisor: "sim",
    origem: "google",
    objetivo: "Trabalho com vendas e quero algo recorrente.",
  },
  {
    nome: "Paulo Bianchi",
    email: "paulo.bianchi@exemplo.com",
    whatsapp: "(51) 99444-8899",
    cidade: "Porto Alegre / RS",
    area: "outro",
    faturamento: "5k_20k",
    tempo_mercado: "menos_1_ano",
    equipe: "sozinho",
    carteira: "rede",
    experiencia: "sim_pouco",
    investimento: "1k_5k",
    dedicacao: "10_20",
    inicio: "90_dias",
    decisor: "sim",
    origem: "youtube",
    objetivo: "Estou montando meu negócio e quero entender o modelo.",
  },
  {
    nome: "Beatriz Lima",
    email: "beatriz.lima@exemplo.com",
    whatsapp: "(85) 98222-3344",
    cidade: "Fortaleza / CE",
    area: "mesmo_setor",
    faturamento: "50k_100k",
    tempo_mercado: "2_5_anos",
    equipe: "4_10",
    carteira: "10_50",
    experiencia: "sim_resultado",
    investimento: "nao_posso",
    dedicacao: "20_40",
    inicio: "imediato",
    decisor: "sim",
    origem: "evento",
    objetivo: "Tenho estrutura, mas não posso investir capital agora.",
  },
  {
    nome: "Thiago Moura",
    email: "thiago.moura@exemplo.com",
    whatsapp: "(31) 98555-6677",
    cidade: "Belo Horizonte / MG",
    area: "sem_area",
    faturamento: "sem_faturamento",
    tempo_mercado: "comecando",
    equipe: "sozinho",
    carteira: "nenhum",
    experiencia: "nao",
    investimento: "ate_1k",
    dedicacao: "menos_10",
    inicio: "sem_previsao",
    decisor: "nao",
    origem: "instagram",
    objetivo: "Só pesquisando por enquanto.",
  },
  {
    nome: "Fernanda Rocha",
    email: "fernanda.rocha@exemplo.com",
    whatsapp: "(47) 99111-2233",
    cidade: "Joinville / SC",
    area: "setor_proximo",
    faturamento: "20k_50k",
    tempo_mercado: "2_5_anos",
    equipe: "2_3",
    carteira: "ate_10",
    experiencia: "sim_pouco",
    investimento: "5k_10k",
    dedicacao: "10_20",
    inicio: "30_dias",
    decisor: "socio",
    origem: "indicacao",
    objetivo: "Quero começar pequeno e crescer com o tempo.",
  },
  {
    nome: "André Siqueira",
    email: "andre.siqueira@exemplo.com",
    whatsapp: "(62) 98888-0011",
    cidade: "Goiânia / GO",
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
    objetivo: "Tenho equipe comercial pronta para começar na semana que vem.",
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
