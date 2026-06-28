"""
Gerador de catálogos de demonstração.

Escreve DIRETO no banco (Organization/Sede/Category/Product/ProductMedia/Media/
Catalog/Page/Component/PageComponent), espelhando exatamente o formato que o
front `catalogLoader.service.ts` reconstrói:

- geometria  -> colunas do PageComponent (position_x/y, width, height, layer)
- resto      -> Component.content (JSON espelho de CatalogElement), com o estilo
                do tema BAKED em valores concretos (não usa design tokens globais)

Página em coordenadas 794 x 1123 (A4 @ 96dpi), igual ao editor/PDF do front.
Imagens são gravadas como URL RELATIVA (/media/...); o front prefixa a base.

Idempotente: regerar o mesmo tema apaga a Organization demo anterior (cascata
remove sedes/categorias/produtos/mídia/catálogo/páginas/componentes) e recria.
"""
import json
import os

from django.conf import settings
from django.core.files import File
from django.db import transaction

from ..models import (
    User, Organization, Sede, Category, Product, ProductMedia, Media,
    Catalog, Page, Component, PageComponent,
)
from .themes import get_theme

# ---- Layout (mesmo espaço de coordenadas do front) ----
PAGE_W = 794
PAGE_H = 1123
MARGIN = 56
CONTENT_W = PAGE_W - 2 * MARGIN  # 682

# Seções macro e presets de estrutura.
SECOES_CANONICAS = [
    'capa', 'apresentacao', 'sobre', 'indice', 'divisores', 'produtos',
    'especiais', 'precos', 'como_comprar', 'termos', 'contracapa',
]
ESTRUTURAS = {
    'completo': SECOES_CANONICAS,
    'essencial': ['capa', 'apresentacao', 'produtos', 'como_comprar', 'contracapa'],
}

DEMO_USER = 'catana_demo'


# ============================================================
# Builders de elemento (baked style no content)
# ============================================================

class PageBuilder:
    """Acumula elementos de uma página e cria Component/PageComponent."""

    def __init__(self, catalog, order, org, sede, user):
        self.page = Page.objects.create(catalog=catalog, order=order)
        self.org = org
        self.sede = sede
        self.user = user
        self.layer = 0

    def add(self, content, x, y, w, h):
        comp_type = content.get('type', 'text')
        if comp_type.startswith('text'):
            component_type = 'text'
        elif comp_type in ('image', 'uploaded-image'):
            component_type = 'image'
        else:
            component_type = 'text'  # shapes entram como 'text' (genérico)

        component = Component.objects.create(
            name=content.get('name') or comp_type,
            component_type=component_type,
            content=content,
            is_reusable=False,
            organization=self.org,
            sede=self.sede,
            created_by=self.user,
        )
        PageComponent.objects.create(
            page=self.page,
            component=component,
            position_x=int(round(x)),
            position_y=int(round(y)),
            width=int(round(w)),
            height=int(round(h)),
            layer=self.layer,
        )
        self.layer += 1


def el_rect(bg, radius=0, border_color=None, border_width=0, name='Retângulo'):
    style = {'backgroundColor': bg, 'borderRadius': radius}
    if border_color and border_width:
        style.update({'borderColor': border_color, 'borderWidth': border_width, 'borderStyle': 'solid'})
    return {'type': 'shape-rectangle', 'name': name, 'style': style}


def el_text(text, size, color, font, weight='normal', align='left', line_height=1.3,
            kind='text-paragraph', name='Texto', letter_spacing=0):
    return {
        'type': kind,
        'name': name,
        'style': {
            'fontFamily': font,
            'fontSize': size,
            'fontWeight': str(weight),
            'textColor': color,
            'textAlign': align,
            'lineHeight': line_height,
            'letterSpacing': letter_spacing,
        },
        'content': {'text': text},
    }


def el_image(src, radius=0, object_fit='cover', name='Imagem'):
    # Grava imageData.src E imageUrl: o canvas usa imageData (ImageFigma) e o
    # preview/PDF usa imageUrl (fallback). Ambos relativos /media/...
    return {
        'type': 'image',
        'name': name,
        'style': {'borderRadius': radius, 'objectFit': object_fit},
        'imageUrl': src,
        'imageData': {
            'src': src,
            'opacity': 1,
            'borderRadius': radius,
            'objectFit': object_fit,
            'aspectRatioLocked': False,
        },
    }


