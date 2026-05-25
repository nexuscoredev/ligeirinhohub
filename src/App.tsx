import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotaProtegida } from '@/components/RotaProtegida';
import { PerfilProvider } from '@/contexts/PerfilContext';
import { MainLayout } from '@/layouts/MainLayout';
import '@/layouts/MainLayout.css';
import { BemVindoPage } from '@/pages/BemVindoPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MotoristaPage } from '@/pages/motorista/MotoristaPage';
import { FilaOperacionalPage } from '@/pages/operacional/FilaOperacionalPage';
import { SeparacaoPage } from '@/pages/operacional/SeparacaoPage';
import { PedidosPage } from '@/pages/pedidos/PedidosPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { ProdutosPage } from '@/pages/produtos/ProdutosPage';

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
                    titulo="Painel do caixa"
                    descricao="PDV — vendas no balcão (Fase 2)."
                    icone="🛒"
                  />
                }
              />
              <Route
                path="/totem"
                element={
                  <PlaceholderPage
                    titulo="Autoatendimento"
                    descricao="Totem touch — pedido pelo cliente (Fase 2)."
                    icone="📱"
                  />
                }
              />

              <Route path="/operacional" element={<FilaOperacionalPage />} />
              <Route path="/operacional/separar/:id" element={<SeparacaoPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/motorista" element={<MotoristaPage />} />

              <Route path="/produtos" element={<ProdutosPage />} />
              <Route
                path="/usuarios"
                element={
                  <PlaceholderPage
                    titulo="Usuários"
                    descricao="Gestão de perfis e permissões (Fase 1)."
                    icone="🔐"
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
