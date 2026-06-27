# VISTORIA TÉCNICA — Monorepo Catana

> Auditoria de **leitura** (nada foi corrigido). Cada achado cita `arquivo:linha`.
> Data: 2026-06-27 · Branch: `claude/catana-monorepo-audit-iw50nm` · Commit base: `14d2ddb`.
> Método: leitura direta do código + verificações automáticas (build, lint, `manage.py check`, `npm audit`, greps). Toolchain instalado só para diagnóstico (Django + deps via pip; `node_modules` via npm).

---

## 1. Sumário executivo

O monorepo **agora é um único repositório git** na raiz (os submódulos viraram pastas normais — commit `14d2ddb`), contrariando o `CLAUDE.md`, que ainda descreve dois repos independentes. O backend Django passa em `manage.py check` e suas migrações estão coerentes com os models, mas a **segurança está efetivamente desligada** e o **frontend não compila** (`npm run build` falha com 379 erros de `tsc`).

Estado geral: **protótipo funcional em dev, longe de produção**. Há três buracos estruturais: (a) o **save relacional do editor não existe no front** — só dá para baixar JSON; (b) **todo o módulo social/mensagens/notificações tem model+serializer no backend mas nenhuma rota** — o front chama ~45 endpoints que retornam 404; (c) o **build do front está quebrado** por configuração de alias/tipos.

**Contagem de achados:** Crítico **6** · Alto **9** · Médio **10** · Baixo **6** (31 no total).

**Os 5 riscos a resolver primeiro:**
1. **SEG-01** — `catana-back/.env` versionado com `SECRET_KEY` e senha de banco `root/root` expostos.
2. **SEG-02/SEG-03** — Auth desligada: `AllowAny` em tudo + sem `DEFAULT_PERMISSION_CLASSES` + fallback que vira "primeiro superuser"; `permissions.py` (192 linhas) **nunca é importado**.
3. **FRG-01** — `npm run build` quebrado (379 erros tsc): alias `@` sem `paths`, sem `vite-env.d.ts`, tipos divergentes. Sem build, não há deploy do front.
4. **INC-01** — Persistência do editor inexistente no front (perda de trabalho ao recarregar; só exporta JSON/PDF).
5. **INC-02** — Módulo social/mensagens/notificações sem backend: páginas `PublicProfile`, `Inbox` e o sino de notificações chamam endpoints que não existem.

---

## 2. Tabela priorizada

