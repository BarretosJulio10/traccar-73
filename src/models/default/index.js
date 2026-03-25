// ─── Modelo Default ───────────────────────────────────────────────────────────
// Este é o modelo atual do sistema, preservado intacto.
// O AppShell aponta para src/App.jsx — nenhum comportamento muda.
//
// Para criar variações visuais deste modelo:
//   1. Copie os componentes que precisam mudar para models/default/components/
//   2. Atualize as importações aqui
//   3. Crie models/model-novo/ seguindo o mesmo padrão

export { default } from '../../App';

// Design tokens deste modelo (cores base — overrides vêm do tenant)
export { defaultTokens as theme } from './theme';
