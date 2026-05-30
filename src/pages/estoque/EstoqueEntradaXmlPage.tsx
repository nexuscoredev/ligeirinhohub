import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import './estoque.css';

export function EstoqueEntradaXmlPage() {
  const app = appPorId('estoque');
  const item = app ? itemAppPorRota(app, '/estoque/entrada-xml') : null;

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Entrada por XML (NF-e)"
      subtitulo="Importação de notas de fornecedor — próxima iteração."
    >
      <div className="est-xml-placeholder card">
        <p style={{ margin: '0 0 0.75rem' }}>
          <strong>Em desenvolvimento</strong>
        </p>
        <p style={{ margin: 0 }}>
          A importação de XML de NF-e de entrada será integrada aqui. Por enquanto,
          registre entradas manualmente em{' '}
          <a href="/estoque/movimentos">Entrada e saída</a> com tipo <em>Entrada</em>.
        </p>
      </div>
    </AppPageHeader>
  );
}
