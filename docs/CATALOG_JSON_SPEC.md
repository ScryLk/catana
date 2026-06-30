# CATALOG_JSON_SPEC — Geração de catálogos Catana via JSON

> Documento autoritativo para gerar um catálogo Catana **completo** por JSON e persisti-lo
> de forma confiável no banco, **sem abrir o editor**. Cada afirmação foi verificada por
> leitura direta do código (jun/2026) e citada como `arquivo:linha`. Onde o código diverge
> do `CLAUDE.md`, **o código vence** e a divergência está registrada.
>
> Escopo dos caminhos de arquivo: `catana-front/src/...` e `catana-back/api/...`.

---

## 1. Visão geral: duas representações e o caminho durável

Um catálogo tem **duas representações paralelas**:

1. **Banco (relacional, canônico):** linhas em `Catalog → Page → PageComponent → Component`,
   mais `Theme`. Geometria mora no `PageComponent`; o JSON do elemento mora em
   `Component.content`; tokens de tema moram em `Theme.styles.designTokens`.
   (`catana-back/api/models.py:197-245`.)
2. **Editor (em memória):** `CatalogPage[] → CatalogElement[]`, exportável como um envelope
   JSON **catalogIO v1.0** (`app:'Catana'`). (`catana-front/src/types/editor.ts:396-445`,
   `catana-front/src/services/catalogIO.service.ts:68-87`.)

### Por que o caminho durável é "JSON-de-autoria → tradutor → banco"

**Importar um JSON no editor NÃO persiste nada por si só.** O fluxo do editor mantém páginas
em memória (Zustand); `catalogService.createCatalog()` grava **apenas metadados** do catálogo
(`POST /api/catalogs/` com campos do `Catalog`), sem páginas/elementos
(`catana-front/src/services/catalogService.ts:90-92`). A persistência do conteúdo acontece por
**dois endpoints** dedicados:

- **`POST /api/catalogs/{id}/save_content/`** — grava o conteúdo do editor (usado pelo botão
  "Salvar"). (`catana-back/api/views.py:726-819`.)
- **`POST /api/catalogs/import-json/`** — **ingest** de um envelope catalogIO v1.0 → banco.
  É o **tradutor** recomendado para geração por JSON. (`catana-back/api/views.py:862-918`,
  delega a `catana-back/api/catalog_ingest.py:100-180`.)

Portanto, para "nascer no banco editável", **gere o envelope catalogIO v1.0 e faça POST em
`/api/catalogs/import-json/`** (ou chame `importar_catalogo_json(...)` num seed). O editor então
**carrega** esse catálogo de volta via `loadImportedCatalog()`
(`catana-front/src/services/catalogLoader.service.ts:69-204`), que é o **inverso exato** do ingest.

```
  JSON catalogIO v1.0  ──POST /api/catalogs/import-json/──▶  Catalog/Page/Component/PageComponent/Theme
        (autoria)            (api/catalog_ingest.py)                       (banco)
                                                                              │
   editor renderiza  ◀──── loadImportedCatalog() ◀── GET /api/pages, /page-components, /components, /themes
   (catalogLoader.service.ts)                                  (inverso do ingest)
```

---

## 2. Schema do catálogo (envelope catalogIO v1.0)

Envelope produzido por `exportCatalog()` (`catalogIO.service.ts:68-87`) e validado em dois lugares:
- **Front** (antes de enviar pelo botão Importar): `validateCatalogSchema()`
  (`catalogIO.service.ts:181-281`) — mais rígido.
- **Back** (no ingest): `validar_catalogio()` (`catalog_ingest.py:29-62`) — o que de fato
  bloqueia a escrita (HTTP 400).

| Campo | Tipo | Obrigatório | Default | Validado em | Observação |
|---|---|---|---|---|---|
| `app` | `"Catana"` | **sim** | — | back:33, front:195 | literal exato `"Catana"` |
| `schemaVersion` | `"1.0"` | **sim** | — | back:35-39, front:209 | só `"1.0"` é aceito (`catalog_ingest.py:19`) |
| `exportedAt` | string ISO | não | `new Date().toISOString()` | — | só metadado; ingest ignora |
| `catalog` | objeto | **sim** | — | back:40-42, front:217 | precisa de `name` |
| `catalog.name` | string | **sim** | — | back:41, front:224 | não-vazio (`.strip()`) |
| `catalog.description` | string | não | `''` | — | vira `Catalog.description` |
| `catalog.organization` | string | não | — | — | só rótulo no envelope; **não** vira FK no ingest (ver §6) |
| `catalog.sede` | string | não | — | — | idem |
| `catalog.createdAt` | string ISO | não | — | — | ignorado pelo ingest |
| `settings` | objeto | não | `{gridSize:8,snapToGrid:true,defaultZoom:75}` | — | ignorado pelo ingest; o loader **reinjeta defaults fixos** (ver §4) |
| `settings.gridSize` | number | não | `8` | — | `catalogIO.service.ts:80` |
| `settings.snapToGrid` | boolean | não | `true` | — | `catalogIO.service.ts:81` |
| `settings.defaultZoom` | number | não | `75` | — | `catalogIO.service.ts:82` |
| `designTokens` | objeto (§5) | não | — | — | vira `Theme.styles.designTokens` + `Catalog.theme` (`catalog_ingest.py:136-146`) |
| `pages` | array | **sim** | — | back:43-45, front:233 | lista (pode ser vazia no back; front avisa se vazia) |