| ID | Título | Categoria | Severidade | Evidência | Esforço |
|---|---|---|---|---|---|
| SEG-01 | `.env` do back versionado com `SECRET_KEY` + `root/root` | segurança | Crítico | `catana-back/.env:1-3` | baixo |
| SEG-02 | Auth efetivamente desligada (`AllowAny` + sem default + fallback superuser) | segurança | Crítico | `views.py:57,71-80`; `settings.py:123-127` | alto |
| SEG-03 | `permissions.py` nunca importado (gate de acesso morto) | segurança | Alto | `api/permissions.py` (0 imports) | médio |
| SEG-04 | `CORS_ALLOW_ALL_ORIGINS=True` + `ALLOWED_HOSTS=['*']` hardcoded | segurança | Alto | `settings.py:24,27` | baixo |
| SEG-05 | `check --deploy`: DEBUG/SSL/HSTS/cookies inseguros | segurança | Médio | saída `manage.py check --deploy` | médio |
| SEG-06 | JWT em `localStorage` (roubo via XSS) | segurança | Médio | `api.ts`, `authStore.ts` | médio |
| INC-01 | Save relacional do editor inexistente no front | incompleto | Crítico | `catalogService.ts` (só metadados); `catalogLoader.service.ts` (só GET) | alto |
| INC-02 | Módulo social/mensagens/notificações sem rotas no back | incompleto | Crítico | `urls.py:15-31`; `views.py` (sem viewsets) | alto |
| INC-03 | Inbox/mensagens quebrado (chatService → 404) | incompleto | Alto | `chatService.ts:9-54`; `pages/Inbox.tsx` | médio |
| INC-04 | Notificações quebrado (notificationService → 404) | incompleto | Alto | `notificationService.ts:17-41` | médio |
| INC-05 | Bulk import sem endpoint + inconsistência interna no front | incompleto | Alto | `productService.ts:223`; `ImportProductsModal.tsx:309,327` | médio |
| INC-06 | Design tokens desconectados da UI e do renderer | incompleto | Médio | `editorStore.ts:37`; `ElementRenderer.tsx` | alto |
| INC-07 | drf-spectacular: geração de schema quebrada (E001) | incompleto | Médio | `ActivityViewSet`; `check --deploy` | baixo |
| FRG-01 | `npm run build` falha (379 erros tsc) | fragilidade | Crítico | `tsconfig.app.json` (sem `paths`); sem `vite-env.d.ts` | médio |
| FRG-02 | Lint: 428 problemas (382 erros, 46 warnings) | fragilidade | Médio | saída `eslint .` | médio |
| FRG-03 | `ElementRenderer.tsx:420` chama `removeElement()` inexistente | fragilidade | Alto | `ElementRenderer.tsx:420` vs `editorStore.ts:187` | baixo |
| FRG-04 | `authStore.ts` ignora `VITE_API_BASE_URL`; loader hardcoded | fragilidade | Médio | `authStore.ts:5`; `catalogLoader.service.ts:62,78,97,124,227` | baixo |
| FRG-05 | Registro inconsistente (resposta e endpoint divergentes) | fragilidade | Médio | `views.py:796-800`; `authStore.ts`; `authService.ts:40` | baixo |
| FRG-06 | IDs por `Date.now()` + 146 `console.log` (14 no editorStore) | fragilidade | Médio | `editorStore.ts:10` etc. | baixo |
| FRG-07 | `npm audit`: 22 vulns (2 críticas, 12 altas); `xlsx` sem fix | fragilidade | Alto | saída `npm audit` | médio |
| FRG-08 | `MediaFolderViewSet` pode estourar 500 com usuário anônimo | fragilidade | Baixo | `views.py:99-101` | baixo |
| DIV-01 | Arquivos órfãos/backup no repo | dívida | Baixo | ver DIV-01 | baixo |
| DIV-02 | ~85 MB de PDFs + xlsx versionados | dívida | Médio | `git ls-files` (PDFs) | baixo |
| DIV-03 | `requirements.txt` sem versões pinadas | correção | Médio | `catana-back/requirements.txt` | baixo |
| DIV-04 | Sem testes automatizados (back e front) | dívida | Médio | `api/tests.py` (vazio) | alto |
| DIV-05 | Sem CI/CD, sem tooling de raiz, README vazio | dívida | Médio | raiz (sem `.github/`, `Makefile`) | médio |
| DIV-06 | Scripts ad-hoc na raiz do back tocam o banco | dívida | Baixo | `seed_*.py`, `fix_*.py`, etc. | baixo |
| DIV-07 | `JSONField` sem schema/validação | fragilidade | Médio | `models.py:159,160,199,228,260` | médio |
| DIV-08 | `views.py` (1008) e `models.py` (505) monolíticos | dívida | Baixo | `api/views.py`, `api/models.py` | alto |
| COR-01 | Sem `.gitignore` no back; `.DS_Store`/`files.zip` versionados | correção | Baixo | `catana-back/` | baixo |
| COR-02 | Código morto/duplicado em `views.py` (stats) | correção | Baixo | `views.py:306+` (a confirmar) | baixo |
| COR-03 | Pagination não é global (definida por viewset) | correção | Baixo | `settings.py:123-127`; `views.py:25` | baixo |

---

## 3. Achados detalhados

### 3.A — SEGURANÇA (subseção destacada)

#### [SEG-01] `.env` do backend versionado com segredos reais
- segurança · **Crítico** · esforço baixo
- Evidência: `catana-back/.env:1-3`
  ```
  SECRET_KEY='django-insecure-n_p*6sd!p&3=t!^v=8qou&%h!w85y0v#7xnxj9)vn&r2x=@%^q'
  DATABASE_URL=psql://root:root@localhost:5432/catana_db
  DEBUG=True
  ```
  Não há `.gitignore` em `catana-back/` (`ls catana-back/.gitignore` → não existe), então o arquivo está rastreado (`git ls-files | grep catana-back/.env`).
- O que é: a chave secreta do Django e a credencial do banco estão no histórico do git.
- Impacto: qualquer um com acesso ao repo pode forjar sessões/tokens, assinar cookies, e (se a rede permitir) acessar o banco. `SECRET_KEY` comprometido quebra toda a criptografia de sessão/JWT-assinatura derivada.
- Causa provável: `.env` commitado no setup inicial; sem `.gitignore` no back.
- Correção sugerida: (1) **rotacionar** `SECRET_KEY` e a senha do banco; (2) remover `.env` do tracking (`git rm --cached`) e adicionar `.gitignore`; (3) idealmente expurgar do histórico (BFG/`git filter-repo`); (4) manter só `.env.example`. **Decisão do dono** (ver §5).
- Confiança: **alta**.

> ℹ️ **Discrepância com CLAUDE.md:** o doc diz que o `.env` do **front** também está versionado. **Não está mais** — `catana-front/.env` não existe em disco nem é rastreado; só há `catana-front/.env.example` (e o `.gitignore` do front lista `.env`). O problema hoje é só no **back**.

#### [SEG-02] Autenticação efetivamente desligada no backend
- segurança · **Crítico** · esforço alto
- Evidência:
  - `settings.py:123-127` — `REST_FRAMEWORK` define **só** `DEFAULT_AUTHENTICATION_CLASSES` (JWT). **Não há** `DEFAULT_PERMISSION_CLASSES`, então o default do DRF é `AllowAny`.
  - `views.py` — `permission_classes = [permissions.AllowAny]` em 11 pontos (ex.: `:57, :85, :91, :133, :253, :881`).
  - Fallbacks de dev que assumem identidade de superuser: `OrganizationViewSet.perform_create` (`views.py:71-80` → `User.objects.filter(is_superuser=True).first()`), `MediaFolderViewSet.perform_create` (`views.py:113-128`).
