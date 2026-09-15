const express = require('express');
const db = require('../db/init');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/candidate', requireAuth, requireRole('candidato'), (req, res) => {
  const total = db.prepare('SELECT COUNT(*) n FROM applications WHERE candidato_user_id = ?').get(req.user.id).n;
  const porStatus = db.prepare(`SELECT status, COUNT(*) n FROM applications WHERE candidato_user_id = ? GROUP BY status`).all(req.user.id);
  res.json({ total, porStatus });
});

router.get('/company', requireAuth, requireRole('empresa'), (req, res) => {
  const totalVagas = db.prepare('SELECT COUNT(*) n FROM jobs WHERE empresa_user_id = ?').get(req.user.id).n;
  const totalCandidatos = db.prepare(`
    SELECT COUNT(*) n FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.empresa_user_id = ?`).get(req.user.id).n;
  const contratacoes = db.prepare(`
    SELECT COUNT(*) n FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE j.empresa_user_id = ? AND a.status = 'aprovado'`).get(req.user.id).n;
  const porStatus = db.prepare(`
    SELECT a.status, COUNT(*) n FROM applications a JOIN jobs j ON j.id = a.job_id
    WHERE j.empresa_user_id = ? GROUP BY a.status`).all(req.user.id);
  const porVaga = db.prepare(`
    SELECT j.titulo, COUNT(a.id) n FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.empresa_user_id = ? GROUP BY j.id`).all(req.user.id);
  res.json({ totalVagas, totalCandidatos, contratacoes, porStatus, porVaga });
});

module.exports = router;
