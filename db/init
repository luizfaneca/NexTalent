const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'nextalent.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('candidato','empresa')),
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  telefone TEXT, nascimento TEXT, estado_civil TEXT,
  endereco TEXT, numero TEXT, bairro TEXT, cidade TEXT,
  curriculo_nome TEXT
);

CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL,
  empresa TEXT, cargo TEXT, periodo TEXT, atividades TEXT
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  numero_vagas INTEGER DEFAULT 1,
  regime TEXT, jornada TEXT, salario TEXT, beneficios TEXT, descricao TEXT,
  local_modelo TEXT,
  responsavel_nome TEXT, responsavel_email TEXT, responsavel_tel TEXT,
  cnpj TEXT, razao_social TEXT, nome_fantasia TEXT, num_funcionarios TEXT, ramo TEXT, endereco TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK(status IN ('rascunho','ativa','encerrada')),
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidato_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'novo' CHECK(status IN ('novo','analise','entrevista','aprovado','reprovado','encerrado')),
  criado_em TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, candidato_user_id)
);
`);

module.exports = db;