- O que é: requisições não autenticadas conseguem listar/criar recursos; quando não há usuário, o sistema atribui o primeiro superuser como autor/dono.
- Impacto: sem autenticação real, qualquer cliente cria organizações, produtos, catálogos e mídia em nome do superuser. O único "gate" hoje é o `<PrivateRoute>` no front, que é puramente cosmético (a API não exige token).
- Causa provável: atalhos de desenvolvimento que nunca foram revertidos.
- Correção sugerida: definir `DEFAULT_PERMISSION_CLASSES=[IsAuthenticated]` globalmente; remover os fallbacks de superuser; aplicar as classes de `permissions.py` (ver SEG-03) onde fizer sentido; manter `AllowAny` apenas em endpoints públicos explícitos (registro, login, explore público). **Decisão de política — ver §5.**
- Confiança: **alta**.

#### [SEG-03] `permissions.py` (192 linhas) nunca é importado — gate de acesso morto
- segurança · **Alto** · esforço médio
- Evidência: `grep -rn` por `IsOrganizationAdmin|IsSedeEditor|CanCreateSede|IsSedeMember|CanViewResource|from .permissions` em `api/` retorna **zero** ocorrências fora da própria `permissions.py`.
- O que é: existe um sistema de permissões em dois níveis (org/sede) completo e bem escrito, porém **desconectado** — nenhuma view o usa.
- Impacto: dá falsa sensação de segurança (o arquivo existe e parece sério) enquanto o acesso real é `AllowAny`. Toda a lógica de `SedeSharing`/org/sede em `CanViewResource` está inerte.
- Causa provável: implementado e nunca plugado.
- Correção sugerida: aplicar as classes nos viewsets (por `permission_classes` ou `get_permissions`) junto com SEG-02; testar leitura/escrita por papel.
- Confiança: **alta**.

#### [SEG-04] `CORS_ALLOW_ALL_ORIGINS=True` e `ALLOWED_HOSTS=['*']` hardcoded
- segurança · **Alto** · esforço baixo
- Evidência: `settings.py:24` (`ALLOWED_HOSTS = ['*']`), `settings.py:27` (`CORS_ALLOW_ALL_ORIGINS = True`). Ambos com comentário "desenvolvimento", mas **fixos no código**, não por env.
- Impacto: em produção, aceita requisições de qualquer host/origem — facilita CSRF/abuso entre origens e host-header attacks.
- Correção sugerida: ler de env (`ALLOWED_HOSTS=env.list(...)`, `CORS_ALLOWED_ORIGINS=env.list(...)`), com defaults restritos quando `DEBUG=False`.
- Confiança: **alta**.

#### [SEG-05] `manage.py check --deploy`: 7 alertas de produção
- segurança · **Médio** · esforço médio
- Evidência (saída real de `check --deploy`): `security.W004` (sem HSTS), `W008` (sem `SECURE_SSL_REDIRECT`), `W009` (`SECRET_KEY` fraca/`django-insecure-`), `W012` (`SESSION_COOKIE_SECURE` off), `W016` (`CSRF_COOKIE_SECURE` off), `W018` (`DEBUG=True`).
- Impacto: cookies trafegáveis em claro, sem redirect HTTPS, debug vazando stack traces.
- Correção sugerida: bloco de settings condicionado a `not DEBUG` com SSL/HSTS/cookies seguros.
- Confiança: **alta**.

#### [SEG-06] JWT no `localStorage`
- segurança · **Médio** · esforço médio
- Evidência: tokens lidos/escritos via `localStorage` em `services/api.ts` (interceptors) e `store/authStore.ts`.
- Impacto: qualquer XSS no SPA rouba o token. Combinado com a quantidade de `any`/dependências vulneráveis (FRG-07), o risco de XSS não é desprezível.
- Correção sugerida: avaliar cookies `HttpOnly`/`SameSite` para refresh, ou ao menos endurecer CSP e sanitização. **Trade-off de arquitetura — ver §5.**
- Confiança: **média** (impacto depende de existir XSS explorável).

---

### 3.B — FUNCIONALIDADES INCOMPLETAS