# ============================================================
# Persistência de imagens (padrão dos seed scripts)
# ============================================================

def _criar_media(path, nome, org, sede, user):
    """Cria Media copiando o arquivo local para /media/. Retorna (media, url)."""
    if not path or not os.path.exists(path):
        return None, None
    with open(path, 'rb') as fh:
        media = Media(
            name=os.path.basename(path),
            organization=org,
            sede=sede,
            uploaded_by=user,
            media_type='image',
        )
        media.file.save(os.path.basename(path), File(fh), save=True)
    return media, media.file.url  # url relativa: /media/...


# ============================================================
# Geração
# ============================================================

def _carregar_manifest(tema=None, manifest_path=None):
    if manifest_path:
        path = manifest_path
    else:
        path = os.path.join(settings.BASE_DIR, 'demo_assets', tema, 'manifest.json')
    if not os.path.exists(path):
        raise FileNotFoundError(f'Manifest não encontrado: {path}')
    with open(path, encoding='utf-8') as fh:
        manifest = json.load(fh)
    base_dir = os.path.dirname(path)
    return manifest, base_dir


def _resolver_secoes(estrutura, secoes):
    if estrutura == 'custom':
        pedidas = [s for s in (secoes or []) if s in SECOES_CANONICAS]
        return pedidas or ESTRUTURAS['essencial']
    return ESTRUTURAS.get(estrutura, ESTRUTURAS['completo'])


@transaction.atomic
def gerar_catalogo_demo(tema=None, manifest_path=None, estrutura='completo',
                        secoes=None, b2b=False, periodo=None):
    """
    Gera (ou regenera) o catálogo demo de um tema. Retorna o Catalog criado.
    """
    manifest, base_dir = _carregar_manifest(tema, manifest_path)
    tema = manifest.get('tema', tema)
    theme = get_theme(tema)
    cores = theme['paleta']
    fontes = theme['fontes']
    empresa = manifest.get('empresa', {})
    secoes_ativas = _resolver_secoes(estrutura, secoes)
    incluir_divisores = 'divisores' in secoes_ativas
    incluir_b2b = b2b and bool(manifest.get('b2b'))

    user, _ = User.objects.get_or_create(
        username=DEMO_USER,
        defaults={'email': 'demo@catana.local', 'role': 'admin'},
    )

    org_name = f'[DEMO] {theme["nome"]}'
    # Idempotência: remove a org demo anterior (cascata limpa tudo abaixo).
    Organization.objects.filter(name=org_name, owner=user).delete()

    org = Organization.objects.create(name=org_name, owner=user)
    sede = Sede.objects.create(name='Matriz', organization=org, responsible_user=user)
    org.default_sede = sede
    org.save(update_fields=['default_sede'])
    user.organizations.add(org)
    user.sedes.add(sede)

    # Categorias
    cat_objs = {}
    for nome_cat in manifest.get('categorias', []):
        cat_objs[nome_cat] = Category.objects.create(
            name=nome_cat, organization=org, sede=sede, created_by=user,
        )

    # Produtos + imagens
    produtos = []
    for idx, p in enumerate(manifest.get('produtos', [])):
        img_path = os.path.join(base_dir, 'images', p.get('imagem', '')) if p.get('imagem') else None
        media, url = _criar_media(img_path, p['nome'], org, sede, user)
        produto = Product.objects.create(
            name=p['nome'],
            description=p.get('descricao', ''),
            price=p.get('preco') or '0',
            sku=f'DEMO-{tema}-{idx:03d}',
            stock=100,
            currency='BRL',
            category=cat_objs.get(p.get('categoria')),
            specs=p.get('specs', []),
            cover_image=media,
            organization=org,
            sede=sede,
            created_by=user,
        )
        if media:
            ProductMedia.objects.create(product=produto, media=media, order=0)
        produtos.append({**p, '_url': url, '_obj': produto})

    # Catálogo
    catalog = Catalog.objects.create(
        title=theme['nome'],
        description=empresa.get('slogan', ''),
        organization=org,
        sede=sede,
        created_by=user,
        is_public=True,
        is_demo=True,
    )

    order = 0
    ctx = dict(catalog=catalog, org=org, sede=sede, user=user, cores=cores,
               fontes=fontes, empresa=empresa, produtos=produtos, manifest=manifest,
               periodo=periodo, incluir_divisores=incluir_divisores,
               incluir_b2b=incluir_b2b)

    builders = {
        'capa': _sec_capa,
        'apresentacao': _sec_apresentacao,
        'sobre': _sec_sobre,
        'indice': _sec_indice,
        'produtos': _sec_produtos,
        'especiais': _sec_especiais,
        'precos': _sec_precos,
        'como_comprar': _sec_como_comprar,
        'termos': _sec_termos,
        'contracapa': _sec_contracapa,
    }
    for sec in secoes_ativas:
        if sec in ('divisores',):
            continue  # modificador, não é página própria
        builder = builders.get(sec)
        if not builder:
            continue
        order = builder(ctx, order)

    return catalog


