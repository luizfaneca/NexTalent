# NexTalent — Backend (autenticação + persistência real)

API REST em Node.js/Express com banco SQLite, feita para servir de camada real
de autenticação e dados por trás do protótipo `nextalent.html`.

## O que este backend resolve

- **Senhas com hash (bcrypt)** — nunca salvas em texto puro.
- **Login com token JWT** — cada requisição autenticada precisa do token.
- **Isolamento real de dados** — cada candidato só lê/edita o próprio perfil e
  candidaturas; cada empresa só lê/edita as próprias vagas e o próprio pipeline
  de candidatos (checado no servidor, não apenas na tela).
- **Banco de dados persistente** (SQLite em arquivo — `db/nextalent.db`),
  sobrevive a reinícios do servidor.

## Como rodar localmente

```bash
cd nextalent-backend
cp .env.example .env      # ajuste o JWT_SECRET
npm install
npm start                  # inicia em http://localhost:3001
```

O banco (`db/nextalent.db`) e as tabelas são criados automaticamente na
primeira execução.

## Principais rotas

| Método | Rota                              | Quem acessa        | Descrição                                   |
|--------|------------------------------------|---------------------|----------------------------------------------|
| POST   | /api/auth/register                 | público             | Cria conta (candidato ou empresa)             |
| POST   | /api/auth/login                    | público             | Login, retorna `token`                        |
| GET    | /api/auth/me                       | autenticado         | Dados da sessão atual                          |
| GET    | /api/profile                       | candidato           | Meu cadastro (dados + experiências)            |
| PUT    | /api/profile                       | candidato           | Atualiza dados pessoais/endereço               |
| PUT    | /api/profile/experiences           | candidato           | Atualiza as 3 experiências profissionais       |
| GET    | /api/jobs                          | público             | Lista vagas ativas (filtros por query string)  |
| GET    | /api/jobs/mine                     | empresa             | Vagas da própria empresa (inclui rascunhos)    |
| POST   | /api/jobs                          | empresa             | Publica ou salva rascunho de vaga              |
| PUT    | /api/jobs/:id                      | empresa (dona)      | Atualiza status da vaga                        |
| POST   | /api/applications                  | candidato           | Candidata-se a uma vaga                        |
| GET    | /api/applications/mine             | candidato           | Minhas candidaturas                            |
| GET    | /api/applications/company          | empresa             | Pipeline (kanban) de todas as vagas da empresa |
| PUT    | /api/applications/:id/status       | empresa (dona)      | Move o candidato entre as etapas               |
| GET    | /api/reports/candidate             | candidato           | Indicadores agregados do candidato             |
| GET    | /api/reports/company                | empresa             | Indicadores agregados da empresa               |

Todas as rotas autenticadas exigem o cabeçalho:
`Authorization: Bearer <token recebido no login/cadastro>`

## Conectando ao `nextalent.html`

O `nextalent.html` já vem integrado a esta API (autenticação, perfil, vagas,
candidaturas, kanban e relatórios usam `fetch` para estas rotas, com o token
JWT guardado em memória durante a sessão do navegador).

Para usar em conjunto:

1. Suba o servidor: `npm install && npm start` (roda em `http://localhost:3001`).
2. Abra o `nextalent.html` normalmente no navegador — ele já aponta para
   `http://localhost:3001/api` (constante `API_BASE` no topo do `<script>`).
3. Se for publicar o backend em outro endereço (Render, Railway, VPS etc.),
   edite `API_BASE` no `nextalent.html` para a URL pública da API e ajuste o
   `cors()` em `server.js` para liberar apenas o domínio onde o front-end
   estiver publicado, em vez de todas as origens.

> Observação: os indicadores do painel "ODS 18" no front-end ainda são
> ilustrativos — o backend não coleta autodeclaração étnico-racial. Para
> torná-los reais, adicione um campo opcional de autodeclaração ao cadastro
> do candidato e uma rota de agregação equivalente no backend.

## Próximos passos recomendados para produção

- Trocar SQLite por Postgres/MySQL se houver múltiplos servidores.
- Adicionar upload real de currículo (ex: S3 ou disco + rota de download).
- Adicionar verificação de e-mail e recuperação de senha.
- Adicionar limitação de requisições (rate limiting) nas rotas de login.