#### [INC-01] Save relacional do editor não existe no front (round-trip quebrado)
- incompleto · **Crítico** · esforço alto
- Evidência:
  - `services/catalogService.ts` — só `POST`/`PATCH` de **metadados** do `Catalog` (`title`, `description`, `is_public`…). Nenhuma chamada grava `Page`/`PageComponent`/`Component`.
  - `services/catalogLoader.service.ts:62,78,97,124,227` — **só `GET`** (`/pages/`, `/page-components/`, `/components/`, `/themes/`). Carrega, nunca salva.
  - "Salvar" real do conteúdo = baixar JSON: `catalogIO.service.ts` (`downloadCatalogJSON`) ou exportar PDF.
  - ⚠️ **Correção factual ao CLAUDE.md:** o **backend tem** os endpoints CRUD — `PageViewSet` (`views.py:558`), `ComponentViewSet` (`:562`), `PageComponentViewSet` (`:584`) estão registrados em `urls.py:27-29`. O gap é **100% no front**: falta a orquestração que serializa `pages/elements` do `editorStore` e faz `POST/PATCH` nesses endpoints.
- Impacto: trabalho do editor é **efêmero** — recarregar a página perde tudo que não foi exportado. Um catálogo só "volta" do banco se as tabelas foram populadas por seed/script externo.
- Causa provável: priorizou-se carregar/exibir; a escrita ficou para depois.
- Correção sugerida (sem implementar agora): criar `saveCatalogContent(catalogId)` que (1) faz diff de páginas/elementos contra o estado carregado, (2) cria/atualiza `Component.content` (JSON do elemento), (3) cria/atualiza `PageComponent` (geometria) e `Page` (ordem/bg), (4) lida com deleções. Considerar um endpoint de "bulk save" transacional no back para evitar N+1 e estados parciais (decisão de arquitetura — §5).
- Confiança: **alta**.

#### [INC-02] Módulo social/mensagens/notificações: models e serializers existem, rotas não
- incompleto · **Crítico** · esforço alto
- Evidência:
  - Models presentes: `Notification` (`models.py:111`), `Conversation` (`:291`), `Message` (`:318`), `PublicProfile` (`:335`), `ProfileFollow` (`:411`), `ProfileSave` (`:431`), `CatalogLike` (`:450`), `CatalogView` (`:469`), `BlockedUser` (`:490`).
  - `urls.py:15-31` registra viewsets apenas para users/orgs/sedes/sede-shares/categories/products/explore/media-folders/media/themes/catalogs/pages/components/page-components/comments/activities. **Nenhum** para os models sociais.
  - `views.py` — a listagem de classes/funções confirma **nenhum** viewset para `Conversation/Message/Notification/PublicProfile/Follow/Save/Block`. Só há `@action` de `like`/`toggle_save` em `ProductViewSet` (`:226,:238`) e `CatalogViewSet` (`:534,:546`), e `global_search` (`:900`) que lê `PublicProfile`.
  - O front chama ~45 endpoints inexistentes — `publicProfileService.ts` (≈28 chamadas a `/api/public-profiles/*` e `/api/public-catalogs/*`), `chatService.ts:9-54` (`/api/conversations/*`), `notificationService.ts:17-41` (`/api/notifications/*`).
- Impacto: páginas `PublicProfile`, `Explore`, `Inbox` e o sino de notificações no header **chamam endpoints que retornam 404**. O `notificationService` tem fallback para `unread_count` (não quebra a tela), mas os demais falham.
- Causa provável: front e specs (`PUBLIC_PROFILES_BACKEND_SPEC.md`, serializers) foram adiantados; os viewsets/rotas do back nunca entraram.
- Correção sugerida: implementar os viewsets + rotas conforme `serializers.py` (que já tem `PublicProfileSerializer`, `ConversationSerializer`, `NotificationSerializer`, etc.) e os specs `.md`. Priorizar por uso: notificações → perfis públicos → mensagens.
- Confiança: **alta**.

#### [INC-03] Inbox/mensagens quebrado de ponta a ponta
- incompleto · **Alto** · esforço médio
- Evidência: `chatService.ts:9,20,28,36,44,54` chamam `/api/conversations/...`; não há rota nem viewset (ver INC-02). Página `pages/Inbox.tsx` consome esse service.
- Impacto: a tela de mensagens monta, mas toda operação de rede 404a.
- Correção: subordinada a INC-02 (implementar `ConversationViewSet`/`MessageViewSet` + rotas com `@action` `start/`, `message/`, `mark_read/`, `unread_count/`).
- Confiança: **alta**.

#### [INC-04] Notificações quebrado
- incompleto · **Alto** · esforço médio
- Evidência: `notificationService.ts:17,23,36,41` → `/api/notifications/*`; sem rota/viewset (model existe em `models.py:111`).
- Impacto: sino de notificações não popula; `mark_read`/`mark_all_read` falham.
- Correção: `NotificationViewSet` + rotas + `@action` `unread_count`/`mark_read`/`mark_all_read`.
- Confiança: **alta**.