### Página (`pages[i]`)

| Campo | Tipo | Obrigatório (back) | Obrigatório (front) | Vira | Citação |
|---|---|---|---|---|---|
| `logicalId` | string | **não** | **sim** | — (descartado) | front exige (`catalogIO.service.ts:250`); back não olha |
| `name` | string | não | recomendado | — (o loader renomeia para `Página N`) | `catalogLoader.service.ts:181` |
| `order` | number | não | não | `Page.order` (fallback = índice) | `catalog_ingest.py:153` |
| `elements` | array | **sim** | **sim** | N× `Component`+`PageComponent` | `catalog_ingest.py:50-52,157` |
| `header` / `footer` | objeto | não | não | **não persiste** (sem coluna no `Page`) | ⚠️ ver §10 |

> **Divergência front × back:** o validador do front **exige `page.logicalId`**
> (`catalogIO.service.ts:250`); o ingest do back **não** (`catalog_ingest.py:47-52`). Se o JSON
> for enviado pelo **botão Importar** do editor, inclua `logicalId` em páginas e elementos; se
> for **POST direto** em `/api/catalogs/import-json/` ou via seed, `logicalId` é opcional.

### Elemento (`pages[i].elements[j]`) — contrato mínimo do ingest

`validar_catalogio` (`catalog_ingest.py:53-62`) exige, por elemento:

| Campo | Tipo | Obrigatório | Vira |
|---|---|---|---|
| `type` | string (um `ElementType`, §3) | **sim** | `Component.content.type` + `Component.component_type` (mapeado) |
| `position` | `{x:number, y:number}` | **sim** | `PageComponent.position_x/position_y` |
| `size` | `{width:number, height:number}` | **sim** | `PageComponent.width/height` |
| `zIndex` | number | não | `PageComponent.layer` (fallback = índice) |
| `logicalId` | string | não | — (geometria descartada do content) |
| (qualquer outro campo) | — | não | mantido em `Component.content` (ver §6) |

Tudo o que **não** for `('logicalId','position','size','zIndex')` é preservado em
`Component.content` (`catalog_ingest.py:22,81-83`).

---

## 3. Catálogo de ElementType e shape de dados por tipo

`ElementType` tem **54 valores** (`editor.ts:1-54`).

> **Divergência:** o `CLAUDE.md` diz "~40 `ElementType`". O código tem **54** (`editor.ts:1-54`).
> O código vence.

```
product-card, product-highlight, product-list, product-grid,
text-title, text-subtitle, text-paragraph, text-list,
image, banner, gallery, carousel, uploaded-image,
shape-rectangle, shape-circle, shape-triangle, shape-line, shape-square, shape-frame, line,
highlight-banner, highlight-callout, testimonial,
technical-specs, feature-list, data-table,
qr-code, icon-grid, certification-badge,
footer, divider,
dipack-cover, dipack-institutional, dipack-showcase, dipack-footer, dipack-back-cover,
dipack-confeitaria, dipack-confeitaria-intro, dipack-acougue, dipack-acougue-intro,
dipack-festa, dipack-festa-intro, dipack-food-service, dipack-food-service-intro
```

### ⚠️ Importante: nem todo tipo sobrevive ao round-trip do loader

O `CatalogElement` tem ~20 campos de dados por tipo (`editor.ts:417-435`), mas o
**loader só reconstrói um subconjunto** (`catalogLoader.service.ts:159-173`):

`content`, `textData`, `imageUrl`, `imageData`, `lineData`, `productData`, `qrCodeData`,
`groupId`, `isGroup`, `children` — além de `type`, `name`, `position`, `size`, `zIndex`,
`rotation`, `visible`, `locked`, `style`.

**Não são lidos de volta pelo loader** (ficam guardados em `Component.content`, mas o editor
não os repopula como campo do elemento): `highlightBannerData`, `testimonialData`,
`technicalSpecsData`, `featureListData`, `galleryData`, `carouselData`, `iconGridData`,
`certificationBadgeData`, `tableData`, `footerData`, `branding`, `layout`, `opacity`
(o topo; use `style.opacity`), `componentId`.

**Conclusão para autoria:** para um catálogo gerado por JSON renderizar de forma confiável,
**use apenas a "família round-trip-safe"**:

| Família | Tipos | Dado a usar |
|---|---|---|
| Texto | `text-title`, `text-subtitle`, `text-paragraph`, `text-list` | `style` + `content.text` (e opcional `textData`) |
| Imagem | `image`, `uploaded-image` | `style` + `imageUrl` + `imageData.src` |
| Formas | `shape-rectangle`, `shape-square`, `shape-circle`, `shape-triangle`, `shape-frame` | `style` (cor/raio/borda) |
| Linha | `line`, `shape-line` | `lineData` (ou `style`) |
| Produto | `product-card` | `productData` — **mas renderiza placeholder** (ver abaixo) |
| QR | `qr-code` | `qrCodeData` |
| Grupo | (qualquer, com `isGroup:true`) | `children` (ids lógicos) |