# ---- helpers de seção ----

def _bg(page, cor):
    page.add(el_rect(cor, name='Fundo'), 0, 0, PAGE_W, PAGE_H)


def _faixa(page, cor, y, h):
    page.add(el_rect(cor, name='Faixa'), 0, y, PAGE_W, h)


def _new_page(ctx, order):
    return PageBuilder(ctx['catalog'], order, ctx['org'], ctx['sede'], ctx['user']), order + 1


def _sec_capa(ctx, order):
    (page, order), cores, fontes, empresa = _new_page(ctx, order), ctx['cores'], ctx['fontes'], ctx['empresa']
    _bg(page, cores['primary'])
    hero = ctx['produtos'][0]['_url'] if ctx['produtos'] else None
    if hero:
        page.add(el_image(hero, radius=18, name='Hero'), MARGIN, 130, CONTENT_W, 430)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 600, 90, 6)
    page.add(el_text(empresa.get('nome', ctx['manifest'].get('tema', '')), 54,
                     cores['textOnPrimary'], fontes['titulo'], weight='bold',
                     align='left', kind='text-title', name='Nome'),
             MARGIN, 626, CONTENT_W, 130)
    page.add(el_text(empresa.get('slogan', ''), 26, cores['accent'], fontes['corpo'],
                     align='left', name='Slogan'), MARGIN, 760, CONTENT_W, 70)
    rotulo = ctx['periodo'] or 'Catálogo de produtos'
    page.add(el_text(rotulo.upper(), 16, cores['textOnPrimary'], fontes['corpo'],
                     align='left', letter_spacing=2, name='Rótulo'),
             MARGIN, 1030, CONTENT_W, 40)
    return order


def _sec_apresentacao(ctx, order):
    (page, order), cores, fontes, empresa = _new_page(ctx, order), ctx['cores'], ctx['fontes'], ctx['empresa']
    _bg(page, cores['background'])
    page.add(el_text('Bem-vindo', 42, cores['primary'], fontes['titulo'], weight='bold',
                     kind='text-title', name='Título'), MARGIN, 110, CONTENT_W, 80)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 196, 80, 5)
    page.add(el_text(empresa.get('sobre', ''), 20, cores['text'], fontes['corpo'],
                     line_height=1.6, name='Intro'), MARGIN, 232, CONTENT_W, 220)
    img = ctx['produtos'][1]['_url'] if len(ctx['produtos']) > 1 else (
        ctx['produtos'][0]['_url'] if ctx['produtos'] else None)
    if img:
        page.add(el_image(img, radius=16, name='Imagem'), MARGIN, 480, CONTENT_W, 470)
    return order


