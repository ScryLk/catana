import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CatalogEditor } from './pages/CatalogEditor';
import { MediaLibrary } from './pages/MediaLibrary';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserCatalogs } from './pages/UserCatalogs';
import { Organizations } from './pages/Organizations';
import { Profile } from './pages/Profile';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { useAuthStore } from './store/authStore';
import { CatalogShowcase } from './pages/CatalogShowcase';
import { ProductModal } from './components/catalog/ProductModal';
import { allProducts } from './lib/products';
import { PluginsProvider } from './contexts/PluginsContext';
import { Explore } from './pages/explore/Explore';
import { Products } from './pages/Products';
import { CreateProduct } from './pages/CreateProduct';
import { Categories } from './pages/Categories';
import { Inbox } from './pages/Inbox';
import { SearchResults } from './pages/SearchResults';
import { PublicProfilePage } from './pages/PublicProfile';
import { registerDiPackPlugin } from './plugins/dipack';
import { Toaster } from 'sonner';

// Register plugins
registerDiPackPlugin();

function LogoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <img src="/dipack3.png" alt="Logo DiPack" className="w-80 h-80 object-contain drop-shadow-2xl" />
    </div>
  );
}

function App() {
  const { checkAuth } = useAuthStore();
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);

  // Verificar autenticação ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Verificar hash da URL para abrir o modal do produto
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && allProducts.some(p => p.code === hash)) {
        setSelectedProductCode(hash);
      } else {
        setSelectedProductCode(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Verificar no carregamento inicial

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleCloseModal = () => {
    setSelectedProductCode(null);
    // Limpa o hash da URL sem recarregar a página
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  return (
    <PluginsProvider>
      <Toaster position="top-right" theme="dark" richColors />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/showcase/:id" element={<CatalogShowcase />} />
          <Route path="/logo" element={<LogoPage />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <SearchResults />
              </PrivateRoute>
            }
          />
          <Route path="/catalogs" element={
            <PrivateRoute>
              <UserCatalogs />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/editor" element={
            <PrivateRoute>
              <CatalogEditor />
            </PrivateRoute>
          } />
          <Route
            path="/media"
            element={
              <PrivateRoute>
                <MediaLibrary />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <PrivateRoute>
                <CreateProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <PrivateRoute>
                <CreateProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/edit/:id"
            element={
              <PrivateRoute>
                <CreateProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profiles/:username"
            element={
              <PrivateRoute>
                <PublicProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/logo" element={<LogoPage />} />
          <Route path="/organizations" element={
            <PrivateRoute>
              <Organizations />
            </PrivateRoute>
          } />
          <Route path="/catalogs" element={
            <PrivateRoute>
              <UserCatalogs />
            </PrivateRoute>
          } />
          {/* Adicione uma rota para o catálogo que pode não ser uma página real, mas ajuda na estrutura */}
          <Route path="/catalog/:id" element={<CatalogShowcase />} />
          <Route path="/inbox" element={
            <PrivateRoute>
              <Inbox />
            </PrivateRoute>
          } />
        </Routes>
      </Router>

      {
        selectedProductCode && (
          <ProductModal
            isOpen={!!selectedProductCode}
            productCode={selectedProductCode}
            onClose={handleCloseModal}
          />
        )
      }
    </PluginsProvider >
  );
}

export default App;