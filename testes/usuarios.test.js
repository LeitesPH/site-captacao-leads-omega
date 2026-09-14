/**
 * Contas de acesso: o que mais importa aqui e garantir que a senha
 * nunca fica legivel em lugar nenhum.
 */
import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const pastaTemporaria = fs.mkdtempSync(path.join(os.tmpdir(), "contas-teste-"))
process.env.PASTA_DADOS = pastaTemporaria

const {
  alterarSenha,
  autenticar,
  buscarUsuario,
  conferirSenha,
  criarHash,
  criarUsuario,
  listarUsuarios,
  removerUsuario,
  garantirContaInicial,
} = await import("../src/usuarios.js")

before(() => {
  criarUsuario({ login: "maria", senha: "senha-forte-1", nome: "Maria", papel: "admin" })
  criarUsuario({ login: "joao", senha: "senha-forte-2", papel: "vendedor" })
})

after(() => {
  fs.rmSync(pastaTemporaria, { recursive: true, force: true })
})

test("a senha nunca aparece em texto no arquivo gravado", () => {
  const bruto = fs.readFileSync(path.join(pastaTemporaria, "usuarios.json"), "utf8")
  assert.ok(!bruto.includes("senha-forte-1"))
  assert.ok(!bruto.includes("senha-forte-2"))
  assert.ok(bruto.includes("scrypt$"))
})

test("a mesma senha gera hashes diferentes (sal aleatorio)", () => {
  const a = criarHash("mesma-senha")
  const b = criarHash("mesma-senha")
  assert.notEqual(a, b)
  assert.ok(conferirSenha("mesma-senha", a))
  assert.ok(conferirSenha("mesma-senha", b))
})

test("hash quebrado ou vazio nunca valida", () => {
  assert.equal(conferirSenha("x", ""), false)
  assert.equal(conferirSenha("x", "qualquer-coisa"), false)
  assert.equal(conferirSenha("x", "scrypt$zz$zz"), false)
  assert.equal(conferirSenha("x", undefined), false)
})

test("autenticar aceita a senha certa e recusa a errada", () => {
  assert.equal(autenticar("maria", "senha-forte-1").login, "maria")
  assert.equal(autenticar("maria", "senha-forte-2"), null)
  assert.equal(autenticar("naoexiste", "seja-la-o-que-for"), null)
})

test("login e tratado sem espacos e sem diferenciar maiusculas", () => {
  assert.equal(autenticar("  MARIA  ", "senha-forte-1").login, "maria")
})

test("o que sai para a tela nunca leva o hash da senha", () => {
  const daLista = listarUsuarios().find((u) => u.login === "maria")
  assert.equal(daLista.senha_hash, undefined)
  assert.equal(autenticar("maria", "senha-forte-1").senha_hash, undefined)
  // o hash continua existindo internamente
  assert.ok(buscarUsuario("maria").senha_hash.startsWith("scrypt$"))
})

test("autenticar registra o ultimo acesso", () => {
  autenticar("joao", "senha-forte-2")
  assert.ok(buscarUsuario("joao").ultimo_acesso)
})

test("nao aceita login repetido nem senha curta nem papel inventado", () => {
  assert.throws(() => criarUsuario({ login: "maria", senha: "outra-senha" }), /Ja existe/)
  assert.throws(() => criarUsuario({ login: "novo", senha: "123" }), /pelo menos 6/)
  assert.throws(() => criarUsuario({ login: "novo", senha: "senha-boa", papel: "chefe" }), /Papel/)
  assert.throws(() => criarUsuario({ login: "a b", senha: "senha-boa" }), /login deve ter/)
})

test("trocar a senha invalida a anterior", () => {
  alterarSenha("joao", "senha-nova-9")
  assert.equal(autenticar("joao", "senha-forte-2"), null)
  assert.equal(autenticar("joao", "senha-nova-9").login, "joao")
})

test("remover conta tira o acesso, mas nao deixa ficar sem nenhuma", () => {
  criarUsuario({ login: "temporario", senha: "senha-temp-1" })
  assert.equal(removerUsuario("temporario"), true)
  assert.equal(autenticar("temporario", "senha-temp-1"), null)
  assert.equal(removerUsuario("nao-existe"), false)
})

test("a conta inicial so e criada quando nao existe nenhuma", () => {
  assert.equal(garantirContaInicial(), null)
})
