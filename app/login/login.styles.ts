import css from "styled-jsx/css";

/** Gaya global halaman login. */
export const loginStyles = css.global`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');
  body { margin: 0; background-color: var(--rei-bg); color: var(--rei-text); font-family: 'DM Sans', sans-serif; transition: background-color .45s ease, color .3s ease; }

  .login-page { position: relative; isolation: isolate; min-height: 100vh; display: grid; place-items: center; padding: 24px; overflow: hidden; }
  .login-page::before { content: ''; position: fixed; inset: -25vmax; z-index: -1; pointer-events: none; opacity: var(--rei-aura-strength); background:
    radial-gradient(38vmax 38vmax at 18% 22%, var(--rei-aura-1), transparent 70%),
    radial-gradient(34vmax 34vmax at 82% 18%, var(--rei-aura-2), transparent 70%),
    radial-gradient(40vmax 40vmax at 68% 84%, var(--rei-aura-3), transparent 70%);
    animation: login-aura 26s ease-in-out infinite alternate; will-change: transform;
  }

  .login-card { position: relative; width: 100%; max-width: 400px; padding: 30px; border: 1px solid var(--rei-border); border-radius: 20px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow); display: grid; gap: 14px; animation: login-card-in .5s cubic-bezier(.2,.8,.2,1) both; transition: background-color .3s ease, border-color .3s ease, box-shadow .3s ease; }
  .login-card::after { content: ''; position: absolute; inset: 0 0 auto; height: 3px; border-radius: 20px 20px 0 0; background: linear-gradient(90deg, var(--rei-accent), var(--rei-gold)); opacity: .9; }

  .login-themes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 4px; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface-3); }
  .login-theme { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 30px; padding: 0 4px; border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--rei-muted); font-size: 9px; font-weight: 700; transition: transform .18s ease, background-color .2s ease, color .2s ease, border-color .2s ease; }
  .login-theme:hover { transform: translateY(-1px); color: var(--rei-text); background: var(--rei-surface); }
  .login-theme.active { color: var(--rei-accent-soft-text); background: var(--rei-accent-soft-bg); border-color: color-mix(in srgb, var(--rei-accent) 30%, transparent); }
  .theme-dot { width: 9px; height: 9px; flex-shrink: 0; border-radius: 50%; border: 1px solid color-mix(in srgb, #000 12%, transparent); }
  .theme-dot-light { background: linear-gradient(135deg, #ffffff 40%, #d4af37); }
  .theme-dot-dark { background: linear-gradient(135deg, #0e0626 40%, #7255d7); }
  .theme-dot-glass { background: linear-gradient(135deg, #b3abf2 30%, #d4af37 90%); }
  .theme-dot-gold { background: linear-gradient(135deg, #f6efd9 30%, #d4af37 80%); }

  .login-logo { position: relative; display: grid; place-items: center; width: 104px; height: 104px; margin: 6px auto 2px; border: 1px solid rgba(212, 175, 55, .45); border-radius: 28px; background: linear-gradient(150deg, #6a4ac4, #371f76 72%); box-shadow: 0 14px 30px rgba(84, 54, 170, .28), inset 0 1px 0 rgba(255, 255, 255, .22); animation: login-float 6s ease-in-out infinite; transition: transform .3s ease, box-shadow .3s ease; }
  .login-logo:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 18px 36px rgba(84, 54, 170, .34), inset 0 1px 0 rgba(255, 255, 255, .26); }
  .login-logo::before { content: ''; position: absolute; inset: -12px; z-index: -1; border-radius: 38px; background: radial-gradient(circle, rgba(212, 175, 55, .24), transparent 70%); }
  .login-logo img { position: relative; width: 84px !important; height: 84px !important; filter: drop-shadow(0 3px 8px rgba(0, 0, 0, .5)) saturate(1.15) brightness(1.12); }

  .login-card h1 { margin: 6px 0 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: var(--rei-heading); letter-spacing: -1px; }
  .login-card p { margin: -8px 0 6px; color: var(--rei-muted); font-size: 12px; }
  .login-card label { display: grid; gap: 7px; color: var(--rei-muted); font-size: 11px; font-weight: 700; }
  .login-card input { padding: 11px 12px; border: 1px solid var(--rei-border-strong); border-radius: 10px; background: var(--rei-input-bg); color: var(--rei-text); font: inherit; font-size: 12px; outline: none; transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
  .login-card input::placeholder { color: var(--rei-soft); }
  .login-card input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 18%, transparent); }

  .login-submit { position: relative; overflow: hidden; min-height: 42px; margin-top: 2px; border: 0; border-radius: 10px; background: var(--rei-accent); color: var(--rei-accent-contrast); font: inherit; font-size: 12px; font-weight: 700; letter-spacing: .2px; box-shadow: 0 8px 20px color-mix(in srgb, var(--rei-accent) 28%, transparent); transition: transform .18s ease, background-color .2s ease, box-shadow .2s ease; }
  .login-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 32%, rgba(255,255,255,.34) 50%, transparent 68%); transform: translateX(-130%); transition: transform .6s ease; }
  .login-submit:hover { transform: translateY(-1px); background: var(--rei-accent-hover); box-shadow: 0 12px 26px color-mix(in srgb, var(--rei-accent) 36%, transparent); }
  .login-submit:hover::after { transform: translateX(130%); }
  .login-submit:active { transform: translateY(0) scale(.99); }
  .login-submit:disabled { opacity: .65; cursor: not-allowed; transform: none; }

  .login-error { padding: 10px 12px; border: 1px solid var(--rei-danger-border); border-radius: 9px; background: var(--rei-danger-bg); color: var(--rei-danger-fg); font-size: 11px; animation: login-shake .32s ease both; }
  .login-footnote { padding-top: 4px; color: var(--rei-soft); text-align: center; font-size: 9px; letter-spacing: .4px; }

  @keyframes login-card-in { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes login-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes login-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  @keyframes login-aura { 0% { transform: translate3d(0,0,0) scale(1) rotate(0deg); } 50% { transform: translate3d(3vmax,-2vmax,0) scale(1.07) rotate(6deg); } 100% { transform: translate3d(-3vmax,3vmax,0) scale(1.12) rotate(-5deg); } }
  @media (prefers-reduced-motion: reduce) { .login-logo { animation: none; } .login-page::before { animation: none; } }
`;
