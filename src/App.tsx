import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RotaProtegida } from '@/components/RotaProtegida';
import { PerfilProvider } from '@/contexts/PerfilContext';
import { TemaProvider } from '@/contexts/TemaContext';
import { MainLayout } from '@/layouts/MainLayout';
import '@/layouts/MainLayout.css';
import { CadastrosBasePage } from '@/pages/admin/CadastrosBasePage';
import { PessoasAdminPage } from '@/pages/admin/PessoasAdminPage';
import { PainelAdminPage } from '@/pages/admin/PainelAdminPage';
import { ProdutosAdminPage } from '@/pages/admin/ProdutosAdminPage';
import { SistemasPage } from '@/pages/admin/SistemasPage';
import { UsuariosPage } from '@/pages/admin/UsuariosPage';
import { VisaoEstrategicaPage } from '@/pages/admin/VisaoEstrategicaPage';
import { RelatoriosFiscalPage } from '@/pages/admin/relatorios/RelatoriosFiscalPage';
import { RelatoriosPainelPage } from '@/pages/admin/relatorios/RelatoriosPainelPage';
import { RelatoriosVendasPage } from '@/pages/admin/relatorios/RelatoriosVendasPage';
import { CatalogoConfigPage } from '@/pages/admin/CatalogoConfigPage';
import { CatalogoPortalPage } from '@/pages/catalogo/CatalogoPortalPage';
import { ConfigCaixasPage } from '@/pages/admin/config/ConfigCaixasPage';
import { ConfigEmpresaPage } from '@/pages/admin/config/ConfigEmpresaPage';
import { ConfigFiscalPage } from '@/pages/admin/config/ConfigFiscalPage';
import { ConfigPainelPage } from '@/pages/admin/config/ConfigPainelPage';
import { BemVindoPage } from '@/pages/BemVindoPage';
import { PerfilPage } from '@/pages/perfil/PerfilPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FiscalEmitidasPage } from '@/pages/fiscal/FiscalEmitidasPage';
import { FiscalEmitirPage } from '@/pages/fiscal/FiscalEmitirPage';
import { FiscalPainelPage } from '@/pages/fiscal/FiscalPainelPage';
import { FiscalSeriesPage } from '@/pages/fiscal/FiscalSeriesPage';
import { FinanceiroCaixaPage } from '@/pages/financeiro/FinanceiroCaixaPage';
import { FinanceiroComissoesPage } from '@/pages/financeiro/FinanceiroComissoesPage';
import {
  FinanceiroPagarPage,
  FinanceiroReceberPage,
} from '@/pages/financeiro/FinanceiroContasPage';
import { FinanceiroPainelPage } from '@/pages/financeiro/FinanceiroPainelPage';
import { FinanceiroValesPage } from '@/pages/financeiro/FinanceiroValesPage';
import { EstoqueEntradaXmlPage } from '@/pages/estoque/EstoqueEntradaXmlPage';
import { EstoqueInventarioAppPage, EstoqueInventarioPage } from '@/pages/estoque/EstoqueInventarioPage';
import { EstoqueMovimentosPage } from '@/pages/estoque/EstoqueMovimentosPage';
import { EstoquePainelPage } from '@/pages/estoque/EstoquePainelPage';
import { LoginPage } from '@/pages/LoginPage';
import { MotoristaPage } from '@/pages/motorista/MotoristaPage';
import { MarketingPainelPage } from '@/pages/marketing/MarketingPainelPage';
import { CriarArtePage } from '@/pages/marketing/creator/CriarArtePage';
import { GaleriaPage } from '@/pages/marketing/creator/GaleriaPage';
import { PromocoesPage } from '@/pages/marketing/PromocoesPage';
import { TvPreviewPage } from '@/pages/marketing/TvPreviewPage';
import { NegociacaoEditorPage } from '@/pages/negociacao/NegociacaoEditorPage';
import { NegociacaoListaPage } from '@/pages/negociacao/NegociacaoListaPage';
import { FilaOperacionalPage } from '@/pages/operacional/FilaOperacionalPage';
import { SeparacaoPage } from '@/pages/operacional/SeparacaoPage';
import { PedidosPage } from '@/pages/pedidos/PedidosPage';
import { PdvPage } from '@/pages/pdv/PdvPage';
import { TotemPage } from '@/pages/totem/TotemPage';
import { VeiculosPage } from '@/pages/veiculos/VeiculosPage';
import { SobrePage } from '@/pages/SobrePage';
import { PwaUpdateBanner } from '@/components/PwaUpdateBanner';

