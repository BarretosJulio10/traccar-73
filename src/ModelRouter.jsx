import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTenant } from './common/components/TenantProvider';
import { loadModel } from './models/registry';
import { demoService } from './core/services';
import Loader from './common/components/Loader';

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
    <Suspense fallback={<Loader />}>
      <AppShell />
    </Suspense>
  );
};

export default ModelRouter;
