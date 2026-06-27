# Catana

Plataforma para criar, gerenciar e publicar **catálogos digitais de produtos**,
com um editor visual estilo Figma/Canva no navegador. Cliente de referência:
**DiPACK Embalagens**.

Monorepo git único na raiz, com duas aplicações:

```
catana/
├── catana-back/    # API REST — Django + DRF (Python)
└── catana-front/   # SPA — React 19 + Vite + TypeScript
```

> Detalhes de arquitetura, convenções e armadilhas estão em `CLAUDE.md`.

## Backend (`catana-back/`)

```bash
cd catana-back
cp .env.example .env            # preencha SECRET_KEY (forte) e DATABASE_URL
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # :8000
```

- API: `:8000/api/` · Admin: `:8000/admin` · Swagger: `:8000/api/schema/swagger-ui/`
- Auth (JWT): `POST /api/auth/token/` (login) · `POST /api/register/` (cria usuário + organização/sede)
- Por padrão todos os endpoints exigem autenticação (`IsAuthenticated`); a allowlist
  pública está documentada no topo de `api/views.py`.

Docker:

```bash
cd catana-back && docker-compose up --build
```

## Frontend (`catana-front/`)

```bash
cd catana-front
cp .env.example .env             # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                      # :5173
npm run build                    # tsc -b && vite build
npm run lint
```

## Verificações (CI)

O workflow `.github/workflows/ci.yml` roda em cada push/PR:

- **back**: `manage.py check` + `manage.py test`
- **front**: `tsc -b` + `npm run build` + `eslint`

## Pendências de segurança (operacionais)

- `SECRET_KEY` e a senha do banco vazaram no histórico git (o `.env` foi removido
  do tracking, mas o histórico permanece). Rotacione os segredos e expurgue o
  histórico (BFG / `git filter-repo`) antes de qualquer deploy.
