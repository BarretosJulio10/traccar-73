import { Component, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTenant } from './common/components/TenantProvider';
import { loadModel } from './models/registry';
import { demoService } from './core/services';
import Loader from './common/components/Loader';

class ModelErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#64748b', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Falha ao carregar o painel</div>
          <div style={{ fontSize: 14 }}>Ocorreu um erro inesperado.</div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 8, padding: '10px 24px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * ModelRouter — carrega o AppShell do modelo configurado no tenant.
 *
 * COMO FUNCIONA:
 *   1. Lê tenant.ui_model (ex: 'default', 'compact', 'fleet')
 *   2. Faz dynamic import do módulo correto via registry
 *   3. Renderiza o AppShell correspondente
 *
 * PREVIEW MODE:
 *   ?preview=fleet  → força o modelo e ativa demo mode automaticamente.
 *   Usado pelo botão "Ver Demo" no painel admin.
 *
 * FALLBACK: se tenant não carregou ainda ou ui_model não existe → usa 'default'
 */
const ModelRouter = () => {
  const [searchParams] = useSearchParams();
  const previewModel = searchParams.get('preview');

  const { tenant, loading: tenantLoading } = useTenant() || {};
  const [AppShell, setAppShell] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  // Ativa demo mode automaticamente quando em preview
  useEffect(() => {
    if (previewModel) demoService.enable();
  }, [previewModel]);

  useEffect(() => {
    // Em preview não precisa aguardar tenant
    if (!previewModel && tenantLoading) return;

    const modelKey = previewModel || tenant?.ui_model || 'default';
    setModelLoading(true);

    loadModel(modelKey)
      .then((mod) => {
        setAppShell(() => mod.default || mod.AppShell);
      })
      .catch((err) => {
        console.warn(`[ModelRouter] Falha ao carregar modelo "${modelKey}":`, err);
        if (modelKey !== 'default') {
          return loadModel('default').then((mod) => {
            setAppShell(() => mod.default || mod.AppShell);
          });
        }
      })
      .finally(() => setModelLoading(false));
  }, [previewModel, tenant?.ui_model, tenantLoading]);

  if ((!previewModel && tenantLoading) || modelLoading || !AppShell) {
    return <Loader />;
  }

  return (
    <ModelErrorBoundary>
      <Suspense fallback={<Loader />}>
        <AppShell />
      </Suspense>
    </ModelErrorBoundary>
  );
};

export default ModelRouter;
