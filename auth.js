const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, nome: user.nome },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', (req, res) => {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha || !['candidato', 'empresa'].includes(role)) {
    return res.status(400).json({ erro: 'Informe nome, e-mail, senha e um perfil válido (candidato ou empresa).' });
  }
  const existente = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existente) return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });

  const hash = bcrypt.hashSync(senha, 10);
  const info = db.prepare('INSERT INTO users (nome, email, senha_hash, role) VALUES (?,?,?,?)').run(nome, email, hash, role);
  if (role === 'candidato') {
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(info.lastInsertRowid);
    for (let i = 0; i < 3; i++) {
      db.prepare('INSERT INTO experiences (user_id, posicao, empresa, cargo, periodo, atividades) VALUES (?,?,?,?,?,?)')
        .run(info.lastInsertRowid, i, '', '', '', '');
    }
  }
  const user = { id: info.lastInsertRowid, nome, email, role };
  return res.status(201).json({ token: signToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  return res.json({
    token: signToken(user),
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