def _sec_sobre(ctx, order):
    (page, order), cores, fontes, empresa = _new_page(ctx, order), ctx['cores'], ctx['fontes'], ctx['empresa']
    _bg(page, cores['surface'])
    _faixa(page, cores['primary'], 0, 150)
    page.add(el_text('Sobre a empresa', 34, cores['textOnPrimary'], fontes['titulo'],
                     weight='bold', kind='text-title', name='Título'), MARGIN, 54, CONTENT_W, 60)
    page.add(el_text(empresa.get('sobre', ''), 19, cores['text'], fontes['corpo'],
                     line_height=1.7, name='Texto'), MARGIN, 210, CONTENT_W, 320)
    contato = empresa.get('contato', {})
    linhas = [
        ('Telefone', contato.get('telefone')),
        ('Endereço', contato.get('endereco')),
        ('Instagram', contato.get('instagram')),
        ('WhatsApp', contato.get('whatsapp')),
    ]
    y = 580
    page.add(el_text('Contato', 24, cores['primary'], fontes['titulo'], weight='bold',
                     name='Contato'), MARGIN, y, CONTENT_W, 44)
    y += 56
    for rotulo, valor in linhas:
        if not valor:
            continue
        page.add(el_text(f'{rotulo}:  {valor}', 18, cores['textMuted'], fontes['corpo'],
                         name=rotulo), MARGIN, y, CONTENT_W, 36)
        y += 44
    return order


def _sec_indice(ctx, order):
    (page, order), cores, fontes = _new_page(ctx, order), ctx['cores'], ctx['fontes']
    _bg(page, cores['background'])
    page.add(el_text('Índice', 40, cores['primary'], fontes['titulo'], weight='bold',
                     kind='text-title', name='Título'), MARGIN, 110, CONTENT_W, 80)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 196, 80, 5)
    y = 250
    for i, cat in enumerate(ctx['manifest'].get('categorias', []), start=1):
        page.add(el_text(f'{i:02d}', 22, cores['accent'], fontes['titulo'], weight='bold',
                         name='Num'), MARGIN, y, 60, 36)
        page.add(el_text(cat, 22, cores['text'], fontes['corpo'], name='Cat'),
                 MARGIN + 70, y, CONTENT_W - 70, 36)
        page.add(el_rect(cores['border'], name='Linha'), MARGIN, y + 46, CONTENT_W, 1)
        y += 64
    return order


def _card_produto(page, cores, fontes, prod, x, y, w, h):
    page.add(el_rect(cores['surface'], radius=14, border_color=cores['border'],
                     border_width=1, name='Card'), x, y, w, h)
    img_h = int(h * 0.58)
    if prod.get('_url'):
        page.add(el_image(prod['_url'], radius=12, name='Foto'), x + 10, y + 10, w - 20, img_h - 10)
    ty = y + img_h + 6
    page.add(el_text(prod['nome'], 19, cores['text'], fontes['titulo'], weight='bold',
                     name='Nome'), x + 16, ty, w - 32, 48)
    page.add(el_text(prod.get('descricao', ''), 13, cores['textMuted'], fontes['corpo'],
                     line_height=1.35, name='Desc'), x + 16, ty + 46, w - 32, 52)
    preco = prod.get('preco', '0')
    page.add(el_text(f'R$ {preco}', 22, cores['primary'], fontes['titulo'], weight='bold',
                     name='Preço'), x + 16, y + h - 46, w - 32, 36)


def _sec_produtos(ctx, order):
    cores, fontes = ctx['cores'], ctx['fontes']
    # Agrupa por categoria, na ordem do manifest.
    por_cat = {}
    for prod in ctx['produtos']:
        por_cat.setdefault(prod.get('categoria', 'Produtos'), []).append(prod)

    cols, rows = 2, 3
    gap = 28
    card_w = (CONTENT_W - gap) / cols
    top0 = 180
    card_h = (PAGE_H - top0 - MARGIN - gap * (rows - 1)) / rows

    for categoria, itens in por_cat.items():
        # nova página por categoria
        page, order = _new_page(ctx, order)
        _bg(page, cores['background'])
        if ctx['incluir_divisores']:
            _faixa(page, cores['primary'], 0, 120)
            page.add(el_text(categoria, 32, cores['textOnPrimary'], fontes['titulo'],
                             weight='bold', kind='text-title', name='Categoria'),
                     MARGIN, 40, CONTENT_W, 56)
        else:
            page.add(el_text(categoria, 30, cores['primary'], fontes['titulo'],
                             weight='bold', kind='text-title', name='Categoria'),
                     MARGIN, 90, CONTENT_W, 56)
        slot = 0
        for prod in itens:
            if slot == cols * rows:
                page, order = _new_page(ctx, order)
                _bg(page, cores['background'])
                page.add(el_text(f'{categoria} (cont.)', 24, cores['primary'],
                                 fontes['titulo'], weight='bold', kind='text-title',
                                 name='Categoria'), MARGIN, 90, CONTENT_W, 50)
                slot = 0
            r, cidx = divmod(slot, cols)
            x = MARGIN + cidx * (card_w + gap)
            y = top0 + r * (card_h + gap)
            _card_produto(page, cores, fontes, prod, x, y, card_w, card_h)
            slot += 1
    return order


