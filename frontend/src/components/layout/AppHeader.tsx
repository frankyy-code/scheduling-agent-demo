import { resetDemo } from '../../services/demoReset';
import { APP_TITLE } from '../../data/labels';

export function AppHeader() {
  return (
    <header className="bg-mayo-navy text-white px-6 py-3 flex items-center justify-between">
      <h1 className="text-sm font-semibold tracking-wide uppercase">{APP_TITLE}</h1>
      <button
        type="button"
        onClick={resetDemo}
        className="text-sm px-4 py-1.5 rounded border border-white/40 hover:bg-white/10 transition-colors"
      >
        Reset Demo
      </button>
    </header>
  );
}
