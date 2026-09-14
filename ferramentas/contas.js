/**
 * Gerencia as contas de acesso ao painel.
 *
 * Use com o site PARADO (ele lê o arquivo de contas ao subir).
 *
 *   node ferramentas/contas.js listar
 *   node ferramentas/contas.js criar <login> <senha> [admin|vendedor] ["Nome da pessoa"]
 *   node ferramentas/contas.js senha <login> <nova-senha>
 *   node ferramentas/contas.js remover <login>
 */
import { PAPEIS, alterarSenha, criarUsuario, listarUsuarios, removerUsuario } from "../src/usuarios.js"

const [comando, ...argumentos] = process.argv.slice(2)

function ajuda() {
  console.log(`
Contas de acesso ao painel

  node ferramentas/contas.js listar
  node ferramentas/contas.js criar <login> <senha> [${PAPEIS.join("|")}] ["Nome"]
  node ferramentas/contas.js senha <login> <nova-senha>
  node ferramentas/contas.js remover <login>

O papel "admin" pode tudo; "vendedor" atende os leads mas não pode excluir.
`)
}

function mostrarLista() {
  const contas = listarUsuarios()
  if (contas.length === 0) {
    console.log("\nNenhuma conta criada ainda. O site cria a primeira quando sobe.\n")
    return
  }
  console.log(`\n${contas.length} conta(s):\n`)
  for (const c of contas) {
    const acesso = c.ultimo_acesso
      ? new Date(c.ultimo_acesso).toLocaleString("pt-BR")
      : "nunca entrou"
    console.log(`  ${c.login.padEnd(18)} ${c.papel.padEnd(10)} ${acesso}`)
  }
  console.log("")
}

try {
  if (comando === "listar") {
    mostrarLista()
  } else if (comando === "criar") {
    const [login, senha, papel = "admin", nome = ""] = argumentos
    if (!login || !senha) throw new Error("Informe o login e a senha")
    const criado = criarUsuario({ login, senha, papel, nome })
    console.log(`\nConta "${criado.login}" criada como ${criado.papel}.\n`)
  } else if (comando === "senha") {
    const [login, nova] = argumentos
    if (!login || !nova) throw new Error("Informe o login e a nova senha")
    alterarSenha(login, nova)
    console.log(`\nSenha da conta "${login}" trocada.\n`)
  } else if (comando === "remover") {
    const [login] = argumentos
    if (!login) throw new Error("Informe o login")
    const removeu = removerUsuario(login)
    console.log(removeu ? `\nConta "${login}" removida.\n` : `\nNão existe a conta "${login}".\n`)
  } else {
    ajuda()
  }
} catch (erro) {
  console.error(`\nErro: ${erro.message}\n`)
  process.exitCode = 1
}