def _sec_especiais(ctx, order):
    (page, order), cores, fontes = _new_page(ctx, order), ctx['cores'], ctx['fontes']
    _bg(page, cores['primary'])
    page.add(el_text('Destaques da casa', 40, cores['textOnPrimary'], fontes['titulo'],
                     weight='bold', kind='text-title', name='Título'), MARGIN, 90, CONTENT_W, 70)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 168, 90, 6)
    destaques = ctx['produtos'][:3]
    y = 220
    for prod in destaques:
        page.add(el_rect(cores['surface'], radius=14, name='Card'), MARGIN, y, CONTENT_W, 230)
        if prod.get('_url'):
            page.add(el_image(prod['_url'], radius=12, name='Foto'), MARGIN + 14, y + 14, 280, 202)
        tx = MARGIN + 320
        page.add(el_text(prod['nome'], 26, cores['text'], fontes['titulo'], weight='bold',
                         name='Nome'), tx, y + 24, CONTENT_W - 340, 44)
        page.add(el_text(prod.get('descricao', ''), 16, cores['textMuted'], fontes['corpo'],
                         line_height=1.5, name='Desc'), tx, y + 76, CONTENT_W - 340, 90)
        page.add(el_text(f'R$ {prod.get("preco", "0")}', 26, cores['primary'],
                         fontes['titulo'], weight='bold', name='Preço'),
                 tx, y + 170, CONTENT_W - 340, 40)
        y += 254
    return order


def _sec_precos(ctx, order):
    (page, order), cores, fontes = _new_page(ctx, order), ctx['cores'], ctx['fontes']
    _bg(page, cores['background'])
    page.add(el_text('Tabela de preços', 38, cores['primary'], fontes['titulo'],
                     weight='bold', kind='text-title', name='Título'), MARGIN, 100, CONTENT_W, 70)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 176, 80, 5)
    y = 220
    # cabeçalho
    page.add(el_rect(cores['primary'], name='Cab'), MARGIN, y, CONTENT_W, 44)
    page.add(el_text('Produto', 16, cores['textOnPrimary'], fontes['corpo'], weight='bold',
                     name='h1'), MARGIN + 16, y + 10, CONTENT_W - 200, 28)
    page.add(el_text('Preço', 16, cores['textOnPrimary'], fontes['corpo'], weight='bold',
                     align='right', name='h2'), MARGIN + CONTENT_W - 180, y + 10, 164, 28)
    y += 44
    for i, prod in enumerate(ctx['produtos']):
        if y > PAGE_H - 200:
            break
        if i % 2 == 0:
            page.add(el_rect(cores['surface'], name='Linha'), MARGIN, y, CONTENT_W, 38)
        page.add(el_text(prod['nome'], 15, cores['text'], fontes['corpo'], name='p'),
                 MARGIN + 16, y + 8, CONTENT_W - 200, 26)
        page.add(el_text(f'R$ {prod.get("preco", "0")}', 15, cores['primary'], fontes['corpo'],
                         weight='bold', align='right', name='v'),
                 MARGIN + CONTENT_W - 180, y + 8, 164, 26)
        y += 38

    if ctx['incluir_b2b']:
        b2b = ctx['manifest']['b2b']
        y += 24
        page.add(el_text(b2b.get('titulo', 'Atacado'), 24, cores['primary'], fontes['titulo'],
                         weight='bold', name='B2B'), MARGIN, y, CONTENT_W, 40)
        y += 50
        fgap = 16
        fw = (CONTENT_W - 2 * fgap) / 3
        for j, faixa in enumerate(b2b.get('faixas', [])[:3]):
            fx = MARGIN + j * (fw + fgap)
            page.add(el_rect(cores['surface'], radius=12, border_color=cores['border'],
                             border_width=1, name='Faixa'), fx, y, fw, 110)
            page.add(el_text(faixa.get('quantidade', ''), 16, cores['textMuted'],
                             fontes['corpo'], align='center', name='q'), fx, y + 18, fw, 30)
            page.add(el_text(faixa.get('desconto', ''), 28, cores['primary'], fontes['titulo'],
                             weight='bold', align='center', name='d'), fx, y + 52, fw, 44)
        obs = b2b.get('observacao')
        if obs:
            page.add(el_text(obs, 14, cores['textMuted'], fontes['corpo'], line_height=1.5,
                             name='Obs'), MARGIN, y + 130, CONTENT_W, 60)
    return order


