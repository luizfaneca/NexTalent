const express = require('express');
const db = require('../db/init');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile — retorna apenas o perfil do usuário autenticado
router.get('/', requireAuth, requireRole('candidato'), (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const experiences = db.prepare('SELECT * FROM experiences WHERE user_id = ? ORDER BY posicao').all(req.user.id);
  const user = db.prepare('SELECT nome, email FROM users WHERE id = ?').get(req.user.id);
  res.json({ ...user, ...profile, experiences });
});

// PUT /api/profile — atualiza dados pessoais + endereço
router.put('/', requireAuth, requireRole('candidato'), (req, res) => {
  const { telefone, nascimento, estado_civil, endereco, numero, bairro, cidade, curriculo_nome } = req.body;
  db.prepare(`UPDATE profiles SET telefone=?, nascimento=?, estado_civil=?, endereco=?, numero=?, bairro=?, cidade=?, curriculo_nome=?
              WHERE user_id=?`)
    .run(telefone, nascimento, estado_civil, endereco, numero, bairro, cidade, curriculo_nome, req.user.id);
  res.json({ ok: true });
});

// PUT /api/profile/experiences — substitui as 3 experiências do candidato
router.put('/experiences', requireAuth, requireRole('candidato'), (req, res) => {
  const { experiences } = req.body; // array de até 3: {empresa,cargo,periodo,atividades}
  if (!Array.isArray(experiences)) return res.status(400).json({ erro: 'Formato inválido.' });
  const upsert = db.prepare(`UPDATE experiences SET empresa=?, cargo=?, periodo=?, atividades=? WHERE user_id=? AND posicao=?`);
  const tx = db.transaction((list) => {
    list.slice(0, 3).forEach((exp, i) => {
      upsert.run(exp.empresa || '', exp.cargo || '', exp.periodo || '', exp.atividades || '', req.user.id, i);
    });
  });
  tx(experiences);
  res.json({ ok: true });
});

module.exports = router;
