import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotaProtegida } from '@/components/RotaProtegida';
import { PerfilProvider } from '@/contexts/PerfilContext';
import { MainLayout } from '@/layouts/MainLayout';
import '@/layouts/MainLayout.css';
import { BemVindoPage } from '@/pages/BemVindoPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

export default function App() {
  return (
    <ErrorBoundary>
      <PerfilProvider>
        <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <RotaProtegida>
                    <MainLayout />
                  </RotaProtegida>
                }
              >
                <Route path="/" element={<Navigate to="/bem-vindo" replace />} />
                <Route path="/bem-vindo" element={<BemVindoPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/pdv"
                  element={
                    <PlaceholderPage
                      titulo="PDV"
                      descricao="Venda assistida no balcão — caixa e pagamento."
                    />
                  }
                />
                <Route
                  path="/totem"
                  element={
                    <PlaceholderPage
                      titulo="Totem"
                      descricao="Autoatendimento touch-first (PWA)."
                    />
                  }
                />
                <Route
                  path="/operacional"
                  element={
                    <PlaceholderPage
                      titulo="Operacional"
                      descricao="Fila de pedidos, preparo e despacho."
                    />
                  }
                />
                <Route
                  path="/motorista"
                  element={
                    <PlaceholderPage
                      titulo="Motoristas"
                      descricao="Entregas atribuídas e confirmação em rota."
                    />
                  }
                />
                <Route
                  path="/produtos"
                  element={
                    <PlaceholderPage
                      titulo="Produtos"
                      descricao="Cadastro de bebidas e preços."
                    />
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <PlaceholderPage
                      titulo="Clientes"
                      descricao="Cadastro de clientes da adega."
                    />
                  }
                />
                <Route
                  path="/pedidos"
                  element={
                    <PlaceholderPage
                      titulo="Pedidos"
                      descricao="Vendas e fluxo operacional."
                    />
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <PlaceholderPage
                      titulo="Usuários"
                      descricao="Gestão de acessos e cargos."
                    />
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/bem-vindo" replace />} />
            </Routes>
        </BrowserRouter>
      </PerfilProvider>
    </ErrorBoundary>
  );
}