#### [INC-05] Bulk import (Excel) sem backend + inconsistência interna no front
- incompleto · **Alto** · esforço médio
- Evidência:
  - Front chama **dois caminhos divergentes**: `productService.ts:223` faz `POST /api/products/import_products/`; já `components/products/ImportProductsModal.tsx:309` chama `productService.bulkImport(...)` e as mensagens de erro (`:327,:333`) citam `/api/products/bulk_import/`.
  - Backend: `ProductViewSet` só tem `@action` `like` (`:226`) e `toggle_save` (`:238`) — **não** existe `import_products` nem `bulk_import`. Há serializers (`BulkProductSerializer`/`BulkImportRequestSerializer`) e scripts `test_bulk_import*.py` + spec `BACKEND_BULK_IMPORT_SPEC.md`, mas **nenhuma view**.
- Impacto: importação por planilha 404a; além disso, o front aponta para dois nomes de endpoint diferentes.
- Correção: implementar a `@action` no `ProductViewSet` conforme o spec; unificar o nome do endpoint no front.
- Confiança: **alta**.

#### [INC-06] Design tokens desconectados da UI e do renderer; sem tema global de um clique
- incompleto · **Médio** · esforço alto
- Evidência: `editorStore.ts:37` inicia `designTokens: undefined`; só é preenchido por import/JSON ou `Theme` do back (`catalogLoader.service.ts`). Não há painel de edição de tokens em `components/`. O `ElementRenderer` aplica cores literais e não resolve `$tokens.*` via `referenceResolver.service.ts`. Templates DiPACK (`plugins/dipack/templates/`) são React com cores/fontes **fixas**.
- Impacto: "trocar a aparência" = estilizar elemento a elemento OU inserir template fixo. A infra de tokens existe mas é inerte para o usuário.
- Correção: expor painel de tokens; fazer o renderer resolver referências; parametrizar templates por tokens. Funcionalidade nova, não só conserto.
- Confiança: **alta**.

#### [INC-07] drf-spectacular: geração de schema quebrada
- incompleto · **Médio** · esforço baixo
- Evidência: `check --deploy` retorna `drf_spectacular.E001`: "Incompatible AutoSchema used on View `ActivityViewSet`". Não há `DEFAULT_SCHEMA_CLASS` em `settings.py:123-127`.
- Impacto: Swagger/Redoc podem gerar schema incompleto ou falhar — a "fonte de verdade" de API fica não confiável.
- Correção: setar `'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema'` no `REST_FRAMEWORK` e remover qualquer `schema` custom incompatível em `ActivityViewSet`.
- Confiança: **alta**.

---

### 3.C — FRAGILIDADES

#### [FRG-01] `npm run build` falha — 379 erros de `tsc`
- fragilidade · **Crítico** · esforço médio
- Evidência: `npm run build` (`tsc -b && vite build`) aborta no `tsc` com **379** erros. Causas-raiz:
  - **Alias `@` sem `paths`:** `tsconfig.app.json` não tem `compilerOptions.paths`; o alias só existe em `vite.config.ts:9-11`. Por isso `Cannot find module '@/types/api'`, `'@/store/authStore'` etc. (vários services). *(`src/types/api.ts` existe — é só resolução.)*
  - **Sem `vite-env.d.ts`:** `import.meta.env` dá `Property 'env' does not exist on type 'ImportMeta'` (`api.ts:4`, `categoryService.ts:3`).
  - **Tipos divergentes reais:** `CatalogElement` não tem `textData`/`opacity`/`imageData` (`catalogIO.service.ts:107,127,392,414`; `catalogLoader.service.ts:179`); conflitos de export em `types/layoutRules.ts:455-462`; `EditorElement` inexistente (`layoutEngine.service.ts:30`); vários `declared but never used`.
- Impacto: **não há build de produção do front**. O `dev` (Vite) funciona porque resolve o alias e ignora erros de tipo; isso mascara o problema.
- Causa provável: alias configurado só no Vite; tipos do editor evoluíram sem atualizar services.
- Correção: adicionar `paths` no `tsconfig.app.json`, criar `src/vite-env.d.ts` (`/// <reference types="vite/client" />`), e reconciliar os tipos `CatalogElement`/`textData`. Depois, rodar `tsc -b` limpo.
- Confiança: **alta**.