export default function App() {
  return (
    <ErrorBoundary>
      <TemaProvider>
        <PerfilProvider>
          <BrowserRouter>
          <PwaUpdateBanner />
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
              <Route path="/admin/cadastros-base" element={<CadastrosBasePage />} />
              <Route path="/admin/pessoas" element={<PessoasAdminPage />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/relatorios" element={<RelatoriosPainelPage />} />
              <Route path="/admin/relatorios/vendas" element={<RelatoriosVendasPage />} />
              <Route path="/admin/relatorios/fiscal" element={<RelatoriosFiscalPage />} />
              <Route path="/admin/catalogo" element={<CatalogoConfigPage />} />
              <Route path="/admin/config" element={<ConfigPainelPage />} />
              <Route path="/admin/config/empresa" element={<ConfigEmpresaPage />} />
              <Route path="/admin/config/caixas" element={<ConfigCaixasPage />} />
              <Route path="/admin/config/fiscal" element={<ConfigFiscalPage />} />
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/produtos" element={<Navigate to="/admin/produtos" replace />} />
              <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />

              <Route path="/pdv" element={<PdvPage />} />
              <Route path="/totem" element={<TotemPage />} />

              <Route path="/operacional" element={<FilaOperacionalPage />} />
              <Route path="/operacional/separar/:id" element={<SeparacaoPage />} />
              <Route path="/negociacao" element={<NegociacaoListaPage />} />
              <Route path="/negociacao/nova" element={<NegociacaoEditorPage />} />
              <Route path="/negociacao/:id" element={<NegociacaoEditorPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/motorista" element={<MotoristaPage />} />
              <Route path="/veiculos" element={<VeiculosPage />} />
              <Route path="/marketing" element={<MarketingPainelPage />} />
              <Route path="/marketing/criar" element={<CriarArtePage />} />
              <Route path="/marketing/galeria" element={<GaleriaPage />} />
              <Route path="/marketing/promocoes" element={<PromocoesPage />} />
              <Route path="/marketing/tv" element={<TvPreviewPage />} />
              <Route path="/fiscal" element={<FiscalPainelPage />} />
              <Route path="/fiscal/emitidas" element={<FiscalEmitidasPage />} />
              <Route path="/fiscal/emitir" element={<FiscalEmitirPage />} />
              <Route path="/fiscal/series" element={<FiscalSeriesPage />} />
              <Route path="/financeiro" element={<FinanceiroPainelPage />} />
              <Route path="/financeiro/receber" element={<FinanceiroReceberPage />} />
              <Route path="/financeiro/pagar" element={<FinanceiroPagarPage />} />
              <Route path="/financeiro/caixa" element={<FinanceiroCaixaPage />} />
              <Route path="/financeiro/comissoes" element={<FinanceiroComissoesPage />} />
              <Route path="/financeiro/vales" element={<FinanceiroValesPage />} />
              <Route path="/estoque" element={<EstoquePainelPage />} />
              <Route path="/estoque/movimentos" element={<EstoqueMovimentosPage />} />
              <Route path="/estoque/entrada-xml" element={<EstoqueEntradaXmlPage />} />
              <Route path="/estoque/inventario" element={<EstoqueInventarioPage />} />
              <Route path="/estoque/inventario/app" element={<EstoqueInventarioAppPage />} />
              <Route path="/catalogo" element={<CatalogoPortalPage />} />
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
