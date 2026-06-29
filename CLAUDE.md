# CLAUDE.md — Catana

Guia operacional para trabalhar neste repositório. Baseado em leitura direta do código (jun/2026).

## O que é

**Catana** é uma plataforma para criar, gerenciar e publicar **catálogos digitais de produtos**, com um editor visual estilo Figma/Canva no navegador. O cliente de referência é a **DiPACK Embalagens** (embalagens PET para confeitaria, açougue, festas e food service) — há um plugin dedicado com templates prontos dessa marca.

Funcionalidades centrais:
- Editor de catálogos drag-and-drop com canvas livre, camadas, snapping, grupos, multi-página e export para PDF.
- Gestão de **produtos**, **categorias** (hierárquicas), **mídias** (com pastas) e **organizações/sedes** (multi-tenant).
- Módulo social: **perfis públicos**, explore/descoberta, follows, likes/saves, mensagens (inbox).
- Multi-tenant em dois níveis: **Organization → Sede** (filial), com compartilhamento de recursos entre sedes.

## Arquitetura (monorepo de 2 apps)

```
catana/
├── catana-back/    # API REST — Django + DRF (Python)    [repo git próprio]
└── catana-front/   # SPA — React 19 + Vite + TS          [repo git próprio]
```
> ✅ **Monorepo git único na raiz.** Os antigos submódulos viraram pastas normais; há um só `.git` em `catana/`. Commits/branches são feitos na raiz e podem tocar os dois apps. Há CI em `.github/workflows/ci.yml` (back: `check` + `test`; front: `build` + `test`; lint não-bloqueante) e um `README.md` de monorepo na raiz.

Fluxo de dados: Front (axios, JWT no `localStorage`) → `http://localhost:8000/api/...` (DRF ViewSets) → PostgreSQL. Mídias servidas de `/media/`.

---

## catana-back (API)

**Stack:** Python 3.11 (Docker) / 3.9+ (local), Django 5.2+, Django REST Framework, PostgreSQL 15, JWT (`djangorestframework-simplejwt`), `drf-spectacular` (Swagger), `django-environ`, Pillow, `django-cors-headers`. Versões **pinadas** em `requirements.txt`.

**Estrutura:**
- `api/models.py` — TODOS os models (não há divisão por módulo). Entidades principais: `Organization`, `Sede`, `SedeSharing`, `User` (AbstractUser custom, `AUTH_USER_MODEL='api.User'`), `MediaFolder`/`Media`, `Category`, `Product`/`ProductMedia`, `Catalog`/`Page`/`Component`/`PageComponent`, `Theme`, `Activity`, `Notification`, `Conversation`/`Message`, `UserPreferences`, e o bloco social (`PublicProfile`, `ProfileFollow`, `ProfileSave`, `CatalogLike`, `CatalogView`, `BlockedUser`).
- `api/views.py` (~1000 linhas) — todos os ViewSets + function-views (`register_user`, `dashboard_stats`, `global_search`, `profile_view`, etc).
- `api/serializers.py`, `api/urls.py` (router DRF), `api/permissions.py` (classes de permissão custom em 2 níveis org/sede).
- `api/migrations/` — 22 migrações; **sempre** rodar `makemigrations` após mexer em models.
- `api/management/commands/` — `seed_public_profiles`, `set_public_flag`.
- `catana_back/settings.py`, `urls.py` — config do projeto. Entrypoint: `manage.py`.
- Raiz: dezenas de **scripts utilitários soltos** (`seed_database.py`, `insert_fake_products.py`, `add_product_images.py`, `fix_media_*.py`, `test_*.py`/`test_*.sh`) — scripts ad-hoc, não são testes automatizados.

**Models — convenções:** quase toda entidade tem `organization` + `sede` (nullable) + `created_by`. Campos flexíveis em `JSONField` (`Product.specs`, `dropshipping_info`, `Component.content`, `Theme.styles`, `Activity.details`). Social usa `db_table` explícito (ex.: `public_profiles`).

### Rodar o backend