#### [FRG-02] Lint com 428 problemas
- fragilidade · **Médio** · esforço médio
- Evidência: `eslint .` → **428 problemas (382 erros, 46 warnings)**; 9 auto-fixáveis. Predominam `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `prefer-const`.
- Impacto: ruído que esconde problemas reais; `any` excessivo enfraquece o type-checking.
- Correção: `eslint --fix` para os triviais; tipar os `any` críticos (designTokens, editor, layoutRules).
- Confiança: **alta**.

#### [FRG-03] `ElementRenderer.tsx:420` chama método inexistente
- fragilidade · **Alto** · esforço baixo
- Evidência: `components/editor/ElementRenderer.tsx:420` → `useEditorStore.getState().removeElement(element.id)`. O store **não tem** `removeElement`; tem `deleteElement` (`editorStore.ts:187`). A mesma tela usa o nome correto em `:205` (`deleteElement`).
- Impacto: o caminho que chama `:420` lança `TypeError: ...removeElement is not a function` em runtime (não pega no build porque o front nem buildou e é via `getState()`).
- Causa provável: renome de método não propagado.
- Correção: trocar `removeElement` por `deleteElement` na linha 420.
- Confiança: **alta**.

#### [FRG-04] `authStore.ts` ignora `VITE_API_BASE_URL`; `catalogLoader` hardcoded
- fragilidade · **Médio** · esforço baixo
- Evidência: `store/authStore.ts:5` → `const API_BASE_URL = 'http://localhost:8000';` (fixo). `services/catalogLoader.service.ts:62,78,97,124,227` usam `fetch('http://localhost:8000/...')` literal. Em contraste, `services/api.ts:4` e `categoryService.ts:3` respeitam `import.meta.env.VITE_API_BASE_URL`.
- Impacto: trocar a URL da API exige editar múltiplos arquivos; deploy fora de localhost quebra login e carregamento de catálogo.
- Correção: centralizar a base URL (reusar `api.ts`) e eliminar literais.
- Confiança: **alta**.

#### [FRG-05] Fluxo de registro inconsistente
- fragilidade · **Médio** · esforço baixo
- Evidência: `register_user` (`views.py:796-800`) retorna **só** `{user, refresh, access}`. O `authStore.register()` espera `organization`/`default_sede` na resposta (campos que o back não envia). Em paralelo, `services/authService.ts:40` tem um `register()` que faz `POST /api/users/` (endpoint errado) — provável código morto/duplicado. Os orphans `views_register_temp.py` e `views.py_explore_snippet` (`api/`) reforçam a confusão.
- Impacto: após registrar, o front pode não ter `organization`/`default_sede` e seguir em estado inconsistente; risco de alguém manter o caminho errado (`authService.register`).
- Correção: definir um único fluxo; alinhar o payload de resposta ao que o front consome; remover `authService.register` se não usado e os orphans.
- Confiança: **alta** (mismatch confirmado; "qual é o real" — `authStore` é o usado, `authService` parece morto).

#### [FRG-06] IDs por `Date.now()` e `console.log` de debug em produção
- fragilidade · **Médio** · esforço baixo
- Evidência: `editorStore.ts:10` (`id: \`page-${Date.now()}\``) e geração de IDs de elemento/grupo com `Date.now()` + sufixo aleatório (linhas em `:93,:279,:394,:446`, a confirmar offsets exatos). `grep` conta **29** usos de `Date.now()` no `src` e **146** `console.log` (sendo **14** no `editorStore.ts`).
- Impacto: páginas criadas no mesmo milissegundo podem colidir de ID (ID de página não tem sufixo aleatório → risco real). Logs poluem o console e podem vazar dados em produção.
- Correção: usar `crypto.randomUUID()` para IDs; remover/condicionar os `console.log` (logger por env).
- Confiança: **alta**.

#### [FRG-07] Dependências vulneráveis (`npm audit`)
- fragilidade · **Alto** · esforço médio
- Evidência: `npm audit` → **22 vulnerabilidades (1 baixa, 7 moderadas, 12 altas, 2 críticas)**. `vite` (path traversal/file read no dev server) tem fix via `npm audit fix`. `xlsx` (`*`) tem **Prototype Pollution** + **ReDoS** e **sem fix disponível**.
- Impacto: `xlsx` processa arquivos do usuário (bulk import) — superfície de prototype pollution/ReDoS no client. Vite afeta o ambiente de dev.
- Correção: `npm audit fix` para o que dá; migrar `xlsx` para fork mantido (`@e965/xlsx`) ou isolar o parsing.
- Confiança: **alta**.

#### [FRG-08] `MediaFolderViewSet.get_queryset` pode estourar 500 com anônimo
- fragilidade · **Baixo** · esforço baixo
- Evidência: `views.py:99-101` — com `AllowAny`, se `request.user` é `AnonymousUser`, `not user.is_superuser` é `True` e então acessa `user.organizations.all()`. `AnonymousUser` não tem `organizations` → `AttributeError` (500).
- Impacto: requisição não autenticada a `/api/media-folders/` pode dar 500 (em vez de 401). Em dev sempre há token, por isso passa despercebido.
- Correção: guardar `if user.is_authenticated` antes de filtrar; ou aplicar `IsAuthenticated`.
- Confiança: **média / a confirmar** (depende de o cliente realmente bater sem token).

---

### 3.D — DÍVIDA TÉCNICA & HIGIENE

#### [DIV-01] Arquivos órfãos/backup versionados
- dívida · **Baixo** · esforço baixo
- Evidência: `api/views.py_explore_snippet`, `api/views_register_temp.py` (back); `src/pages/CatalogEditor.tsx.bak`, `src/components/editor/PropertiesPanel.tsx.backup` (front); além de `analyze_groups.js`, `read_prompts.js`, `prompts.json`, `VISUAL_GUIDE.txt`.
- Impacto: confunde quem lê o código; risco de importar da fonte errada.
- Correção: remover do repo.
- Confiança: **alta**.