> ⚠️ **`product-card` renderiza placeholder.** O gerador de demo **evita `product-card`** e
> **compõe cada produto** a partir de `shape-rectangle` + `image` + `text-*`
> (`api/demo/generator.py:499-534`; `CLAUDE.md` confirma: "evita `product-card`, que renderiza
> placeholder"). **Recomendação:** para mostrar um produto de verdade, componha-o por primitivas
> como o demo faz. Mantenha `product-card`/`productData` só se você aceitar o placeholder.

> ⚠️ **`dipack-*` são templates de plugin hardcoded** (`src/plugins/dipack/`), com visual fixo da
> marca e **não parametrizáveis por token** (`CLAUDE.md`). O loader os armazena/recarrega como
> `type`+`content`, mas a renderização depende do `ElementRenderer`/registry do plugin — **não
> confirmado** que sobrevivem a um JSON autoral genérico. Evite-os em geração por JSON.

### Shapes de dados (campos exatos, de `editor.ts`)

**`style` (ElementStyle, `editor.ts:71-104`)** — todos opcionais: `backgroundColor`, `borderColor`,
`borderWidth`, `borderRadius`, `borderStyle('solid'|'dashed'|'dotted')`, `padding`, `margin`,
`opacity`, `shadow(bool)`, `boxShadow(string)`, `fontFamily`, `fontSize(number)`,
`fontWeight(string)`, `fontStyle('normal'|'italic')`, `textDecoration`, `textColor`,
`textAlign('left'|'center'|'right')`, `lineHeight(number)`, `letterSpacing(number)`,
`objectFit('cover'|'contain'|'fill'|'none'|'scale-down')`, filtros (`brightness`, `contrast`,
`saturate`, `grayscale`, `blur`), e de linha (`lineStyle`, `startArrow`, `endArrow`, `arrowSize`).

**`content`** (`editor.ts:405`, `any`) — para textos, a convenção do demo é `{"text": "..."}`
(`api/demo/generator.py:119`).

**`textData` (TextData, `editor.ts:107-119`)** — `content`(**string, req**), `text?`, `fontSize?`,
`fontFamily?`, `fontWeight?`, `textAlign('left'|'center'|'right'|'justify')`, `textColor?`,
`lineHeight?`, `letterSpacing?`, `textTransform?`, `textDecoration?`.

**`productData` (ProductData, `editor.ts:148-160`)** — `name`(**req**), `image`(**req**),
`price`(**number, req**), `currency`(**string, req**), `description?`,
`specs?: {label,value}[]`, `badge?`, `sku?`, `code?`, `category?`, `isNew?`.

**`imageData` (ImageData, `editor.ts:337-357`)** — `src?`, `url?`, `alt?`, `opacity?`,
`borderRadius?`, `objectFit('contain'|'cover'|'fill')`, `fit?`, `aspectRatioLocked?`,
`originalWidth?`, `originalHeight?`, `loadingState?`, `errorMessage?`. O loader prefixa
`imageData.src` e `imageUrl` com a base da API quando relativos (ver §4).

**`lineData` (LineData, `editor.ts:310-325`)** — `start{x,y}`(**req**), `end{x,y}`(**req**),
`strokeColor`(**req**), `strokeWidth`(**req**), `opacity`(**req**), `style('solid'|'dashed'|'dotted')`(**req**),
`cap('butt'|'round'|'square')`(**req**), `startArrow?`, `endArrow?`.

**`qrCodeData` (QRCodeData, `editor.ts:233-258`)** — `destinationType('catalog'|'product'|'profile'|'url')?`,
`data?`, `catalogId?`, `productId?`, `profileId?`, `customUrl?`, `color?`, `backgroundColor?`,
`logo?`, `logoSize?`, `errorCorrection('L'|'M'|'Q'|'H')?`, `margin?`, `quality?`, `trackScans?`, `label?`.

(Os demais shapes — gallery/carousel/table/feature/etc. — existem em `editor.ts:162-298` mas **não
são round-trip-safe**; ver aviso acima.)

---

## 4. Geometria e página

- **Unidade:** pixels @ 96 dpi. **Origem do eixo:** canto **superior esquerdo** (0,0).
  `position.x/y` é o **canto superior esquerdo** do elemento; `size.width/height` em px.
  No banco são `IntegerField` — valores são arredondados para int no ingest
  (`catalog_ingest.py:74-78,172-176`).
- **Dimensões de página (A4, padrão do editor/PDF):** **794 × 1123 px**
  (`catana-front/src/types/layoutRules.ts:28-30`; o demo usa as mesmas em
  `api/demo/generator.py:36-37`). **Letter:** 816 × 1056 (`layoutRules.ts:33-36`).
- **Margem de conteúdo:** o demo usa `MARGIN = 56` → `CONTENT_W = 682`
  (`api/demo/generator.py:38-39`). O preset de layout usa 64 (`layoutRules.ts`). Ambos são apenas
  convenção de composição — **não há coluna de margem** no modelo; você posiciona livremente.
- **Camadas (`layer`/`zIndex`):** inteiro crescente = mais ao topo. O loader **ordena por
  `layer` ascendente** ao reconstruir (`catalogLoader.service.ts:127`). No ingest, `zIndex`
  ausente cai para o índice do elemento na página (`catalog_ingest.py:176`).
- **Zoom/grid/snap:** o loader **descarta** o `settings` do JSON e injeta fixo
  `{gridSize:8, snapToGrid:true, defaultZoom:75}` (`catalogLoader.service.ts:193-197`). Não confie
  em `settings` para nada além de documentação.
- **Tamanho de página NÃO é persistido** por elemento/página — o canvas do editor é A4 fixo.
  Paisagem/quadrado exigiriam extensão de modelo (ver §11).

---

## 5. Cores e tema (designTokens)

### Estrutura de `designTokens` (`designTokens.ts:149-166`)

```
DesignTokens = {
  name: string,                 // req
  version: string,              // req
  description?: string,
  colors: ColorPalette,         // req
  typography: TypographyScale,  // req
  spacing: SpacingScale,        // req
  borderRadius: BorderRadiusScale, // req
  shadows: ShadowScale,         // req
  custom?: { [k]: any }
}
```

- **ColorPalette** (`designTokens.ts:23-49`): `primary`, `secondary`, `background`, `surface`,
  `border` (req) + `accent?`, `success?`, `warning?`, `error?`, `info?` — **cada um é um
  `ColorToken` `{ value: string, description?, contrast? }`** (`designTokens.ts:17-21`). Mais
  `text: { primary, secondary, disabled }` (cada um ColorToken).
- **TypographyScale** (`designTokens.ts:64-85`): `h1..h6`, `body`, `bodySmall`, `bodyLarge`,
  `caption`, `button` (req) + `overline?`. Cada um é `TypographyToken`
  `{ fontFamily, fontSize(px), fontWeight, lineHeight(mult), letterSpacing?, textTransform? }`
  (`designTokens.ts:55-62`).
- **SpacingScale** (`designTokens.ts:91-107`): `base`, `xxs..xxxl` (numbers).
- **BorderRadiusScale** (`designTokens.ts:113-123`): `none(=0)`, `sm,md,lg,xl,full` (numbers).
- **ShadowScale** (`designTokens.ts:134-143`): `none,sm,md,lg,xl` — cada um `ShadowToken`
  `{ value: string(box-shadow CSS), description? }`.
- **`DEFAULT_DESIGN_TOKENS`** (`designTokens.ts:189-377`) é o ponto de partida do store
  (`editorStore.ts:38`): primary `#4472C4`, secondary `#FF6B6B`, accent `#FFA500`, fonte Inter,
  spacing base 8, raios 0/4/8/12/16/9999.

### Como montar uma paleta

Forneça um `designTokens` no envelope com pelo menos `name`, `version`, `colors`, `typography`,
`spacing`, `borderRadius`, `shadows` (use o `DEFAULT_DESIGN_TOKENS` como base e troque as cores).
O ingest grava em `Theme.styles.designTokens` e linka `Catalog.theme`
(`catalog_ingest.py:136-146`). O loader lê de volta `theme.styles.designTokens`
(`catalogLoader.service.ts:110-117`).

### Sintaxe `$tokens.*` e onde é resolvida

- Em valores de `style` e `textData`, você pode escrever **`"$tokens.<caminho>"`** e a string é
  resolvida **ao vivo, em tempo de render**, contra os designTokens do catálogo
  (`src/utils/themeResolve.ts:7-40` → `resolveTokenReference()` em `designTokens.ts:392-421`).
- Caminho = navegação por `.`; para `ColorToken`/`ShadowToken` retorna o `.value`
  (`designTokens.ts:415-418`). Ex.: `"textColor": "$tokens.colors.primary"` →
  `#4472C4`; `"fontFamily": "$tokens.typography.h1.fontFamily"`.
- Strings que **não** começam com `$tokens.` passam intactas (`designTokens.ts:397`).
- Há um resolvedor mais amplo (`referenceResolver.service.ts:79-155`) que também entende
  `$product.<id>.<campo>`, `$media.<id>.url`, `$brand.<campo>`, `$catalog.<campo>` — porém o
  caminho aplicado a **elementos no editor** (`themeResolve.ts`) só resolve **`$tokens.*`**. Para
  geração por JSON, **use literais para cores específicas** (como o demo faz, `generator.py`) ou
  `$tokens.*` se quiser que o tema global controle tudo.

> **Templates DiPACK usam valores fixos**, não referências de token
> (`src/plugins/dipack/templates/`; `CLAUDE.md`: "ainda não parametrizável por token"). Confirmado
> como hardcoded.

---

## 6. De-para JSON → relacional (a parte crítica)

Implementado em `importar_catalogo_json()` (`catalog_ingest.py:100-180`). Inverso lido por
`loadImportedCatalog()` (`catalogLoader.service.ts:69-204`).

### Por elemento do JSON

| Campo do JSON | Vai para | Coluna/efeito | Citação |
|---|---|---|---|
| `position.x` | `PageComponent.position_x` | int | `catalog_ingest.py:172` |
| `position.y` | `PageComponent.position_y` | int | `catalog_ingest.py:173` |
| `size.width` | `PageComponent.width` | int | `catalog_ingest.py:174` |
| `size.height` | `PageComponent.height` | int | `catalog_ingest.py:175` |
| `zIndex` | `PageComponent.layer` | int (fallback índice) | `catalog_ingest.py:176` |
| `type` | `Component.component_type` (mapeado) **e** preservado em `content.type` | ver mapa abaixo | `catalog_ingest.py:162-163` |
| `name` | `Component.name` (fallback `type`/`'elemento'`) | — | `catalog_ingest.py:161` |
| `logicalId`, `position`, `size`, `zIndex` | **removidos** do content | (geometria mora no PageComponent) | `catalog_ingest.py:22,81-83` |
| **todo o resto** (`style`, `content`, `textData`, `productData`, `imageData`, `imageUrl`, `lineData`, `qrCodeData`, `visible`, `locked`, `rotation`, `groupId`, `isGroup`, `children`, …) | `Component.content` (JSONField) | lido de volta como `originalElement` | `catalog_ingest.py:163`; loader `catalogLoader.service.ts:130-173` |

**Mapa `type → Component.component_type`** (`catalog_ingest.py:65-71`): começa com `text` → `text`;
começa com `product` → `product`; **senão** → `image`. (Coluna cosmética: o loader usa
`content.type`, não `component_type` — `catalogLoader.service.ts:135`.)

### Por página / catálogo / tema

| JSON | Vira | Citação |
|---|---|---|
| `pages[i]` | `Page(catalog, order=order∥i)` | `catalog_ingest.py:151-154` |
| `catalog.name` | `Catalog.title` | `catalog_ingest.py:125-126` |
| `catalog.description` | `Catalog.description` (∥ `''`) | `catalog_ingest.py:127` |
| `designTokens` | `Theme(styles={'designTokens': …})` + `Catalog.theme` | `catalog_ingest.py:136-146` |
| `catalog.organization` / `catalog.sede` | **não** viram FK — `organization`/`sede` vêm do **chamador** (request/seed), não do envelope | `catalog_ingest.py:101,124-131`; view resolve do usuário em `views.py:892-901` |

### Inverso (o que o loader lê), e os defaults que ele aplica

`catalogLoader.service.ts`: `type ∥ 'text'` (135), `name ∥ component.name` (136), geometria do
PageComponent (140-148), `rotation ∥ transform.rotation ∥ 0` (149),
`visible ?? visibility.visible ?? true` (152), `locked ?? visibility.locked ?? false` (153),
`style ∥ {}` (156), e `content/textData/imageUrl/imageData/lineData/productData/qrCodeData/
groupId/isGroup/children` direto do `originalElement` (159-173). `absMedia()` prefixa `imageUrl` e
`imageData.src` relativos com `VITE_API_BASE_URL` (`catalogLoader.service.ts:16-22,162-165`).

> **Divergência `save_content` × `import-json`:** `save_content` grava `content=element`
> **incluindo a geometria** (`views.py:797`), enquanto o ingest **remove** a geometria do content
> (`catalog_ingest.py:163`). Ambos carregam igual no loader (que lê geometria do `PageComponent` e
> ignora a geometria duplicada em `content`). O ingest é o formato "limpo".

---

## 7. Exemplo MÍNIMO completo (1 página: título + 1 produto composto)

JSON íntegro, copiável. Faz POST direto em `/api/catalogs/import-json/` (não exige `logicalId`).
Produto **composto por primitivas** (renderiza de verdade; evita o placeholder do `product-card`).

```json
{
  "app": "Catana",
  "schemaVersion": "1.0",
  "exportedAt": "2026-06-30T12:00:00.000Z",
  "catalog": { "name": "Catálogo Mínimo", "description": "Exemplo de 1 página" },
  "settings": { "gridSize": 8, "snapToGrid": true, "defaultZoom": 75 },
  "designTokens": {
    "name": "Tema Exemplo", "version": "1.0",
    "colors": {
      "primary": { "value": "#1F6F54" }, "secondary": { "value": "#E0A458" },
      "background": { "value": "#FFFFFF" }, "surface": { "value": "#F6F4EF" },
      "border": { "value": "#E4E0D8" },
      "text": { "primary": { "value": "#1A1A1A" }, "secondary": { "value": "#6B6B6B" }, "disabled": { "value": "#BDBDBD" } }
    },
    "typography": { "h1": { "fontFamily": "Georgia, serif", "fontSize": 44, "fontWeight": 700, "lineHeight": 1.2 },
                    "body": { "fontFamily": "Inter, sans-serif", "fontSize": 16, "fontWeight": 400, "lineHeight": 1.6 } },
    "spacing": { "base": 8, "xxs": 2, "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32, "xxl": 48, "xxxl": 64 },
    "borderRadius": { "none": 0, "sm": 4, "md": 8, "lg": 12, "xl": 16, "full": 9999 },
    "shadows": { "none": { "value": "none" }, "sm": { "value": "0 1px 2px rgba(0,0,0,0.05)" },
                 "md": { "value": "0 4px 6px rgba(0,0,0,0.1)" }, "lg": { "value": "0 10px 15px rgba(0,0,0,0.1)" },
                 "xl": { "value": "0 20px 25px rgba(0,0,0,0.15)" } }
  },
  "pages": [
    {
      "name": "Capa",
      "order": 0,
      "elements": [
        {
          "type": "shape-rectangle", "name": "Faixa",
          "position": { "x": 0, "y": 0 }, "size": { "width": 794, "height": 160 }, "zIndex": 0,
          "style": { "backgroundColor": "$tokens.colors.primary", "borderRadius": 0 }
        },
        {
          "type": "text-title", "name": "Título",
          "position": { "x": 56, "y": 48 }, "size": { "width": 682, "height": 70 }, "zIndex": 1,
          "style": { "fontFamily": "Georgia, serif", "fontSize": 44, "fontWeight": "bold",
                     "textColor": "#FFFFFF", "textAlign": "left", "lineHeight": 1.2 },
          "content": { "text": "Catálogo Primavera" }
        },

        {
          "type": "shape-rectangle", "name": "Card",
          "position": { "x": 56, "y": 220 }, "size": { "width": 330, "height": 360 }, "zIndex": 2,
          "style": { "backgroundColor": "#F6F4EF", "borderColor": "#E4E0D8", "borderWidth": 1,
                     "borderStyle": "solid", "borderRadius": 14 }
        },
        {
          "type": "image", "name": "Foto",
          "position": { "x": 66, "y": 230 }, "size": { "width": 310, "height": 170 }, "zIndex": 3,
          "style": { "borderRadius": 10, "objectFit": "cover" },
          "imageUrl": "/media/media/produto.jpg",
          "imageData": { "src": "/media/media/produto.jpg", "opacity": 1, "borderRadius": 10,
                         "objectFit": "cover", "aspectRatioLocked": false }
        },
        {
          "type": "text-subtitle", "name": "Nome",
          "position": { "x": 72, "y": 412 }, "size": { "width": 298, "height": 44 }, "zIndex": 4,
          "style": { "fontFamily": "Georgia, serif", "fontSize": 17, "fontWeight": "bold",
                     "textColor": "#1A1A1A", "textAlign": "left", "lineHeight": 1.2 },
          "content": { "text": "Embalagem PET 500ml" }
        },
        {
          "type": "text-paragraph", "name": "Desc",
          "position": { "x": 72, "y": 460 }, "size": { "width": 298, "height": 70 }, "zIndex": 5,
          "style": { "fontFamily": "Inter, sans-serif", "fontSize": 12, "fontWeight": "normal",
                     "textColor": "#6B6B6B", "textAlign": "left", "lineHeight": 1.3 },
          "content": { "text": "Transparente, atóxica, ideal para confeitaria e food service." }
        },
        {
          "type": "text-subtitle", "name": "Preço",
          "position": { "x": 72, "y": 536 }, "size": { "width": 298, "height": 30 }, "zIndex": 6,
          "style": { "fontFamily": "Georgia, serif", "fontSize": 21, "fontWeight": "bold",
                     "textColor": "$tokens.colors.secondary", "textAlign": "left" },
          "content": { "text": "R$ 2,90" }
        }
      ]
    }
  ]
}
```

Envio:

```bash
curl -X POST http://localhost:8000/api/catalogs/import-json/ \
  -H 'Content-Type: application/json' \
  --data @catalogo_minimo.json
# → 201 { "catalog_id": <id>, "title": "...", "pages": 1, "elements": 7, "mode": "new", "theme_id": <id> }
```

Depois abra `/(...)/editor?catalog=<catalog_id>` no front.

---

## 8. Exemplo COMPLETO de referência (estrutura de seções)

Para um catálogo "de verdade", monte **uma página por seção** seguindo as 11 macrosseções do
demo (`api/demo/generator.py:42-45`): `capa`, `apresentacao`, `sobre`, `indice`, `divisores`,
`produtos`, `especiais`, `precos`, `como_comprar`, `termos`, `contracapa`. Padrões testados
(todos round-trip-safe):

- **Capa** — `shape-rectangle` full-bleed (faixa) + `text-title` + `image` hero + acento.
- **Apresentação** — `text-title` + `text-paragraph` (2 colunas via dois elementos lado a lado).
- **Divisor de categoria** — `shape-rectangle` faixa `0,0,794,132` (cor primária) + `shape-rectangle`
  acento `0,132,794,6` + `text-title` (`generator.py:537-558`).
- **Grade de produtos** — grid 2×3 de "cards compostos" (cada card = retângulo + imagem + 3 textos),
  como em `generator.py:561-568,499-534`. Geometria: `CONTENT_W=682`, 2 colunas, gutter ~24.
- **Tabela de preços** — como o `data-table` **não** é round-trip-safe, monte a tabela com
  `shape-rectangle` (linhas zebradas) + `text-*` por célula. Mesma técnica de composição.
- **Contracapa** — `shape-rectangle` de fundo + `image` (logo) + `text-*` CTA + contato.

> Para um esqueleto completo pronto, a maneira mais rápida e fiel é **gerar um demo** e exportar:
> `python manage.py gerar_catalogo_demo --tema padaria` cria todas as seções no banco; abra no
> editor e use "Baixar JSON" para obter um envelope catalogIO v1.0 completo como ponto de partida.

---

## 9. Checklist de validação (para o loader NÃO quebrar)

Antes de fazer POST, garanta:

- [ ] `app === "Catana"` e `schemaVersion === "1.0"` (`catalog_ingest.py:33-39`).
- [ ] `catalog.name` não-vazio (`catalog_ingest.py:41`).
- [ ] `pages` é lista; cada página tem `elements` lista (`catalog_ingest.py:43-52`).
- [ ] Cada elemento tem `type` (string), `position{x,y}` e `size{width,height}`
      (`catalog_ingest.py:56-62`). **Sem isso, é 400 antes de qualquer escrita.**
- [ ] `position`/`size`/`zIndex` numéricos (são arredondados para int; valores não-numéricos viram
      `0`/índice — `catalog_ingest.py:74-78`).
- [ ] Use **apenas tipos round-trip-safe** (§3) — senão o dado específico do tipo se perde no load.
- [ ] URLs de mídia: relativas `/media/...` (o loader prefixa a base) **e** o arquivo precisa
      existir e ser servido (em prod, validar CORS de `/media/` — `CLAUDE.md`).
- [ ] Se for **enviar pelo botão Importar** do editor (não POST direto), inclua `logicalId` em
      cada **página e elemento** (`catalogIO.service.ts:250` exige).
- [ ] `designTokens`, se presente, com `colors/typography/spacing/borderRadius/shadows`
      (cada cor é `{value}`); senão o `Theme` não é criado e `$tokens.*` cai no literal de fallback.

Verificação automatizada disponível: `python manage.py verificar_ingest` importa um JSON de
exemplo, reconstrói pelos mesmos passos do loader e compara campo a campo
(`catana-back/api/management/commands/verificar_ingest.py`).

---

## 10. Pegadinhas conhecidas

1. **Importar no editor ≠ persistir.** Só `save_content`/`import-json` gravam conteúdo;
   `createCatalog` é metadado (`catalogService.ts:90-92`). (§1)
2. **`product-card` renderiza placeholder.** Componha produtos por primitivas
   (`generator.py:499-534`). (§3)
3. **Round-trip parcial.** O loader só repõe um subconjunto dos `*Data`
   (`catalogLoader.service.ts:159-173`). `galleryData`, `tableData`, `branding`, `opacity` de topo,
   etc. **não voltam** como campo do elemento. (§3)
4. **`header`/`footer` de página não persistem** — sem coluna no `Page`; o loader os zera
   (`catalogLoader.service.ts:184-185`). (§2)
5. **`settings` é ignorado no load** — zoom/grid/snap são fixos `75/8/true`
   (`catalogLoader.service.ts:193-197`). (§4)
6. **`catalog.organization`/`sede` do envelope não viram FK** — org/sede vêm do chamador
   (`catalog_ingest.py:124-131`, `views.py:892-901`). (§6)
7. **`$tokens.*` só resolve em `style`/`textData`** de elementos (`themeResolve.ts:25-40`); outros
   prefixos (`$product`, `$media`) **não** são aplicados a elementos do editor. (§5)
8. **Templates `dipack-*` são hardcoded** e não parametrizáveis por token; não use em JSON autoral.
9. **IDs:** os `logicalId` do JSON são descartados; o editor gera ids próprios com
   `crypto.randomUUID()` ao carregar (`catalogLoader.service.ts:124,129`; `utils/id.ts`). Use
   `logicalId` apenas para amarrar `children` de grupos dentro do mesmo JSON.
10. **Divergência save_content × ingest** quanto à geometria em `content` (§6) — inofensiva, mas
    saiba qual produziu o registro.
11. **`/media/` em prod:** logo/fotos exportam no PDF via `<img crossOrigin="anonymous">`; valide
    CORS de `/media/` se mexer no serving (`CLAUDE.md`).

---

## 11. Eixos de personalização — o que existe e o que falta

Para cada eixo: **(✓ suportado / ⚠ parcial / ✗ ausente)**, com evidência e, quando ausente, a
**extensão mínima** proposta (sem implementar).

| Eixo | Estado | Hoje (arquivo:linha) | Extensão mínima proposta |
|---|---|---|---|
| **Paleta** (primária/secundária/destaque) | ✓ | `designTokens.colors.*` ColorToken (`designTokens.ts:23-49`); `$tokens.colors.*` resolve em style/textData (`themeResolve.ts`) | — (já dá; usar literais ou `$tokens.*`) |
| **Harmônicos a partir de 1 cor de marca** | ⚠ | Existe gerador de identidade no back (`api/demo/identidade.py`, contraste WCAG) mas **só na trilha de demo**, não no ingest | Helper `gerar_paleta(cor_marca) → designTokens` reutilizável pelo ingest |
| **Tema claro/escuro** | ✗ | `colors.background/surface/text` existem, mas sem par claro/escuro | Adicionar `designTokens.modes.{light,dark}` ou 2º Theme + flag no `Catalog` |
| **Tipografia (par heading/body, escala, pesos, line-height)** | ✓ | `TypographyScale` h1..h6/body/... (`designTokens.ts:64-85`); por-elemento via `style`/`textData` | — |
| **Densidade/layout (espaçoso×compacto, nº de colunas)** | ⚠ | `SpacingScale` (`designTokens.ts:91-107`) e `ElementLayout.columns` (`editor.ts:122-128`) existem, mas **layout não é restaurado** pelo loader; a grade é geometria manual (`generator.py:561-568`) | Persistir `layout`/grid no `content` **e** o loader lê de volta; ou um campo `Catalog.layout_preset` |
| **Capa/contracapa (variantes)** | ⚠ | Só por composição manual; o demo tem 1 variante "designed" (`generator.py` capa/contracapa) | Catálogo de "blocos de capa" parametrizáveis (presets de composição) |
| **Seções (11 macro, complete/essential/custom)** | ✓ | `SECOES_CANONICAS` + `ESTRUTURAS` (`generator.py:42-49`); endpoint demo aceita `estrutura/secoes` | — (no ingest, você decide as páginas; reusar a lista) |
| **Motivos gráficos (padrões/divisores/ornamentos)** | ⚠ | Divisores e "motivo" existem só no premium do demo (`generator.py:537-549`, `api/demo/logo.py`) | Biblioteca de motivos como `Media` reutilizável + helper de inserção |
| **Card de produto (variantes: img topo/lateral, com/sem preço, badges)** | ⚠ | `ProductData` tem `badge`, `specs`, `isNew` (`editor.ts:148-160`) mas `product-card` é placeholder; variantes = composição manual (`generator.py:499-534`) | Tornar `product-card` renderizável por `productData` **ou** um `Catalog.card_variant` que o gerador honra |
| **Branding (logo header/footer/capa/marca d'água; monograma×wordmark)** | ⚠ | `HeaderFooterConfig.logo/logoPosition` (`editor.ts:379-394`) e geração de logo (`api/demo/logo.py`), mas **header/footer não persistem** (§10) | Coluna `Page.header/footer` (JSON) + loader lê de volta; ou elementos de marca fixos por página |
| **Fundo de página (sólido/gradiente/padrão/imagem)** | ⚠ | `Page.background_image` (FK Media) existe (`models.py:222-226`) — mas **o ingest não seta** (só `save_content` via payload `background_image`); gradiente/padrão = `shape-rectangle` | Aceitar `pages[i].background` no ingest → `Page.background_image`; gradiente via `style` em shape full-bleed |
| **Estética (raio/sombra; presets de mood)** | ⚠ | `borderRadius`/`shadows` em tokens e `style` (`designTokens.ts:113-143`, `editor.ts:75,80,103`) | `designTokens.custom.mood` + presets ("minimal/bold/elegante/divertido") aplicados na geração |
| **Formato de página (A4 retrato/paisagem, quadrado IG, story)** | ✗ | Canvas A4 fixo 794×1123 (`layoutRules.ts:28-30`); loader ignora tamanho | Coluna `Catalog.page_size`/`Page.size` (w,h) + loader/editor honram |
| **Locale (pt-BR, R$)** | ⚠ | `productData.currency` (`editor.ts:152`), demo formata `R$` no texto (`generator.py:533`); `catalogSchema` aceita `catalog.language` (`catalogSchema.ts`) mas o envelope de export **não** emite | Persistir `Catalog.locale`/`currency` e formatar no render |

### Prioridade (impacto × esforço)

1. **Fundo de página no ingest** (`pages[i].background → Page.background_image`) — alto impacto,
   baixo esforço (a coluna já existe; só faltar fiar no ingest).
2. **`product-card` renderizável por `productData`** — alto impacto (remove a maior pegadinha),
   esforço médio (mexer no `ElementRenderer`).
3. **Helper `gerar_paleta(cor_marca) → designTokens`** reutilizável no ingest — alto impacto,
   baixo esforço (lógica já existe em `identidade.py`).
4. **Persistir `Page.header/footer`** (round-trip de marca) — médio impacto, médio esforço
   (migração + loader).
5. **Formato de página** (`Catalog.page_size`) — médio impacto, esforço alto (editor + PDF + loader).
6. **Tema claro/escuro** — médio impacto, esforço alto.

---

## 12. O que NÃO foi confirmado

- **Renderização exata por `ElementRenderer`** de cada tipo round-trip-safe (li loader/ingest/
  gerador, não o `ElementRenderer` por completo). A confiança vem do gerador de demo, que produz as
  **mesmas linhas** e renderiza/exporta PDF na prática.
- **Comportamento dos `dipack-*`** ao serem materializados por JSON autoral (templates de plugin
  hardcoded) — provavelmente não round-trip-safe; evitar.
- Se `text-*` renderiza preferindo `content.text` ou `textData.content` — o demo usa
  `content.text` (`generator.py:119`) e funciona; por segurança o exemplo §7 usa `content.text`.
- Página em paisagem/quadrado no canvas — o modelo não guarda tamanho; não testado.
```