**Docker (recomendado):**
```bash
cd catana-back
docker-compose up --build           # sobe db (postgres:15) + web (migrate + runserver :8000)
docker-compose exec web python manage.py createsuperuser
```

**Local (sem Docker):** requer PostgreSQL 15 rodando + `.env` (ver abaixo).
```bash
cd catana-back
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # :8000   (ou ./start_server.sh → :8001/:8002)
```

**Comandos úteis:**
```bash
python manage.py makemigrations && python manage.py migrate
python manage.py test                 # roda testes Django (hoje praticamente vazio)
python manage.py shell
python manage.py seed_public_profiles # seed do módulo social
```

**URLs:** API `:8000/api/` · Admin `:8000/admin` · Swagger `:8000/api/schema/swagger-ui/` · Redoc `.../redoc/`.

**Auth (JWT):** `POST /api/auth/token/` (login) · `POST /api/auth/token/refresh/` · `POST /api/register/`. Header: `Authorization: Bearer <token>`.

**`.env` do backend (`catana-back/.env`):**
```env
SECRET_KEY='...'
DATABASE_URL=psql://root:root@localhost:5432/catana_db   # use @db: no Docker
DEBUG=True
```

---

## catana-front (SPA)

**Stack:** React 19, TypeScript ~5.9, Vite 7, React Router 7, **Zustand** (estado), **Axios**, **Tailwind v4** (`@tailwindcss/postcss`), **Radix UI** + `class-variance-authority` (componentes), `lucide-react`/`react-icons` (ícones), **@dnd-kit** (drag-and-drop), `sonner` (toasts). PDF: `@react-pdf/renderer`, `jspdf`, `html2canvas-pro`, `print-js`. Outros: `@imgly/background-removal` (remover fundo de imagem no client), `qrcode.react`, `xlsx` (import/export Excel).

**Alias:** `@` → `src/` (`vite.config.ts`). **Não há proxy Vite** — o front bate direto na URL absoluta da API.

**Estrutura (`src/`):**
- `pages/` — telas roteadas (`Dashboard`, `CatalogEditor`, `Products`, `MediaLibrary`, `Explore`, `Profile`, `PublicProfile`, `Login`, `Register`, `Inbox`, etc).
- `components/` — UI por domínio: `editor/` (o maior — canvas, toolbars, painéis, `elements/`), `ui/` (design system Radix+CVA), `catalog/`, `media/`, `products/`, `profile/`, `explore/`, `search/`.
- `store/` — Zustand: `editorStore.ts` (**núcleo do editor**, ~930 linhas: páginas, elementos, seleção, histórico/undo de 50 passos, zoom, grid/snap), `authStore.ts`, `componentStore`, `templateStore`, `assetStore`.
- `services/` — 23 clients de API/lógica, um por domínio (`api.ts` = instância axios base; `catalogService`, `productService`, `mediaService`, `pdfExportService`, `geminiService`, `layoutEngine.service`, `catalogIO.service`, etc).
- `contexts/` — React Context para UI (`PanelContext`, `SidebarContext`, `UIContext`, `PluginsContext`).
- `plugins/` — sistema de plugins. `registry.ts` (registry singleton id→componente) + `dipack/` (templates da DiPACK registrados em `registerDiPackPlugin()`, chamado no topo de `App.tsx`).
- `types/` — tipos do domínio (`editor.ts` é o central: `ElementType`, posições, páginas), `catalogIO`, `designTokens`, `layoutRules`, `profile`, `api`.
- `hooks/`, `utils/` (helpers de canvas: snapping, alinhamento, coordenadas, hierarquia), `schemas/catalogSchema.ts`, `lib/products.ts` (catálogo estático de produtos DiPACK usado pelo `ProductModal` via hash da URL).
- Entrypoints: `index.html` → `src/main.tsx` → `src/App.tsx` (define rotas; quase tudo dentro de `<PrivateRoute>`).

### Rodar o frontend
```bash
cd catana-front
npm install
npm run dev        # Vite dev server (default :5173)
npm run build      # tsc -b && vite build
npm run preview
npm run lint       # ESLint (flat config, typescript-eslint + react-hooks)
```
**`.env` do front (`catana-front/.env`, ver `.env.example`):**
```env
VITE_API_BASE_URL=http://localhost:8000
# VITE_PDFSHIFT_API_KEY=...   # opcional, export PDF via PDFShift
```