def _sec_como_comprar(ctx, order):
    (page, order), cores, fontes, empresa = _new_page(ctx, order), ctx['cores'], ctx['fontes'], ctx['empresa']
    _bg(page, cores['background'])
    page.add(el_text('Como comprar', 40, cores['primary'], fontes['titulo'], weight='bold',
                     kind='text-title', name='Título'), MARGIN, 110, CONTENT_W, 80)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 196, 80, 5)
    contato = empresa.get('contato', {})
    passos = [
        ('1', 'Escolha seus produtos', 'Navegue pelo catálogo e monte sua lista.'),
        ('2', 'Faça seu pedido', f'Chame no WhatsApp {contato.get("whatsapp", "")} ou ligue {contato.get("telefone", "")}.'),
        ('3', 'Retire ou receba', f'Retire na loja ({contato.get("endereco", "")}) ou peça entrega.'),
    ]
    y = 250
    for num, titulo, desc in passos:
        page.add(el_rect(cores['primary'], radius=24, name='Bolha'), MARGIN, y, 48, 48)
        page.add(el_text(num, 24, cores['textOnPrimary'], fontes['titulo'], weight='bold',
                         align='center', name='N'), MARGIN, y + 8, 48, 32)
        page.add(el_text(titulo, 24, cores['text'], fontes['titulo'], weight='bold',
                         name='T'), MARGIN + 70, y, CONTENT_W - 70, 38)
        page.add(el_text(desc, 17, cores['textMuted'], fontes['corpo'], line_height=1.5,
                         name='D'), MARGIN + 70, y + 40, CONTENT_W - 70, 60)
        y += 130
    return order


def _sec_termos(ctx, order):
    (page, order), cores, fontes = _new_page(ctx, order), ctx['cores'], ctx['fontes']
    _bg(page, cores['surface'])
    page.add(el_text('Termos e condições', 32, cores['primary'], fontes['titulo'],
                     weight='bold', kind='text-title', name='Título'), MARGIN, 110, CONTENT_W, 60)
    page.add(el_rect(cores['accent'], radius=3, name='Régua'), MARGIN, 176, 80, 5)
    termos = (
        '• Preços e disponibilidade sujeitos a alteração sem aviso prévio.\n'
        '• Imagens meramente ilustrativas.\n'
        '• Pedidos de atacado com antecedência mínima de 24 horas.\n'
        '• Produtos artesanais podem apresentar pequenas variações.\n'
        '• Este é um catálogo de demonstração, sem valor comercial.'
    )
    page.add(el_text(termos, 18, cores['text'], fontes['corpo'], line_height=1.9,
                     name='Termos'), MARGIN, 220, CONTENT_W, 400)
    return order


def _sec_contracapa(ctx, order):
    (page, order), cores, fontes, empresa = _new_page(ctx, order), ctx['cores'], ctx['fontes'], ctx['empresa']
    _bg(page, cores['primary'])
    page.add(el_text('Obrigado!', 56, cores['textOnPrimary'], fontes['titulo'], weight='bold',
                     align='center', kind='text-title', name='Obrigado'), MARGIN, 360, CONTENT_W, 90)
    page.add(el_text(empresa.get('slogan', ''), 24, cores['accent'], fontes['corpo'],
                     align='center', name='Slogan'), MARGIN, 470, CONTENT_W, 50)
    contato = empresa.get('contato', {})
    rodape = '   ·   '.join([v for v in [
        contato.get('instagram'), contato.get('telefone'), contato.get('endereco'),
    ] if v])
    page.add(el_text(rodape, 16, cores['textOnPrimary'], fontes['corpo'], align='center',
                     line_height=1.6, name='Rodapé'), MARGIN, 980, CONTENT_W, 80)
    return order
