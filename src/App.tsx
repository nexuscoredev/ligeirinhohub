import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotaProtegida } from '@/components/RotaProtegida';
import { PerfilProvider } from '@/contexts/PerfilContext';
import { TemaProvider } from '@/contexts/TemaContext';
import { MainLayout } from '@/layouts/MainLayout';
import '@/layouts/MainLayout.css';
import { PainelAdminPage } from '@/pages/admin/PainelAdminPage';
import { ProdutosAdminPage } from '@/pages/admin/ProdutosAdminPage';
import { SistemasPage } from '@/pages/admin/SistemasPage';
import { UsuariosPage } from '@/pages/admin/UsuariosPage';
import { VisaoEstrategicaPage } from '@/pages/admin/VisaoEstrategicaPage';
import { BemVindoPage } from '@/pages/BemVindoPage';
import { PerfilPage } from '@/pages/perfil/PerfilPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MotoristaPage } from '@/pages/motorista/MotoristaPage';
import { MarketingPainelPage } from '@/pages/marketing/MarketingPainelPage';
import { CriarArtePage } from '@/pages/marketing/creator/CriarArtePage';
import { GaleriaPage } from '@/pages/marketing/creator/GaleriaPage';
import { PromocoesPage } from '@/pages/marketing/PromocoesPage';
import { TvPreviewPage } from '@/pages/marketing/TvPreviewPage';
import { FilaOperacionalPage } from '@/pages/operacional/FilaOperacionalPage';
import { SeparacaoPage } from '@/pages/operacional/SeparacaoPage';
import { PedidosPage } from '@/pages/pedidos/PedidosPage';
import { PdvPage } from '@/pages/pdv/PdvPage';
import { TotemPage } from '@/pages/totem/TotemPage';
import { VeiculosPage } from '@/pages/veiculos/VeiculosPage';
import { SobrePage } from '@/pages/SobrePage';

export default function App() {
  return (
    <ErrorBoundary>
      <TemaProvider>
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
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/admin" element={<PainelAdminPage />} />
              <Route path="/admin/estrategico" element={<VisaoEstrategicaPage />} />
              <Route path="/admin/usuarios" element={<UsuariosPage />} />
              <Route path="/admin/sistemas" element={<SistemasPage />} />
              <Route path="/admin/produtos" element={<ProdutosAdminPage />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/produtos" element={<Navigate to="/admin/produtos" replace />} />
              <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />

              <Route path="/pdv" element={<PdvPage />} />
              <Route path="/totem" element={<TotemPage />} />

              <Route path="/operacional" element={<FilaOperacionalPage />} />
              <Route path="/operacional/separar/:id" element={<SeparacaoPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/motorista" element={<MotoristaPage />} />
              <Route path="/veiculos" element={<VeiculosPage />} />
              <Route path="/marketing" element={<MarketingPainelPage />} />
              <Route path="/marketing/criar" element={<CriarArtePage />} />
              <Route path="/marketing/galeria" element={<GaleriaPage />} />
              <Route path="/marketing/promocoes" element={<PromocoesPage />} />
              <Route path="/marketing/tv" element={<TvPreviewPage />} />
              <Route path="/sobre" element={<SobrePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/bem-vindo" replace />} />
          </Routes>
        </BrowserRouter>
        </PerfilProvider>
      </TemaProvider>
    </ErrorBoundary>
  );
}
