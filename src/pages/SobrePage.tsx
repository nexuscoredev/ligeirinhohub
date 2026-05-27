import { PageShell } from '@/components/PageShell';
import { NOME_PLATAFORMA } from '@/lib/apps';
import { appDisplayVersion } from '@/lib/appDisplayVersion';
import './sobre.css';

export function SobrePage() {
  return (
    <PageShell
      tag="Sobre"
      titulo={
        <>
          {NOME_PLATAFORMA} <span>por dentro</span>
        </>
      }
      subtitulo="Uma apresentação rápida do que o Hub faz e como ele melhora o dia a dia."
      comLogo
    >
      <section className="sobre-grid" aria-label="Informações do Ligeirinho Hub">
        <div className="card sobre-card">
          <h2 className="sobre-h2">O que é</h2>
          <p className="sobre-p">
            O <strong>{NOME_PLATAFORMA}</strong> é o painel que reúne as rotinas da loja em um só lugar: operação,
            cadastro e acompanhamento. A ideia é você abrir e já achar o que precisa, sem “caça ao menu”.
          </p>
        </div>

        <div className="card sobre-card">
          <h2 className="sobre-h2">Para quem</h2>
          <p className="sobre-p">
            Para toda a equipe: quem atende no balcão, quem separa e despacha, e também quem gerencia o dia.
            Cada pessoa enxerga o que faz sentido pro seu trabalho.
          </p>
        </div>

        <div className="card sobre-card">
          <h2 className="sobre-h2">O que muda no dia a dia</h2>
          <ul className="sobre-lista">
            <li>Atalhos claros para as tarefas mais usadas.</li>
            <li>Informações organizadas para decidir mais rápido.</li>
            <li>Menos retrabalho e menos “onde fica isso?”.</li>
          </ul>
        </div>

        <div className="card sobre-card">
          <h2 className="sobre-h2">Sobre o desenvolvimento</h2>
          <p className="sobre-p">
            Esse Hub está em melhoria contínua: vamos ajustando telas, detalhes e fluxo com base no uso real.
            Se algo estiver confuso ou se faltar algum atalho, isso vira evolução do produto.
          </p>
          <p className="sobre-versao">
            Versão atual: <strong>{appDisplayVersion()}</strong>
          </p>
        </div>

        <div className="card sobre-card sobre-card--full">
          <h2 className="sobre-h2">Quer sugerir algo?</h2>
          <p className="sobre-p">
            Sua sugestão ajuda muito. Diga o que você estava tentando fazer e onde travou — a gente prioriza para
            deixar mais simples e rápido.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