#### [DIV-02] ~85 MB de PDFs (+ xlsx) versionados
- dívida · **Médio** · esforço baixo
- Evidência: `git ls-files` lista 5 PDFs "Coleção Primavera 2025*", incluindo `catana-front/public/Coleção Primavera 2025 - Impressão.pdf` (**47 MB**) e três de ~9,4 MB na raiz do front; xlsx soltos (`dipack_prompts...xlsx`, `template_importacao...xlsx`, `teste_importacao...xlsx`); `catana-back/files.zip` (47 KB).
- Impacto: repo pesado; clones lentos; binários no histórico não somem fácil.
- Correção: mover para storage/LFS; manter no repo só o que é usado em runtime.
- Confiança: **alta**.

#### [DIV-03] `requirements.txt` sem versões pinadas
- correção · **Médio** · esforço baixo
- Evidência: `catana-back/requirements.txt` lista pacotes sem `==` (`Django`, `djangorestframework`, …).
- Impacto: builds não reprodutíveis; risco de quebra silenciosa em upgrade de dependência.
- Correção: pinar versões (`pip freeze` controlado) ou usar `pip-tools`/`poetry`.
- Confiança: **alta**.

#### [DIV-04] Sem testes automatizados reais
- dívida · **Médio** · esforço alto
- Evidência: `api/tests.py` tem só o comentário template (3 linhas). Os `test_*.py`/`test_*.sh` da raiz do back são scripts manuais de chamada (curl/requests), não unit/integration. Front sem runner (nenhum em `package.json`).
- Impacto: áreas críticas sem rede de segurança — sobretudo o `editorStore` (undo/redo, multi-página) e o (futuro) save relacional.
- Correção: introduzir pytest-django no back (focar permissões e serializers) e Vitest no front (focar `editorStore`).
- Confiança: **alta**.

#### [DIV-05] Sem CI/CD, sem tooling de raiz, README vazio
- dívida · **Médio** · esforço médio
- Evidência: raiz tem só `CLAUDE.md`, `README.md` (conteúdo: `# catana`), `catana-back/`, `catana-front/`. Não há `.github/` (CI), `Makefile`, workspace ou `docker-compose` na raiz; `docker-compose.yml` existe só dentro de `catana-back/`.
- Impacto: nada roda lint/build/test automaticamente; o build quebrado (FRG-01) passaria despercebido.
- Correção: adicionar CI mínimo (lint + `tsc -b` no front; `manage.py check` + testes no back) e um README de monorepo.
- Confiança: **alta**.

#### [DIV-06] Scripts ad-hoc na raiz do back tocam o banco
- dívida · **Baixo** · esforço baixo
- Evidência: `seed_database.py`, `insert_fake_products.py`, `add_product_images.py`, `add_catalog_covers.py`, `create_user_preferences.py`, `fix_media_names.py`, `fix_media_types.py`, `inspect_sharing.py`, `verify_*` — rodam direto contra o ORM/DB.
- Impacto: risco de execução acidental destrutiva; poluição da raiz.
- Correção: mover para `management/commands/` ou pasta `scripts/` documentada.
- Confiança: **alta**.

#### [DIV-07] `JSONField` sem schema/validação
- fragilidade · **Médio** · esforço médio
- Evidência: `models.py:159` (`Product.specs`), `:160` (`dropshipping_info`), `:199` (`Theme.styles`), `:228` (`Component.content`), `:260` (`Activity.details`).
- Impacto: drift de formato entre front e back sem nada para barrar; bugs difíceis de rastrear (ex.: `Component.content` é o JSON do elemento do editor).
- Correção: validar no serializer (jsonschema/pydantic) os campos que cruzam front↔back, principalmente `Component.content` e `Theme.styles`.
- Confiança: **alta**.

#### [DIV-08] `views.py` (1008) e `models.py` (505) monolíticos
- dívida · **Baixo** · esforço alto
- Evidência: `wc -l` → `views.py` 1008, `models.py` 505, `serializers.py` 586.
- Impacto: navegação/manutenção difíceis; merges conflitantes.
- Correção: quebrar por domínio (catalog, social, media, org) quando houver fôlego.
- Confiança: **alta**.

#### [COR-01] Back sem `.gitignore`; `.DS_Store`/`files.zip` versionados
- correção · **Baixo** · esforço baixo
- Evidência: `catana-back/.gitignore` não existe; `git ls-files` inclui `catana-back/.DS_Store` e `catana-back/files.zip`.
- Correção: adicionar `.gitignore` no back (incl. `.env`, `.DS_Store`, `*.zip`, `__pycache__`, `media/`).
- Confiança: **alta**.

#### [COR-02] Possível código duplicado/inalcançável em `views.py` (stats)
- correção · **Baixo** · esforço baixo · **a confirmar**
- Evidência: um dos agentes reportou trecho duplicado após `return` na action de stats de mídia (`views.py:306+`). Não validei linha a linha.
- Correção: revisar a `@action` `stats` do `MediaViewSet` e remover código morto, se confirmado.
- Confiança: **a confirmar**.