**Sem testes automatizados no front** (nenhum runner configurado). Lint é a única verificação.

---

## Modelo de Catálogo, Persistência e Aparência (crítico)

Um catálogo tem **duas representações paralelas** — entender isso é essencial antes de mexer no editor.

### 1. No banco (PostgreSQL, relacional) — store canônico
Catálogo = linhas em tabelas, **não** um arquivo. Em `catana-back/api/models.py`:
- `Catalog` (`:205`): `title`, `description`, `cover_image`→Media, **`theme`→Theme**, `organization`, `sede`, `is_public`, `likes`, `saves`. **Não guarda geometria nem elementos.**
- `Page` (`:219`): `catalog`, `order`, `background_image`.
- `PageComponent` (`:235`): geometria (`position_x/y`, `width`, `height`, `layer`) + FK `component`.
- `Component` (`:225`): `component_type` (`text|image|product`), **`content` (JSONField = JSON completo do elemento)**, `is_reusable`.
- `Theme` (`:197`): **`styles` (JSONField)** — aparência global mora em `styles.designTokens`.

Aparência + posições ficam espalhadas em `PageComponent` (geometria) + `Component.content` (JSON) + `Theme.styles.designTokens`.

### 2. No editor (frontend, em memória) — formato de trabalho
`src/store/editorStore.ts` mantém `pages: CatalogPage[]` → `elements: CatalogElement[]` (tipo em `src/types/editor.ts`: ~40 `ElementType`, cada elemento com `position`, `size`, `style`, e dados por tipo `textData`/`productData`/`imageData`…). Exporta/importa um **JSON schema v1.0** (`app:'Catana'`) via `src/services/catalogIO.service.ts`.

### ✅ O round-trip funciona (save relacional implementado — INC-01)
- **Carregar do backend funciona:** `src/services/catalogLoader.service.ts` reconstrói `Page → PageComponent → Component.content` em elementos do editor e lê `Theme.styles.designTokens`.
- **Salvar o conteúdo do editor também funciona:** `catalogService.saveCatalogContent(id, pages)` faz `POST /api/catalogs/{id}/save_content/`. A action no `CatalogViewSet` recria `Page/Component/PageComponent` numa **transação**, de forma **idempotente e sem órfãos**. O botão "Salvar" do `FigmaHeader` dispara esse save (além do `downloadCatalogJSON`/export PDF, que continuam).
- Os viewsets CRUD genéricos de `Page/Component/PageComponent` existem em `urls.py`, mas a persistência do editor passa pela action transacional acima (não por chamadas CRUD avulsas).

### Aparência: 3 camadas
1. **Por elemento:** cada elemento tem `style` + `textData` (fontFamily, fontSize, color…). Customização manual, elemento a elemento, no PropertiesPanel.
2. **Design Tokens globais (conectado — INC-06):** sistema em `src/types/designTokens.ts` (`colors`/`typography`/`spacing`/`borderRadius`/`shadows` + `DEFAULT_DESIGN_TOKENS`). O store **começa com `DEFAULT_DESIGN_TOKENS`** e há **painel de tema** (`DesignTokensPanel`, botão 🎨 no `FigmaHeader`): paleta, tipografia, presets de um clique e "Aplicar tema aos elementos" (`applyThemeToElements` troca cores/fontes literais por referências `$tokens.*`). O `ElementRenderer` **resolve `$tokens.*`** ao vivo via `utils/themeResolve.ts` (sobre o resolvedor de `types/designTokens.ts`), então editar o tema atualiza tudo na hora.
3. **Templates (plugin DiPACK):** componentes React **hardcoded** em `src/plugins/dipack/templates/`, visual fixo da marca, **ainda não parametrizável** por token. Inserir template = inserir um bloco fixo.

**Resumo:** o "tema global de um clique" (paleta + tipografia) está exposto ao usuário e ligado ao renderer. Falta só parametrizar os templates DiPACK por tokens.

