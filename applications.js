const express = require('express');
const db = require('./init');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/applications — candidato se candidata a uma vaga
router.post('/', requireAuth, requireRole('candidato'), (req, res) => {
  const { job_id } = req.body;
  const job = db.prepare(`SELECT * FROM jobs WHERE id = ? AND status = 'ativa'`).get(job_id);
  if (!job) return res.status(404).json({ erro: 'Vaga não encontrada ou não está mais ativa.' });
  try {
    const info = db.prepare('INSERT INTO applications (job_id, candidato_user_id) VALUES (?,?)').run(job_id, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ erro: 'Você já se candidatou a esta vaga.' });
  }
});

// GET /api/applications/mine — candidaturas do candidato autenticado
router.get('/mine', requireAuth, requireRole('candidato'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, j.titulo AS vaga_titulo, u.nome AS empresa_nome
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = j.empresa_user_id
    WHERE a.candidato_user_id = ?
    ORDER BY a.criado_em DESC`).all(req.user.id);
  res.json(rows);
});

// GET /api/applications/company — pipeline de candidatos de todas as vagas da empresa autenticada
router.get('/company', requireAuth, requireRole('empresa'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, j.titulo AS vaga_titulo, u.nome AS candidato_nome, u.email AS candidato_email,
           p.cidade AS candidato_cidade
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = a.candidato_user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE j.empresa_user_id = ?
    ORDER BY a.criado_em DESC`).all(req.user.id);
  res.json(rows);
});

// PUT /api/applications/:id/status — empresa move o candidato entre as etapas (kanban)
router.put('/:id/status', requireAuth, requireRole('empresa'), (req, res) => {
  const { status } = req.body;
  const valid = ['novo', 'analise', 'entrevista', 'aprovado', 'reprovado', 'encerrado'];
  if (!valid.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

  const app = db.prepare(`
    SELECT a.*, j.empresa_user_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`).get(req.params.id);
  if (!app) return res.status(404).json({ erro: 'Candidatura não encontrada.' });
  if (app.empresa_user_id !== req.user.id) return res.status(403).json({ erro: 'Esta candidatura não pertence a uma vaga da sua empresa.' });

  db.prepare(`UPDATE applications SET status = ?, atualizado_em = datetime('now') WHERE id = ?`).run(status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
