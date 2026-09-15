const express = require('express');
const db = require('../db/init');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs — lista pública de vagas ativas, com filtros opcionais (?q=&local=&regime=&modelo=)
router.get('/', (req, res) => {
  const { q, local, regime, modelo } = req.query;
  let sql = `SELECT j.*, u.nome AS empresa_nome FROM jobs j JOIN users u ON u.id = j.empresa_user_id WHERE j.status = 'ativa'`;
  const params = [];
  if (q) { sql += ` AND (j.titulo LIKE ? OR u.nome LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
  if (local) { sql += ` AND j.endereco LIKE ?`; params.push(`%${local}%`); }
  if (regime) { sql += ` AND j.regime = ?`; params.push(regime); }
  if (modelo) { sql += ` AND j.local_modelo = ?`; params.push(modelo); }
  sql += ' ORDER BY j.criado_em DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/jobs/mine — vagas da empresa autenticada (inclui rascunhos)
router.get('/mine', requireAuth, requireRole('empresa'), (req, res) => {
  res.json(db.prepare('SELECT * FROM jobs WHERE empresa_user_id = ? ORDER BY criado_em DESC').all(req.user.id));
});

// GET /api/jobs/:id — detalhe de uma vaga (público)
router.get('/:id', (req, res) => {
  const job = db.prepare(`SELECT j.*, u.nome AS empresa_nome FROM jobs j JOIN users u ON u.id = j.empresa_user_id WHERE j.id = ?`).get(req.params.id);
  if (!job) return res.status(404).json({ erro: 'Vaga não encontrada.' });
  res.json(job);
});

// POST /api/jobs — cria uma vaga (rascunho ou publicada) — apenas empresas
router.post('/', requireAuth, requireRole('empresa'), (req, res) => {
  const b = req.body;
  if (!b.titulo) return res.status(400).json({ erro: 'Informe o nome da vaga.' });
  const info = db.prepare(`INSERT INTO jobs
    (empresa_user_id, titulo, numero_vagas, regime, jornada, salario, beneficios, descricao, local_modelo,
     responsavel_nome, responsavel_email, responsavel_tel, cnpj, razao_social, nome_fantasia, num_funcionarios, ramo, endereco, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    req.user.id, b.titulo, b.numero_vagas || 1, b.regime, b.jornada, b.salario, b.beneficios, b.descricao, b.local_modelo,
    b.responsavel_nome, b.responsavel_email, b.responsavel_tel, b.cnpj, b.razao_social, b.nome_fantasia,
    b.num_funcionarios, b.ramo, b.endereco, b.status === 'ativa' ? 'ativa' : 'rascunho'
  );
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/jobs/:id — atualiza uma vaga própria (ex: publicar rascunho, encerrar)
router.put('/:id', requireAuth, requireRole('empresa'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ erro: 'Vaga não encontrada.' });
  if (job.empresa_user_id !== req.user.id) return res.status(403).json({ erro: 'Esta vaga não pertence à sua empresa.' });
  const status = req.body.status || job.status;
  db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