---

## Catálogo de Demonstração (marketing)

Feature para gerar, com um clique, um **catálogo demonstração** temático de empresa fictícia (um por ramo) — peça pronta pra divulgação. Tudo **local, síncrono, sem API externa**.

**Onde fica (backend, `catana-back/`):**
- `api/demo/themes.py` — registro dos **6 temas** (`padaria, acougue, mercado, restaurante, festas, boutique`) com `paleta` + `fontes` concretas.
- `api/demo/generator.py` — `gerar_catalogo_demo(tema, manifest_path, estrutura, secoes, b2b, periodo, identidade_premium=True)`. Escreve **direto no banco** (`Organization/Sede/Category/Product/ProductMedia/Media/Catalog/Page/Component/PageComponent`), espelhando o que o `catalogLoader.service.ts` consome: **geometria no `PageComponent`**, **estilo baked (literal) no `Component.content`** (NÃO usa design tokens globais). Compõe páginas com `shape-rectangle`/`text-*`/`image` (evita `product-card`, que renderiza placeholder). Imagens gravadas como URL **relativa `/media/...`** (o front prefixa). **Idempotente** via delete-cascade da `Organization` demo.
- `api/demo/identidade.py` + `api/demo/logo.py` — **camada premium** (ver abaixo).
- Command: `python manage.py gerar_catalogo_demo --tema padaria [--estrutura completo|essencial|custom --secoes ...] [--b2b] [--periodo "..."] [--sem-premium]`.
- Endpoint: `POST /api/catalogs/gerar-demo/` (**AllowAny**), payload `{ tema, estrutura?, secoes?, b2b?, periodo?, identidade_premium? }` → `{ catalog_id, title, pages }`.
- `Catalog.is_demo` (migration 0023) marca os demos (badge/filtro/limpeza).
- Assets: **`catana-back/demo_assets/<tema>/`** (`manifest.json` + `images/`). Imagens hoje são **PLACEHOLDER** (Pillow) — substituir pelas curadas mantendo os nomes. Schema do manifest documentado em `demo_assets/README.md`.

**Identidade Visual Premium (`identidade_premium=True`, default):** camada de marca **ortogonal à estrutura**. `identidade.py` computa **um** objeto de identidade por catálogo (paleta completa, tipografia display/heading/body, tokens, motivo) com contraste texto/fundo garantido. `logo.py` gera (Pillow, **PNG transparente** salvo como `Media`) monograma, wordmark e faixa de **motivo** por tema. O gerador aplica: capa "designed" (hero + motivo + wordmark + acento), **cabeçalho/rodapé de marca** com número de página em toda página de conteúdo, **divisores full-bleed** com motivo, cards coesos (raio/sombra-simulada/preço em acento) e contracapa com CTA + logo. Sem premium → catálogo temático limpo base.

**Front:** página `UserCatalogs` tem o botão **"Criar catálogo demonstração"** + badge **DEMO**; `GerarDemoModal` (6 personas, estrutura, B2B, checkbox **"Identidade visual premium (showcase)"** marcada por padrão) chama `catalogService.gerarDemo` e navega pro editor. O `catalogLoader` mapeia `imageUrl` (fallback do PDF) e prefixa `/media/` com `VITE_API_BASE_URL` (`absMedia`), pra a imagem/logo renderizar **no canvas e no PDF**.

> ⚠️ **PDF/imagens:** o logo e as fotos exportam no PDF via o fallback `<img src={imageUrl} crossOrigin="anonymous">` do `ElementRenderer` (PDF usa html2canvas sobre o DOM). Em dev (CORS liberado) funciona; valide em prod se mexer no serving de `/media/`.

---

## Convenções

