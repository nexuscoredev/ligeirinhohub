import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { NOME_PLATAFORMA, temaApp, type AppSistema, type ItemApp } from '@/lib/apps';
import './AppPageHeader.css';

interface AppPageHeaderProps {
  app: AppSistema;
  item: ItemApp;
  titulo: ReactNode;
  subtitulo?: string;
  children: ReactNode;
}

export function AppPageHeader({
  app,
  item,
  titulo,
  subtitulo,
  children,
}: AppPageHeaderProps) {
  return (
    <div
      className="app-page"
      data-app-id={app.id}
      style={temaApp(app)}
    >
      <div className="app-page__aurora" aria-hidden />
      <header className="app-page-hero">
        <div className="app-page-hero__top">
          <Link to="/bem-vindo" className="app-page-voltar">
            <span className="app-page-voltar-icone" aria-hidden>
              ←
            </span>
            Voltar ao {NOME_PLATAFORMA}
          </Link>
        </div>
        <div className="app-page-hero__corpo">
          <div className="app-page-hero__icon-wrap">
            <span className="app-page-hero__icon" aria-hidden>
              {app.icone}
            </span>
            {app.iconeLabel ? (
              <span className="app-page-hero__badge">{app.iconeLabel}</span>
            ) : null}
          </div>
          <div className="app-page-hero__texto">
            <span className="app-page-hero__app-nome">{app.nome}</span>
            <h1 className="app-page-hero__titulo">{titulo}</h1>
            {subtitulo ? (
              <p className="app-page-hero__subtitulo">{subtitulo}</p>
            ) : null}
            {app.tagline ? (
              <p className="app-page-hero__tagline">{app.tagline}</p>
            ) : null}
          </div>
        </div>
        <AppBreadcrumb app={app} item={item} />
      </header>
      <div className="app-page__conteudo">{children}</div>
    </div>
  );
}