#### [COR-03] Paginação não é global
- correção · **Baixo** · esforço baixo
- Evidência: `REST_FRAMEWORK` (`settings.py:123-127`) não define `DEFAULT_PAGINATION_CLASS`/`PAGE_SIZE`; `StandardResultsSetPagination` (`views.py:25`) precisa ser aplicada por viewset.
- Impacto: viewsets sem `pagination_class` retornam tudo sem paginar (inconsistência). O "padrão 24/página" do CLAUDE.md não é global.
- Correção: definir paginação default no `REST_FRAMEWORK`.
- Confiança: **alta**.

---

## 4. Quick wins (alto valor, baixo esforço)

1. **FRG-01 (parcial):** adicionar `paths` no `tsconfig.app.json` + criar `src/vite-env.d.ts` — destrava boa parte dos 379 erros (os de alias e `import.meta.env`).
2. **FRG-03:** trocar `removeElement`→`deleteElement` em `ElementRenderer.tsx:420` (1 linha, evita crash).
3. **SEG-04:** mover `ALLOWED_HOSTS`/CORS para env (`settings.py:24,27`).
4. **SEG-01 (contenção):** `git rm --cached catana-back/.env` + criar `.gitignore` (a rotação de segredos é decisão sua — §5).
5. **FRG-04:** apontar `authStore.ts:5` e `catalogLoader.service.ts` para a base URL central de `api.ts`.
6. **INC-07:** setar `DEFAULT_SCHEMA_CLASS` do drf-spectacular — conserta o Swagger.
7. **DIV-01:** remover orphans (`*.bak`, `*.backup`, `views_register_temp.py`, `views.py_explore_snippet`).
8. **FRG-02:** `eslint --fix` nos 9 auto-fixáveis; remover `console.log` do `editorStore`.
9. **DIV-03:** pinar `requirements.txt`.

---

## 5. Decisões que dependem de você

1. **Rotação de segredos (SEG-01):** rotacionar `SECRET_KEY` e a senha do banco e expurgar do histórico (BFG/`git filter-repo`) é disruptivo — invalida sessões e exige coordenação. Faço a contenção (untrack + `.gitignore`), mas a rotação/expurgo é sua chamada.
2. **Política de autenticação (SEG-02/SEG-03):** ligar `IsAuthenticated` por padrão e remover os fallbacks de superuser **vai quebrar** o uso atual sem login (o front não trata 401 em todo lugar). Quer um plano de migração faseado (endpoints públicos x privados)?
3. **Arquitetura do save relacional (INC-01):** preferir (a) save incremental por elemento via os CRUD existentes, ou (b) um endpoint transacional "bulk save" novo no back? Impacta esforço e robustez.
4. **Ordem do módulo social (INC-02/03/04):** implementar tudo (perfis, follows, likes, saves, mensagens, notificações, bloqueio) ou priorizar um subconjunto? Há specs (`PUBLIC_PROFILES_BACKEND_SPEC.md`) e serializers prontos.
5. **`xlsx` vulnerável (FRG-07):** trocar por fork mantido (`@e965/xlsx`) ou aceitar o risco isolando o parsing? Sem fix upstream.
6. **JWT em `localStorage` (SEG-06):** migrar refresh para cookie `HttpOnly` muda o fluxo de auth do front — vale o esforço agora?

---

## 6. Discrepâncias entre `CLAUDE.md` e o código atual

| `CLAUDE.md` diz | Realidade no código | Evidência |
|---|---|---|
| "Cada subpasta é um **repositório git independente** (não há git na raiz)" | **Falso agora** — é um **monorepo git único** na raiz; submódulos viraram pastas | `.git` só na raiz; commit `14d2ddb "Converte submodulos em pastas normais"` |
| "`.env` versionado nos **dois** repos (inclusive no front)" | **Só o back** — `catana-front/.env` não existe nem é rastreado (só `.env.example`) | `git ls-files catana-front/.env` vazio; `catana-front/.gitignore` lista `.env` |
| Sugere que falta o **endpoint** de save (Page/PageComponent/Component) | Os **viewsets CRUD existem** no back (`views.py:558,562,584`); falta a **orquestração no front** | `urls.py:27-29`; `catalogService.ts` (só metadados) |
| Não menciona | **Build do front está quebrado** (379 erros tsc) | `npm run build` |
| Não menciona | `permissions.py` **nunca é importado** (dead code) | `grep` sem ocorrências |
| "paginação padrão 24/página" | Não é global; depende de cada viewset | `settings.py:123-127` sem `DEFAULT_PAGINATION_CLASS` |

> Observação: o restante do `CLAUDE.md` (domínio, stack, fallbacks de auth, design tokens desligados, IDs por `Date.now()`, CORS/hosts abertos, orphans) **bate com o código**.