- **Idioma:** código/comentários e UI em **português** (commits também). Identificadores de código em inglês/português misturados.
- **Backend:** um app `api` monolítico; ViewSets DRF + router; permissões custom em `permissions.py` (aplicadas em org/sede); **paginação global de 24/página** (`DEFAULT_PAGINATION_CLASS` + `PAGE_SIZE` no `REST_FRAMEWORK`).
- **Frontend:** componentes funcionais + hooks; estado global em Zustand (não Redux); estilização Tailwind utility-first; imports via alias `@/`.
- **Branches/commits:** sem convenção estrita (histórico tem mensagens como "a lot of changes"). Branch principal: `main` em ambos os repos.

---

## Armadilhas e cuidados ⚠️

1. **Segredos no histórico:** o `.env` do back **foi removido do tracking** (agora há `.gitignore` no back + `.env.example`); o `.env` do front nunca esteve versionado. **Mas** o `SECRET_KEY` e a senha `root/root` antigos **continuam no histórico git** — `TODO(humano)`: rotacionar e expurgar (BFG/`git filter-repo`) antes de deploy.
2. **Autenticação ligada (SEG-02/03):** o padrão global é `IsAuthenticated` (`REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`). A allowlist de públicos está documentada no topo de `api/views.py` (registro, login, refresh, explore, leituras de descoberta). Os fallbacks de "primeiro superuser" foram removidos e `permissions.py` está **aplicado** (`IsOrganizationAdmin` em org, `CanCreateSede` em sede). O `<PrivateRoute>` do front é só UX; o gate real é o backend.
3. **CORS e hosts por env (SEG-04):** `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS` vêm de env, com default restrito quando `DEBUG=False`; `CORS_ALLOW_ALL_ORIGINS` só liga em dev. Hardening de SSL/HSTS/cookies em `settings.py` sob `if not DEBUG`.
4. **Base URL central (FRG-04):** `authStore.ts` e `catalogLoader.service.ts` agora respeitam `VITE_API_BASE_URL` (via `services/api.ts`). O 401 no interceptor de `api.ts` limpa a sessão e redireciona para `/login`. JWT ainda em `localStorage` — `TODO(arquitetura)` avaliar cookie HttpOnly.
5. **Registro (FRG-05):** `register_user` provisiona `Organization` + `Sede` padrão e retorna ambos, alinhado ao que `authStore.register()` consome. Os arquivos `views_register_temp.py`/`authService.register()` mortos foram removidos.
6. **Build do front OK (FRG-01):** `npm run build` (`tsc -b && vite build`) passa limpo. Alias `@` configurado em `tsconfig.app.json` + `src/vite-env.d.ts`. IDs do editor usam `crypto.randomUUID()` (`utils/id.ts`); `console.log` gated por `import.meta.env.DEV`.
7. **`editorStore.ts`** segue sendo o arquivo mais crítico do front — testar undo/redo, multi-página e seleção ao mexer (há testes em `editorStore.test.ts`).
8. **Scripts utilitários do backend** foram movidos para `catana-back/scripts/` (com README). Rodam direto contra o banco — ler antes de executar.
9. **Testes (DIV-04):** `api/tests.py` cobre auth, save_content e bulk_import (`manage.py test`); o front tem Vitest (`npm test`, `editorStore.test.ts`). Os `test_*` em `scripts/` continuam sendo chamadas manuais, não automatizadas.

---

## Arquivos para entender rápido

| Para entender… | Olhe |
|---|---|
| Domínio/dados (backend) | `catana-back/api/models.py` |
| Rotas da API | `catana-back/api/urls.py` + Swagger em `/api/schema/swagger-ui/` |
| Lógica/permissões backend | `catana-back/api/views.py`, `api/permissions.py` |
| Rotas e bootstrap do front | `catana-front/src/App.tsx`, `src/main.tsx` |
| Núcleo do editor | `catana-front/src/store/editorStore.ts`, `src/types/editor.ts`, `components/editor/` |
| Cliente HTTP / JWT | `catana-front/src/services/api.ts`, `src/store/authStore.ts` |
| Plugin DiPACK (templates) | `catana-front/src/plugins/dipack/`, `src/plugins/registry.ts` |
| Docs específicas | vários `*.md` soltos (ex.: `BULK_IMPORT_USAGE.md`, `PUBLIC_PROFILES_*.md`, `CATALOG_IMPORT_EXPORT.md`) |
