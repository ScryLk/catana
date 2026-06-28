"""
DIV-04: testes dos caminhos críticos.

Cobrem:
- Fase 2 (SEG-02): endpoints privados exigem autenticação (401), públicos não.
- Fase 3 (INC-01): save_content é transacional e idempotente (sem órfãos).
- Fase 4 (INC-05): bulk_import cria produtos e reporta erros por linha.

Usa force_authenticate (não assina JWT) para não depender de cripto no runner.
"""
from rest_framework.test import APITestCase, APIRequestFactory, force_authenticate

from .models import (
    User, Organization, Sede, Catalog, Page, Component, PageComponent, Category,
    Product,
)
from . import views


class AuthGateTests(APITestCase):
    """SEG-02: o gate de autenticação está ligado de verdade."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='ed', email='ed@e.com', password='x', role='editor'
        )

    def _anon_status(self, viewset, action='list', method='get'):
        view = viewset.as_view({method: action})
        return view(getattr(self.factory, method)('/')).status_code

    def test_private_viewsets_require_auth(self):
        for vs in [views.ProductViewSet, views.OrganizationViewSet,
                   views.CatalogViewSet, views.MediaViewSet,
                   views.MediaFolderViewSet, views.CategoryViewSet,
                   views.SedeViewSet]:
            self.assertEqual(self._anon_status(vs), 401,
                             f'{vs.__name__} deveria exigir autenticação')

    def test_explore_is_public(self):
        self.assertEqual(self._anon_status(views.ExploreProductViewSet), 200)

    def test_authenticated_can_list_products(self):
        view = views.ProductViewSet.as_view({'get': 'list'})
        req = self.factory.get('/')
        force_authenticate(req, user=self.user)
        self.assertEqual(view(req).status_code, 200)


class SaveContentTests(APITestCase):
    """INC-01: persistência relacional do editor, transacional e idempotente."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='ed', email='ed@e.com', password='x', role='editor'
        )
        self.org = Organization.objects.create(name='O', owner=self.user)
        self.user.organizations.add(self.org)
        self.catalog = Catalog.objects.create(
            title='C', description='', organization=self.org, created_by=self.user
        )

    def _save(self, payload):
        view = views.CatalogViewSet.as_view({'post': 'save_content'})
        req = self.factory.post('/', payload, format='json')
        force_authenticate(req, user=self.user)
        return view(req, pk=self.catalog.id)

    def _payload(self):
        return {'pages': [
            {'order': 0, 'elements': [
                {'type': 'text-title', 'name': 'T',
                 'position': {'x': 10, 'y': 20},
                 'size': {'width': 100, 'height': 30}, 'zIndex': 0,
                 'content': {'text': 'Oi'}},
                {'type': 'product-card',
                 'position': {'x': 5, 'y': 5},
                 'size': {'width': 200, 'height': 150}, 'zIndex': 1},
            ]},
            {'order': 1, 'elements': [
                {'type': 'image', 'position': {'x': 0, 'y': 0},
                 'size': {'width': 50, 'height': 50}, 'zIndex': 0},
            ]},
        ]}

    def test_save_creates_relational_content(self):
        resp = self._save(self._payload())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Page.objects.filter(catalog=self.catalog).count(), 2)
        self.assertEqual(Component.objects.count(), 3)
        self.assertEqual(PageComponent.objects.count(), 3)
        pc = PageComponent.objects.get(component__name='T')
        self.assertEqual((pc.position_x, pc.position_y, pc.width, pc.height),
                         (10, 20, 100, 30))

    def test_save_is_idempotent_without_orphans(self):
        self._save(self._payload())
        self._save(self._payload())
        # Mesmos números após salvar duas vezes: nada duplica nem fica órfão.
        self.assertEqual(Page.objects.filter(catalog=self.catalog).count(), 2)
        self.assertEqual(Component.objects.count(), 3)
        self.assertEqual(PageComponent.objects.count(), 3)


class BulkImportTests(APITestCase):
    """INC-05: importação de produtos em lote."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='ed', email='ed@e.com', password='x', role='editor'
        )
        self.org = Organization.objects.create(name='O', owner=self.user)
        self.user.organizations.add(self.org)
        self.sede = Sede.objects.create(name='S', organization=self.org)
        self.user.sedes.add(self.sede)

    def _import(self, products):
        view = views.ProductViewSet.as_view({'post': 'bulk_import'})
        req = self.factory.post('/', {
            'products': products,
            'organization': self.org.id,
            'sede': self.sede.id,
        }, format='json')
        force_authenticate(req, user=self.user)
        return view(req)

    def test_imports_valid_rows(self):
        resp = self._import([
            {'name': 'P1', 'sku': 'S1', 'price': '10.00'},
            {'name': 'P2', 'sku': 'S2', 'price': '20.00'},
        ])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['success'], 2)
        self.assertEqual(resp.data['failed'], 0)
        self.assertEqual(Product.objects.count(), 2)

    def test_duplicate_sku_is_reported(self):
        Product.objects.create(
            name='X', description='', price=1, sku='DUP', stock=0,
            organization=self.org, sede=self.sede, created_by=self.user,
        )
        resp = self._import([{'name': 'P', 'sku': 'DUP', 'price': '1.00'}])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['failed'], 1)
        self.assertTrue(resp.data['errors'])
