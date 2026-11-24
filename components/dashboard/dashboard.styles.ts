import css from "styled-jsx/css";

/** Gaya global dashboard (dipasang selama dashboard ter-mount). */
export const dashboardStyles = css.global`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }
  body { margin: 0; background-color: var(--rei-bg); color: var(--rei-text); font-family: 'DM Sans', sans-serif; font-size: 13px; transition: background-color .45s ease, color .3s ease; }
  button, input, select, textarea { font: inherit; }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .65; }
  a { color: var(--rei-accent); }
  :where(button, a, input, select, textarea):focus-visible { outline: 2px solid color-mix(in srgb, var(--rei-accent) 70%, transparent); outline-offset: 2px; }

  .rei-app { position: relative; isolation: isolate; min-height: 100vh; animation: page-enter .4s ease both; transition: background-color .45s ease, color .3s ease; }
  .rei-app::before { content: ''; position: fixed; inset: -22vmax; z-index: -1; pointer-events: none; opacity: var(--rei-aura-strength); background:
    radial-gradient(42vmax 42vmax at 16% 18%, var(--rei-aura-1), transparent 70%),
    radial-gradient(36vmax 36vmax at 84% 14%, var(--rei-aura-2), transparent 70%),
    radial-gradient(44vmax 44vmax at 70% 86%, var(--rei-aura-3), transparent 70%);
    animation: rei-aura 28s ease-in-out infinite alternate; will-change: transform;
  }

  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 10; width: 248px; padding: 27px 17px 14px; display: flex; flex-direction: column; background: var(--rei-surface); border-right: 1px solid var(--rei-border); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: background-color .3s ease, border-color .3s ease; }
  .brand { display: flex; align-items: center; gap: 11px; padding: 0 7px 31px; }
  .brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: var(--rei-accent); color: var(--rei-gold); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; letter-spacing: -1px; box-shadow: 0 8px 18px color-mix(in srgb, var(--rei-accent) 28%, transparent); }
  .brand-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: .5px; color: var(--rei-heading); }
  .brand-subtitle { margin-top: 4px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: 1.2px; }
  .workspace-label, .menu-label { padding: 0 9px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: 1.3px; }
  .workspace { display: flex; align-items: center; gap: 10px; padding: 12px 9px; margin: 9px 0 28px; border: 1px solid var(--rei-border); border-radius: 10px; transition: border-color .2s ease, background-color .2s ease; }
  .workspace:hover { border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); background: var(--rei-surface-2); }
  .workspace-avatar, .profile-avatar, .topbar-avatar { display: grid; place-items: center; flex-shrink: 0; font-weight: 700; }
  .workspace-avatar { width: 32px; height: 32px; border-radius: 8px; color: var(--rei-accent-soft-text); background: var(--rei-accent-soft-bg); }
  .workspace-info, .profile-info { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
  .workspace-info strong, .profile-info strong { font-size: 11px; color: var(--rei-text); }
  .workspace-info span, .profile-info span { color: var(--rei-muted); font-size: 10px; }
  .menu-label { margin-bottom: 11px; }
  .navigation { display: grid; gap: 5px; }
  .nav-item { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 42px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: var(--rei-muted); text-align: left; font-size: 12px; font-weight: 500; transition: transform .18s ease, background-color .2s ease, color .2s ease; }
  .nav-item:hover { background: var(--rei-surface-hover); color: var(--rei-text); }
  .nav-item:active { transform: scale(.985); }
  .nav-item.active { color: var(--rei-accent-soft-text); background: var(--rei-accent-soft-bg); font-weight: 700; }
  .nav-item.active:before { position: absolute; left: -17px; top: 9px; bottom: 9px; width: 3px; border-radius: 0 4px 4px 0; background: var(--rei-accent); content: ''; animation: nav-indicator .3s ease both; }
  .nav-icon { display: grid; place-items: center; width: 19px; font-size: 17px; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
  .nav-item:hover .nav-icon { transform: translateY(-1px) scale(1.1); }
  .nav-count { margin-left: auto; padding: 3px 7px; border-radius: 6px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 10px; }
  .nav-count-alert { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .sidebar-bottom { position: relative; margin-top: auto; }
  .help-card { padding: 15px; margin-bottom: 17px; border: 1px solid var(--rei-border); border-radius: 11px; background: linear-gradient(135deg, color-mix(in srgb, var(--rei-accent) 7%, var(--rei-surface)), color-mix(in srgb, var(--rei-gold) 9%, var(--rei-surface))); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: transform .2s ease, border-color .2s ease; }
  .help-card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--rei-gold) 45%, var(--rei-border)); }
  .help-icon { display: grid; place-items: center; width: 27px; height: 27px; margin-bottom: 10px; border-radius: 8px; background: var(--rei-surface); color: var(--rei-gold-text); font-size: 17px; box-shadow: var(--rei-shadow-soft); }
  .help-card strong { font-size: 11px; color: var(--rei-text); }
  .help-card p { margin: 6px 0 11px; color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
  .help-card button, .text-button { padding: 0; border: 0; background: transparent; color: var(--rei-accent); font-size: 11px; font-weight: 700; transition: color .18s ease, transform .18s ease; }
  .help-card button:hover, .text-button:hover { color: var(--rei-accent-hover); transform: translateX(2px); }
  .profile { display: flex; align-items: center; gap: 10px; padding: 14px 2px 0; border-top: 1px solid var(--rei-border); }
  .profile-avatar, .topbar-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
  .profile-more { border: 0; background: transparent; color: var(--rei-soft); transition: color .18s ease, transform .18s ease; }
  .profile-more:hover { color: var(--rei-accent); transform: translateY(-1px); }
  .profile-menu { position: absolute; bottom: 54px; right: 0; left: 0; z-index: 20; padding: 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow); animation: menu-in .18s cubic-bezier(.2,.8,.2,1) both; }
  .profile-email { overflow-wrap: anywhere; margin-bottom: 10px; color: var(--rei-muted); font-size: 10px; }
  .profile-menu button { width: 100%; padding: 9px; border: 0; border-radius: 7px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); text-align: left; font-weight: 700; transition: filter .18s ease; }
  .profile-menu button:hover { filter: brightness(1.06); }
  .main-content { min-height: 100vh; margin-left: 248px; }
  .topbar { position: sticky; top: 0; z-index: 5; height: 66px; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; border-bottom: 1px solid var(--rei-border); background: var(--rei-topbar-bg); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); transition: background-color .3s ease, border-color .3s ease; }
  .breadcrumb { display: flex; align-items: center; gap: 12px; color: var(--rei-muted); font-size: 11px; }
  .breadcrumb-divider { color: var(--rei-soft); }
  .breadcrumb strong { color: var(--rei-text); font-weight: 700; }
  .topbar-actions { display: flex; align-items: center; gap: 18px; }
  .system-status { display: flex; align-items: center; gap: 7px; color: var(--rei-muted); font-size: 10px; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22a06b; box-shadow: 0 0 0 3px #22a06b18; animation: pulse-dot 2.4s ease-in-out infinite; }
  .icon-button { border: 0; background: transparent; color: var(--rei-muted); font-size: 17px; transition: transform .3s cubic-bezier(.2,.8,.2,1), color .2s ease; }
  .icon-button:hover { color: var(--rei-accent); transform: rotate(90deg); }
  .topbar-avatar { border: 0; width: 31px; height: 31px; font-size: 11px; transition: transform .2s ease, box-shadow .2s ease; }
  .topbar-avatar:hover { transform: translateY(-1px); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 20%, transparent); }

  /* Pemilih tema */
  .theme-switcher { position: relative; }
  .theme-toggle { display: inline-flex; align-items: center; gap: 7px; min-height: 32px; padding: 0 10px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface); color: var(--rei-text); font-size: 10px; font-weight: 700; transition: transform .18s ease, background-color .2s ease, border-color .2s ease, color .2s ease; }
  .theme-toggle:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--rei-accent) 45%, var(--rei-border)); color: var(--rei-accent-soft-text); }
  .theme-toggle-icon { font-size: 15px; line-height: 1; }
  .theme-caret { font-size: 12px; line-height: 1; color: var(--rei-soft); transition: transform .2s ease; }
  .theme-caret.open { transform: rotate(180deg); }
  .theme-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 40; width: 244px; padding: 9px; border: 1px solid var(--rei-border); border-radius: 14px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow); animation: menu-in .18s cubic-bezier(.2,.8,.2,1) both; }
  .theme-menu-heading { display: flex; flex-direction: column; gap: 2px; padding: 4px 8px 9px; margin-bottom: 6px; border-bottom: 1px solid var(--rei-border-soft); }
  .theme-menu-heading strong { font-size: 11px; color: var(--rei-heading); }
  .theme-menu-heading span { color: var(--rei-muted); font-size: 9px; }
  .theme-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--rei-text); text-align: left; animation: option-in .22s ease both; transition: background-color .18s ease, border-color .18s ease, transform .18s ease; }
  .theme-option:hover { background: var(--rei-surface-hover); transform: translateX(1px); }
  .theme-option.active { border-color: color-mix(in srgb, var(--rei-accent) 38%, transparent); background: var(--rei-accent-soft-bg); }
  .theme-swatch { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; border: 1px solid var(--rei-border); box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); }
  .theme-swatch-light { background: linear-gradient(140deg, #f7f6fd 0 38%, #5436aa 38% 72%, #d4af37 72%); }
  .theme-swatch-dark { background: linear-gradient(140deg, #0e0626 0 38%, #5436aa 38% 72%, #e1c162 72%); }
  .theme-swatch-glass { background: linear-gradient(140deg, rgba(255,255,255,.55) 0 32%, rgba(114,85,215,.8) 32% 68%, rgba(212,175,55,.9) 68%); }
  .theme-swatch-gold { background: linear-gradient(140deg, #faf6ec 0 38%, #d4af37 38% 72%, #5436aa 72%); }
  .theme-option-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .theme-option-text strong { font-size: 11px; color: var(--rei-text); }
  .theme-option-text small { color: var(--rei-muted); font-size: 9px; }
  .theme-check { width: 18px; flex-shrink: 0; color: var(--rei-accent); font-weight: 800; text-align: center; }

  .page-content { max-width: 1500px; padding: 32px 36px 20px; margin: 0 auto; }
  .welcome-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 26px; animation: rei-fade-up .4s ease both; }
  .eyebrow { margin-bottom: 8px; color: var(--rei-gold-text); font-size: 9px; font-weight: 700; letter-spacing: 1.6px; }
  h1 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 27px; font-weight: 800; letter-spacing: -1px; color: var(--rei-heading); }
  .welcome-row p, .panel-heading p { margin: 7px 0 0; color: var(--rei-muted); font-size: 11px; line-height: 1.6; }
  .role-label, .live-pill { display: inline-block; margin-top: 9px; padding: 4px 7px; border-radius: 5px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 9px; font-weight: 700; }
  .live-pill { margin-top: 0; background: var(--rei-success-soft); color: var(--rei-success-text); letter-spacing: .4px; }
  .welcome-actions, .task-tools { display: flex; align-items: center; gap: 9px; }
  .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 0 14px; border: 1px solid transparent; border-radius: 8px; font-size: 11px; font-weight: 700; white-space: nowrap; transition: transform .18s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease; }
  .primary-button { position: relative; overflow: hidden; background: var(--rei-accent); color: var(--rei-accent-contrast); box-shadow: 0 4px 12px color-mix(in srgb, var(--rei-accent) 30%, transparent); }
  .primary-button::after { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.34) 50%, transparent 70%); transform: translateX(-130%); transition: transform .6s ease; }
  .primary-button:hover { background: var(--rei-accent-hover); box-shadow: 0 8px 20px color-mix(in srgb, var(--rei-accent) 38%, transparent); }
  .primary-button:hover::after { transform: translateX(130%); }
  .primary-button:active, .secondary-button:active { transform: translateY(0) scale(.985); }
  .secondary-button { border-color: var(--rei-border-strong); background: var(--rei-surface); color: var(--rei-muted); }
  .secondary-button:hover { background: var(--rei-surface-hover); color: var(--rei-text); }
  .message { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; margin-bottom: 15px; border: 1px solid; border-radius: 9px; font-size: 11px; animation: rei-fade-up .28s ease both; }
  .message button { border: 0; background: transparent; font-size: 18px; color: inherit; }
  .error-message { border-color: var(--rei-danger-border); background: var(--rei-danger-bg); color: var(--rei-danger-fg); }
  .success-message { border-color: var(--rei-success-border); background: var(--rei-success-bg); color: var(--rei-success-fg); }
  .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 17px; margin-bottom: 21px; }
  .stat-card, .panel { position: relative; min-width: 0; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface); box-shadow: var(--rei-shadow-soft); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: transform .2s ease, box-shadow .25s ease, background-color .3s ease, border-color .3s ease; }
  .stat-card::after, .panel::after, .kanban-card::after { content: ''; position: absolute; inset: 0; z-index: 0; border-radius: inherit; pointer-events: none; background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), var(--rei-sheen), transparent 62%); opacity: 0; transition: opacity .3s ease; }
  .stat-card:hover::after, .panel:hover::after, .kanban-card:hover::after { opacity: 1; }
  .stat-card > *, .panel > *, .kanban-card > * { position: relative; z-index: 1; }
  .stat-card { padding: 18px 19px 16px; animation: card-enter .45s cubic-bezier(.2,.8,.2,1) both; }
  .stat-card:nth-child(2) { animation-delay: .05s; }
  .stat-card:nth-child(3) { animation-delay: .1s; }
  .stat-card:nth-child(4) { animation-delay: .15s; }
  .stat-card:hover { transform: translateY(-3px); box-shadow: var(--rei-shadow-hover); border-color: color-mix(in srgb, var(--rei-accent) 26%, var(--rei-border)); }
  .stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .stat-label { color: var(--rei-muted); font-size: 11px; font-weight: 500; }
  .stat-icon { display: grid; place-items: center; width: 33px; height: 33px; border-radius: 9px; font-size: 17px; transition: transform .25s cubic-bezier(.2,.8,.2,1); }
  .stat-card:hover .stat-icon { transform: translateY(-2px) rotate(-6deg) scale(1.06); }
  .stat-value { margin-top: 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 29px; font-weight: 800; letter-spacing: -1px; color: var(--rei-heading); font-variant-numeric: tabular-nums; }
  .stat-note { display: flex; align-items: center; gap: 6px; margin-top: 7px; color: var(--rei-soft); font-size: 10px; }
  .stat-note span { font-size: 7px; }
  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 21px; }
  .overview-grid > * { animation: card-enter .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: .08s; }
  .panel { padding: 20px; }
  .panel:hover { border-color: color-mix(in srgb, var(--rei-accent) 20%, var(--rei-border)); }
  .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .panel-heading h2 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 800; letter-spacing: -.2px; color: var(--rei-heading); }
  .panel-heading p { margin-top: 5px; font-size: 10px; }
  .progress-summary { display: flex; align-items: center; justify-content: center; gap: 42px; min-height: 180px; }
  .progress-ring { display: grid; place-items: center; width: 132px; height: 132px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 10px 30px color-mix(in srgb, var(--rei-accent) 16%, transparent); }
  .progress-ring-inner { display: flex; align-items: center; justify-content: center; flex-direction: column; width: 99px; height: 99px; border-radius: 50%; background: var(--rei-surface); box-shadow: inset 0 0 0 1px var(--rei-border-soft); }
  .progress-ring-inner strong { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; color: var(--rei-heading); }
  .progress-ring-inner span { margin-top: 3px; color: var(--rei-muted); font-size: 10px; }
  .progress-legend { display: grid; gap: 14px; min-width: 140px; }
  .progress-legend div { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 9px; color: var(--rei-muted); font-size: 10px; }
  .progress-legend strong { color: var(--rei-text); font-size: 11px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 3px; }
  .progress-footer { display: flex; justify-content: space-between; gap: 10px; margin: 2px 0 10px; color: var(--rei-muted); font-size: 10px; }
  .progress-footer strong { color: var(--rei-text); }
  .progress-track, .mini-track { overflow: hidden; border-radius: 20px; background: var(--rei-chart-track); }
  .progress-track { height: 6px; }
  .progress-fill { height: 100%; border-radius: 20px; background: linear-gradient(90deg, var(--rei-accent), color-mix(in srgb, var(--rei-accent) 50%, var(--rei-gold))); transition: width .6s cubic-bezier(.2,.8,.2,1); box-shadow: 0 0 12px color-mix(in srgb, var(--rei-accent) 35%, transparent); }
  .mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 19px; padding-top: 15px; border-top: 1px solid var(--rei-border-soft); }
  .mini-stats div { display: flex; flex-direction: column; gap: 6px; }
  .mini-stats span { color: var(--rei-soft); font-size: 10px; }
  .mini-stats strong { font-size: 16px; color: var(--rei-text); }
  .overdue-number { color: var(--rei-danger-text); }
  .project-list { display: grid; gap: 19px; margin-top: 22px; }
  .project-row { display: flex; align-items: center; gap: 12px; }
  .project-symbol { display: grid; place-items: center; width: 37px; height: 37px; flex-shrink: 0; border-radius: 9px; font-size: 10px; font-weight: 800; transition: transform .2s ease; }
  .project-row:hover .project-symbol { transform: scale(1.06) rotate(-3deg); }
  .project-color-0 { background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
  .project-color-1 { background: var(--rei-gold-soft); color: var(--rei-gold-text); }
  .project-color-2 { background: var(--rei-info-soft); color: var(--rei-info-text); }
  .project-details { flex: 1; min-width: 0; }
  .project-details strong { font-size: 11px; color: var(--rei-text); }
  .project-details span { display: block; margin-top: 4px; color: var(--rei-soft); font-size: 9px; }
  .mini-track { height: 4px; margin-top: 9px; }
  .mini-track div { height: 100%; border-radius: 20px; transition: width .6s cubic-bezier(.2,.8,.2,1); }
  .project-percent { width: 35px; text-align: right; font-size: 10px; color: var(--rei-text); }
  .empty-projects { padding: 28px 8px; color: var(--rei-soft); text-align: center; font-size: 11px; line-height: 1.6; }
  .tasks-panel { padding: 20px 0 0; }
  .tasks-heading { align-items: center; padding: 0 20px 19px; }
  .task-tools { gap: 8px; }
  .search-box { display: flex; align-items: center; gap: 8px; height: 35px; padding: 0 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; color: var(--rei-soft); transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
  .search-box:focus-within { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .search-box span { font-size: 14px; color: var(--rei-muted); }
  .search-box input { width: 120px; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--rei-text); font-size: 10px; }
  .search-box input::placeholder { color: var(--rei-soft); }
  .filter-select { height: 35px; max-width: 145px; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 8px; background: var(--rei-surface); color: var(--rei-muted); font-size: 10px; transition: border-color .2s ease, background-color .2s ease, color .2s ease; }
  .filter-select:hover { border-color: color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); color: var(--rei-text); }
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; }
  thead { background: var(--rei-surface-2); }
  th { padding: 12px 14px; color: var(--rei-soft); font-size: 9px; font-weight: 700; letter-spacing: .5px; white-space: nowrap; }
  th:first-child, td:first-child { padding-left: 20px; }
  td { padding: 14px; border-top: 1px solid var(--rei-border-soft); color: var(--rei-muted); font-size: 10px; white-space: nowrap; }
  tbody tr { transition: background-color .18s ease; }
  tbody tr:hover { background: var(--rei-surface-2); }
  .task-name { display: flex; align-items: center; gap: 9px; color: var(--rei-text); font-weight: 600; }
  .task-title { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: inherit; text-align: left; transition: color .18s ease; }
  .task-title:hover { color: var(--rei-accent); }
  .task-tag-badge { flex-shrink: 0; padding: 2px 6px; border-radius: 999px; background: var(--rei-warning-soft); color: var(--rei-warning-text); font-size: 8px; font-weight: 800; letter-spacing: .3px; }
  .task-indicator { width: 9px; height: 9px; flex-shrink: 0; border: 2px solid var(--rei-border-strong); border-radius: 50%; }
  .indicator-done { border-color: var(--rei-success-text); background: var(--rei-success-text); }
  .project-tag { display: inline-flex; align-items: center; gap: 6px; }
  .priority { display: inline-block; padding: 5px 8px; border-radius: 5px; font-size: 9px; font-weight: 700; }
  .priority-low { background: var(--rei-success-soft); color: var(--rei-success-text); }
  .priority-medium { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
  .priority-high { background: var(--rei-orange-soft); color: var(--rei-orange-text); }
  .priority-urgent { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .status-select { max-width: 130px; padding: 6px 7px; border: 0; border-radius: 6px; outline: none; font-size: 9px; font-weight: 600; cursor: pointer; }
  .status-todo { background: var(--rei-neutral-soft); color: var(--rei-neutral-text); }
  .status-in_progress { background: var(--rei-info-soft); color: var(--rei-info-text); }
  .status-review { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
  .status-done { background: var(--rei-success-soft); color: var(--rei-success-text); }
  .due-date { color: var(--rei-muted); }
  .empty-state { padding: 30px; text-align: center; color: var(--rei-soft); }
  .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; border-top: 1px solid var(--rei-border-soft); color: var(--rei-soft); font-size: 10px; }
  .page-footer { display: flex; justify-content: space-between; gap: 12px; padding: 23px 2px 0; color: var(--rei-soft); font-size: 10px; }
  .new-task-panel { padding: 20px; margin-bottom: 20px; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); box-shadow: var(--rei-shadow-soft); animation: card-enter .3s ease both; }
  .form-heading strong { font-size: 13px; color: var(--rei-heading); }
  .form-heading p { margin: 5px 0 17px; color: var(--rei-muted); font-size: 10px; }
  .form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 14px; }
  .form-grid label { display: flex; flex-direction: column; gap: 7px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .form-grid input, .form-grid select, .form-grid textarea { width: 100%; min-width: 0; padding: 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease; }
  .form-grid input:focus, .form-grid select:focus, .form-grid textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .form-grid input::placeholder, .form-grid textarea::placeholder, .task-link-form input::placeholder, .task-issue-form textarea::placeholder { color: var(--rei-soft); }
  .description-field { grid-column: 1 / -1; }
  .form-grid textarea { resize: vertical; }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .kanban-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 12px; overflow-x: auto; padding: 0 18px 18px; }
  .kanban-column { min-height: 180px; padding: 10px; border: 1px solid var(--rei-border-soft); border-radius: 9px; background: var(--rei-surface-3); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); transition: background-color .3s ease, border-color .2s ease; }
  .kanban-title { display: flex; align-items: center; justify-content: space-between; padding: 7px 4px 12px; font-size: 10px; font-weight: 700; }
  .kanban-title strong { color: var(--rei-muted); }
  .kanban-card { position: relative; display: flex; flex-direction: column; gap: 8px; padding: 12px; margin-bottom: 9px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); animation: card-enter .28s ease both; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .3s ease; }
  .kanban-card:nth-child(2) { animation-delay: .04s; }
  .kanban-card:nth-child(3) { animation-delay: .08s; }
  .kanban-card:nth-child(4) { animation-delay: .12s; }
  .kanban-card:nth-child(5) { animation-delay: .16s; }
  .kanban-card:hover { transform: translateY(-2px); box-shadow: var(--rei-shadow-hover); border-color: color-mix(in srgb, var(--rei-accent) 30%, var(--rei-border)); }
  .kanban-card strong { font-size: 11px; line-height: 1.5; color: var(--rei-text); }
  .kanban-card span, .kanban-card small { color: var(--rei-soft); font-size: 10px; }

  /* Tambahan untuk halaman baru (memakai gaya yang sama dengan komponen lama) */
  .kanban-card[draggable="true"] { cursor: grab; }
  .kanban-card .status-select { align-self: flex-start; }
  .kanban-card-details { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; }
  .kanban-card-details:focus-visible { outline: 2px solid var(--rei-accent); outline-offset: 4px; border-radius: 4px; }
  .kanban-card-details .kanban-link-count { color: var(--rei-accent); font-weight: 700; }
  .kanban-card-details .kanban-tag-count { color: var(--rei-warning-text); }
  .kanban-column.drag-over { outline: 2px dashed color-mix(in srgb, var(--rei-accent) 60%, transparent); outline-offset: -2px; background: color-mix(in srgb, var(--rei-accent) 7%, var(--rei-surface-3)); }
  .project-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 21px; }
  .project-description { margin: 14px 0 0; color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
  .project-card-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--rei-border-soft); }
  .danger-text { color: var(--rei-danger-text) !important; }
  .member-avatar { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 9px; font-weight: 700; }
  .report-list { display: grid; gap: 16px; margin-top: 20px; }
  .report-row-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 7px; color: var(--rei-muted); font-size: 10px; }
  .report-row-top strong { color: var(--rei-text); font-size: 11px; }

  .task-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 16px; background: var(--rei-overlay); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); animation: fade-in .18s ease both; }
  .task-modal { width: min(600px, 100%); max-height: min(88vh, 820px); overflow-y: auto; padding: 24px; border: 1px solid var(--rei-border); border-radius: 16px; background: var(--rei-surface); backdrop-filter: var(--rei-blur); -webkit-backdrop-filter: var(--rei-blur); color: var(--rei-text); box-shadow: var(--rei-shadow); animation: modal-enter .22s cubic-bezier(.2,.8,.2,1) both; }
  .task-modal-heading, .task-links-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .task-modal-eyebrow { color: var(--rei-gold-text); font-size: 9px; font-weight: 800; letter-spacing: 1.4px; }
  .task-modal-heading h2 { margin: 7px 0 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; line-height: 1.4; color: var(--rei-heading); }
  .task-modal-close { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 1px solid var(--rei-border); border-radius: 9px; background: transparent; color: var(--rei-muted); font-size: 21px; transition: transform .2s ease, color .2s ease, border-color .2s ease; }
  .task-modal-close:hover { transform: rotate(90deg); color: var(--rei-accent); border-color: color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); }
  .task-modal-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 0; border-bottom: 1px solid var(--rei-border); color: var(--rei-muted); font-size: 10px; }
  .task-modal-meta .status-select { max-width: none; }
  .task-modal-details { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 16px 0; }
  .task-modal-details div { display: flex; flex-direction: column; gap: 6px; }
  .task-modal-details span { color: var(--rei-muted); font-size: 10px; }
  .task-modal-details strong { font-size: 11px; color: var(--rei-text); }
  .task-modal-description { padding-bottom: 17px; border-bottom: 1px solid var(--rei-border); }
  .task-modal h3 { margin: 0; font-size: 11px; font-weight: 800; color: var(--rei-heading); }
  .task-modal-description p { margin: 7px 0 0; color: var(--rei-muted); font-size: 11px; line-height: 1.7; white-space: pre-wrap; }
  .task-tags-section { padding-top: 17px; margin-top: 17px; border-top: 1px solid var(--rei-border); }
  .task-tags-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .task-tags-heading p { margin: 5px 0 0; color: var(--rei-muted); font-size: 10px; line-height: 1.5; }
  .task-tags-heading > span { flex-shrink: 0; color: var(--rei-muted); font-size: 10px; }
  .task-tag-list { display: flex; flex-wrap: wrap; gap: 7px; padding: 0; margin: 13px 0; list-style: none; }
  .task-tag-list li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid var(--rei-border); border-radius: 999px; background: var(--rei-surface-2); transition: border-color .2s ease, transform .2s ease; }
  .task-tag-list li:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--rei-accent) 32%, var(--rei-border)); }
  .task-tag-avatar { display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 8px; font-weight: 800; }
  .task-tag-info { display: flex; flex-direction: column; gap: 1px; }
  .task-tag-info strong { color: var(--rei-text); font-size: 9px; }
  .task-tag-info small { color: var(--rei-soft); font-size: 8px; }
  .task-tag-remove { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--rei-muted); font-size: 14px; line-height: 1; transition: background-color .18s ease, color .18s ease; }
  .task-tag-remove:hover:not(:disabled) { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .task-tag-empty { margin: 13px 0; color: var(--rei-muted); font-size: 10px; }
  .task-tag-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 10px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .task-tag-form select { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; transition: border-color .2s ease, box-shadow .2s ease; }
  .task-tag-form select:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .task-tag-form .secondary-button { min-height: 34px; padding: 0 10px; font-size: 9px; }
  .task-tag-hint { margin: 10px 0 0; color: var(--rei-soft); font-size: 9px; }
  .task-links-section { padding-top: 17px; }
  .task-links-heading { align-items: center; }
  .task-links-heading p { margin: 5px 0 0; color: var(--rei-muted); font-size: 10px; line-height: 1.5; }
  .task-links-heading > span { flex-shrink: 0; color: var(--rei-muted); font-size: 10px; }
  .task-links-list { display: grid; gap: 8px; padding: 0; margin: 13px 0; list-style: none; }
  .task-links-list li { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); transition: border-color .2s ease, transform .2s ease; }
  .task-links-list li:hover { transform: translateX(2px); border-color: color-mix(in srgb, var(--rei-accent) 32%, var(--rei-border)); }
  .task-links-list a { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; color: var(--rei-accent); text-decoration: none; }
  .task-links-list a span { font-size: 10px; font-weight: 700; }
  .task-links-list a small { overflow: hidden; color: var(--rei-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .task-links-list li > button { padding: 5px 7px; border: 0; border-radius: 6px; background: var(--rei-danger-soft); color: var(--rei-danger-text); font-size: 9px; font-weight: 700; }
  .task-links-empty { margin: 13px 0; color: var(--rei-muted); font-size: 10px; }
  .task-link-form { display: grid; grid-template-columns: 1fr 1.5fr auto; align-items: end; gap: 8px; padding: 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .task-link-form label { display: flex; flex-direction: column; gap: 6px; min-width: 0; color: var(--rei-muted); font-size: 9px; font-weight: 700; }
  .task-link-form input { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; transition: border-color .2s ease, box-shadow .2s ease; }
  .task-link-form input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .task-link-form .secondary-button { min-height: 34px; padding: 0 9px; font-size: 9px; }
  .task-link-error, .task-link-notice { margin: 9px 0 0; font-size: 10px; }
  .task-link-error { color: var(--rei-danger-text); }
  .task-link-notice { color: var(--rei-success-text); }
  .task-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .task-issues-section { padding-top: 18px; margin-top: 18px; border-top: 1px solid var(--rei-border); }
  .task-issues-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .task-issues-heading span { color: var(--rei-muted); font-size: 10px; }
  .task-issue-list { display: grid; gap: 9px; max-height: 260px; overflow-y: auto; padding: 0; margin: 13px 0; list-style: none; }
  .task-issue-list li { padding: 12px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); }
  .task-issue-meta { display: flex; justify-content: space-between; gap: 10px; color: var(--rei-text); font-size: 10px; }
  .task-issue-meta time { color: var(--rei-muted); font-size: 9px; }
  .task-issue-list li p { margin: 8px 0; color: var(--rei-text); font-size: 11px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
  .task-issue-evidence { color: var(--rei-accent); font-size: 10px; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
  .task-issue-evidence:hover { text-decoration: underline; }
  .task-issue-empty { margin: 13px 0; color: var(--rei-muted); font-size: 10px; }
  .task-issue-form { display: grid; gap: 11px; padding: 13px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .task-issue-form label { display: flex; flex-direction: column; gap: 7px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .task-issue-form label span, .task-issue-form label small { color: var(--rei-soft); font-size: 9px; font-weight: 400; }
  .task-issue-form textarea, .task-issue-form input[type="file"] { width: 100%; padding: 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; transition: border-color .2s ease, box-shadow .2s ease; }
  .task-issue-form textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .task-issue-form textarea { resize: vertical; line-height: 1.5; }
  .task-issue-selected-file { margin: -4px 0 0; color: var(--rei-muted); font-size: 9px; overflow-wrap: anywhere; }
  .task-issue-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .task-issue-actions > span { color: var(--rei-soft); font-size: 9px; }

  /* Chat */
  .chat-panel { padding: 16px; }
  .chat-error { margin-bottom: 12px; }
  .chat-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 14px; height: calc(100vh - 300px); min-height: 480px; }
  .chat-sidebar { display: flex; flex-direction: column; min-height: 0; padding: 14px; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface-2); }
  .chat-sidebar-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
  .chat-sidebar-head h2 { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 800; color: var(--rei-heading); }
  .chat-sidebar-head p { display: flex; flex-direction: column; gap: 4px; margin: 5px 0 0; color: var(--rei-muted); font-size: 9px; }
  .chat-new { min-height: 30px; padding: 0 10px; font-size: 10px; }
  .chat-live { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; font-weight: 700; }
  .chat-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--rei-soft); }
  .chat-live-online { color: var(--rei-success-text); }
  .chat-live-online::before { background: var(--rei-success-text); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-success-text) 20%, transparent); animation: pulse-dot 2.4s ease-in-out infinite; }
  .chat-live-connecting { color: var(--rei-warning-text); }
  .chat-live-connecting::before { background: var(--rei-warning-text); }
  .chat-live-offline { color: var(--rei-danger-text); }
  .chat-live-offline::before { background: var(--rei-danger-text); }
  .chat-search { height: 33px; margin-bottom: 10px; }
  .chat-search input { width: 100%; }
  .chat-conversation-list { display: flex; flex: 1; flex-direction: column; gap: 5px; min-height: 0; overflow-y: auto; padding-right: 2px; }
  .chat-conversation { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--rei-text); text-align: left; transition: background-color .18s ease, border-color .18s ease, transform .18s ease; }
  .chat-conversation:hover { background: var(--rei-surface-hover); transform: translateX(1px); }
  .chat-conversation.active { border-color: color-mix(in srgb, var(--rei-accent) 35%, transparent); background: var(--rei-accent-soft-bg); }
  .chat-conversation-avatar { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 10px; font-weight: 800; }
  .chat-conversation.active .chat-conversation-avatar { background: var(--rei-accent); color: var(--rei-accent-contrast); }
  .chat-conversation-body { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 0; }
  .chat-conversation-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .chat-conversation-top strong { overflow: hidden; color: var(--rei-text); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-conversation-top time { flex-shrink: 0; color: var(--rei-soft); font-size: 8px; }
  .chat-conversation-bottom { display: flex; align-items: center; gap: 8px; }
  .chat-conversation-bottom small { flex: 1; overflow: hidden; color: var(--rei-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-conversation.unread .chat-conversation-bottom small { color: var(--rei-text); font-weight: 700; }
  .chat-unread { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--rei-accent); color: var(--rei-accent-contrast); font-size: 8px; font-weight: 800; }
  .chat-list-empty { display: flex; flex-direction: column; gap: 8px; padding: 26px 8px; color: var(--rei-soft); text-align: center; font-size: 10px; line-height: 1.6; }
  .chat-thread { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid var(--rei-border); border-radius: 12px; background: var(--rei-surface); }
  .chat-thread-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--rei-border); background: var(--rei-surface-2); }
  .chat-thread-info { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
  .chat-thread-info strong { overflow: hidden; color: var(--rei-heading); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-thread-info span { color: var(--rei-muted); font-size: 9px; }
  .chat-back { display: none; place-items: center; width: 28px; height: 28px; flex-shrink: 0; border: 1px solid var(--rei-border); border-radius: 8px; background: transparent; color: var(--rei-muted); font-size: 18px; line-height: 1; }
  .chat-back:hover { color: var(--rei-accent); border-color: color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); }
  .chat-messages { display: flex; flex: 1; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; padding: 16px; background: var(--rei-surface-3); }
  .chat-thread-empty { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: var(--rei-soft); text-align: center; font-size: 10px; }
  .chat-thread-empty strong { color: var(--rei-text); font-size: 12px; }
  .chat-thread-empty p { margin: 0; }
  .chat-load-more { align-self: center; padding: 6px 12px; border: 1px solid var(--rei-border); border-radius: 20px; background: var(--rei-surface); color: var(--rei-muted); font-size: 9px; font-weight: 700; }
  .chat-load-more:hover { color: var(--rei-accent); border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); }
  .chat-message { display: flex; align-items: flex-end; gap: 8px; max-width: 82%; animation: chat-message-in .22s ease both; }
  .chat-message.own { align-self: flex-end; flex-direction: row-reverse; }
  .chat-message-avatar { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 8px; font-weight: 800; }
  .chat-message-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .chat-message.own .chat-message-body { align-items: flex-end; }
  .chat-message-sender { color: var(--rei-muted); font-size: 8px; font-weight: 700; }
  .chat-bubble { padding: 9px 12px; border: 1px solid var(--rei-border); border-radius: 12px 12px 12px 4px; background: var(--rei-surface); box-shadow: var(--rei-shadow-soft); }
  .chat-message.own .chat-bubble { border-color: transparent; border-radius: 12px 12px 4px 12px; background: var(--rei-accent); color: var(--rei-accent-contrast); }
  .chat-bubble p { margin: 0; font-size: 11px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
  .chat-attachments { display: grid; gap: 7px; }
  .chat-bubble p + .chat-attachments { margin-top: 8px; }
  .chat-image { display: flex; flex-direction: column; gap: 4px; overflow: hidden; border-radius: 8px; background: color-mix(in srgb, var(--rei-surface) 70%, transparent); text-decoration: none; }
  .chat-image img { display: block; max-width: 260px; max-height: 220px; border-radius: 8px; object-fit: cover; transition: transform .25s ease; }
  .chat-image:hover img { transform: scale(1.02); }
  .chat-image span { padding: 0 7px 6px; color: var(--rei-muted); font-size: 8px; overflow-wrap: anywhere; }
  .chat-message.own .chat-image span { color: color-mix(in srgb, var(--rei-accent-contrast) 75%, transparent); }
  .chat-file { display: flex; align-items: center; gap: 8px; min-width: 180px; padding: 8px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface-2); text-decoration: none; transition: border-color .2s ease, transform .2s ease; }
  .chat-message.own .chat-file { border-color: color-mix(in srgb, var(--rei-accent-contrast) 30%, transparent); background: color-mix(in srgb, var(--rei-accent-contrast) 12%, transparent); }
  .chat-file:hover { transform: translateY(-1px); border-color: var(--rei-accent); }
  .chat-file-icon { display: grid; place-items: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: 7px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 8px; font-weight: 800; }
  .chat-message.own .chat-file-icon { background: color-mix(in srgb, var(--rei-accent-contrast) 22%, transparent); color: var(--rei-accent-contrast); }
  .chat-file-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .chat-file-text strong { overflow: hidden; color: var(--rei-text); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-message.own .chat-file-text strong { color: var(--rei-accent-contrast); }
  .chat-file-text small { color: var(--rei-muted); font-size: 8px; }
  .chat-message.own .chat-file-text small { color: color-mix(in srgb, var(--rei-accent-contrast) 75%, transparent); }
  .chat-file-download { color: var(--rei-accent); font-size: 12px; font-weight: 800; }
  .chat-message.own .chat-file-download { color: var(--rei-accent-contrast); }
  .chat-message-time { color: var(--rei-soft); font-size: 8px; }
  .chat-composer { display: flex; flex-direction: column; gap: 7px; padding: 10px 14px 9px; border-top: 1px solid var(--rei-border); background: var(--rei-surface); transition: background-color .2s ease, box-shadow .2s ease; }
  .chat-composer.dragging { background: var(--rei-accent-soft-bg); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--rei-accent) 45%, transparent); }
  .chat-composer-row { display: flex; align-items: flex-end; gap: 8px; }
  .chat-attach { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border: 1px solid var(--rei-border-strong); border-radius: 8px; background: var(--rei-surface-2); color: var(--rei-accent); font-size: 18px; line-height: 1; transition: transform .18s ease, border-color .18s ease; }
  .chat-attach:hover { transform: translateY(-1px); border-color: var(--rei-accent); }
  .chat-composer textarea { flex: 1; min-height: 34px; max-height: 120px; padding: 9px 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; line-height: 1.5; resize: none; }
  .chat-composer textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .chat-send { min-height: 34px; }
  .chat-composer-hint { color: var(--rei-soft); font-size: 8px; }
  .chat-pending-files { display: flex; flex-wrap: wrap; gap: 6px; }
  .chat-pending-file { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 5px 8px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface-2); }
  .chat-pending-name { overflow: hidden; max-width: 150px; color: var(--rei-text); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-pending-file small { color: var(--rei-soft); font-size: 8px; }
  .chat-pending-file button { border: 0; background: transparent; color: var(--rei-danger-text); font-size: 14px; line-height: 1; }
  .chat-idle { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; padding: 32px; color: var(--rei-muted); text-align: center; }
  .chat-idle-mark { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 22px; animation: chat-float 5s ease-in-out infinite; }
  .chat-idle strong { color: var(--rei-heading); font-size: 14px; }
  .chat-idle p { max-width: 320px; margin: 0 0 6px; font-size: 10px; line-height: 1.7; }
  .chat-create-modal { width: min(520px, 100%); }
  .chat-create-hint { margin: 10px 0 14px; color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
  .chat-create-name { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .chat-create-name input { width: 100%; padding: 9px 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; }
  .chat-create-name input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .chat-member-list { display: grid; gap: 6px; max-height: 300px; overflow-y: auto; padding: 2px; }
  .chat-member { position: relative; display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); cursor: pointer; transition: border-color .18s ease, background-color .18s ease; }
  .chat-member:hover { border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); }
  .chat-member.selected { border-color: color-mix(in srgb, var(--rei-accent) 55%, transparent); background: var(--rei-accent-soft-bg); }
  .chat-member input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .chat-member-info { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .chat-member-info strong { color: var(--rei-text); font-size: 10px; }
  .chat-member-info small { color: var(--rei-muted); font-size: 8px; }
  .chat-member-check { display: grid; place-items: center; width: 17px; height: 17px; border: 1px solid var(--rei-border-strong); border-radius: 5px; color: transparent; font-size: 9px; font-weight: 800; }
  .chat-member.selected .chat-member-check { border-color: var(--rei-accent); background: var(--rei-accent); color: var(--rei-accent-contrast); }
  .chat-member-empty { margin: 0; padding: 18px; color: var(--rei-soft); text-align: center; font-size: 10px; }

  /* Kehadiran dan status */
  .chat-presence-bar { display: flex; gap: 6px; margin-bottom: 10px; }
  .chat-self-status { display: flex; flex: 1; align-items: center; gap: 7px; min-width: 0; padding: 7px 9px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface); color: var(--rei-text); text-align: left; transition: border-color .18s ease, transform .18s ease; }
  .chat-self-status:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); }
  .chat-self-status-text { display: flex; flex: 1; flex-direction: column; gap: 1px; min-width: 0; }
  .chat-self-status-text small { color: var(--rei-soft); font-size: 8px; }
  .chat-self-status-text strong { overflow: hidden; color: var(--rei-text); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-self-status-edit { flex-shrink: 0; color: var(--rei-accent); font-size: 8px; font-weight: 700; }
  .chat-status-icon { display: grid; place-items: center; width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; background: var(--chat-tone-soft, var(--rei-surface-2)); color: var(--chat-tone, var(--rei-accent-soft-text)); font-size: 9px; line-height: 1; }
  .chat-team-button { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; padding: 0 10px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface); color: var(--rei-muted); font-size: 9px; font-weight: 700; transition: border-color .18s ease, color .18s ease; }
  .chat-team-button:hover { border-color: color-mix(in srgb, var(--rei-success-text) 45%, var(--rei-border)); color: var(--rei-success-text); }
  .chat-team-button > span { display: inline-flex; align-items: baseline; gap: 3px; }
  .chat-team-button small { color: var(--rei-soft); font-size: 8px; font-weight: 500; }

  .tone-available { --chat-tone: var(--rei-success-text); --chat-tone-soft: var(--rei-success-soft); }
  .tone-meeting { --chat-tone: var(--rei-warning-text); --chat-tone-soft: var(--rei-warning-soft); }
  .tone-leave { --chat-tone: var(--rei-info-text); --chat-tone-soft: var(--rei-info-soft); }
  .tone-slow { --chat-tone: var(--rei-orange-text); --chat-tone-soft: var(--rei-orange-soft); }

  .chat-presence-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--rei-soft); box-shadow: 0 0 0 2px var(--rei-surface); }
  .chat-presence-dot.online { background: #22a06b; box-shadow: 0 0 0 2px var(--rei-surface), 0 0 0 3px #22a06b26; animation: pulse-dot 2.4s ease-in-out infinite; }
  .chat-conversation-avatar { position: relative; }
  .chat-team-avatar { position: relative; }
  .chat-conversation-avatar > .chat-presence-dot { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border: 2px solid var(--rei-surface); box-shadow: none; }
  .chat-conversation.active .chat-conversation-avatar > .chat-presence-dot { border-color: var(--rei-accent-soft-bg); }

  .chat-status-chip { display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0; padding: 2px 6px; border-radius: 5px; background: var(--chat-tone-soft); color: var(--chat-tone); font-size: 8px; font-weight: 800; white-space: nowrap; }
  .chat-thread-presence { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .chat-thread-presence .chat-presence-dot { width: 7px; height: 7px; }
  .chat-status-note { overflow: hidden; max-width: 220px; color: var(--rei-soft); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-thread-team { flex-shrink: 0; padding: 5px 8px; border: 1px solid var(--rei-border); border-radius: 7px; background: var(--rei-surface); color: var(--rei-muted); font-size: 8px; font-weight: 700; transition: border-color .18s ease, color .18s ease; }
  .chat-thread-team:hover { color: var(--rei-success-text); border-color: color-mix(in srgb, var(--rei-success-text) 40%, var(--rei-border)); }

  .chat-team-modal { width: min(560px, 100%); }
  .chat-status-form { margin-top: 14px; padding: 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .chat-status-form-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; color: var(--rei-muted); font-size: 9px; font-weight: 700; }
  .chat-status-form-label span { color: var(--rei-soft); font-size: 8px; font-weight: 500; }
  .chat-status-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .chat-status-option { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border: 1px solid var(--rei-border); border-radius: 8px; background: var(--rei-surface); color: var(--rei-text); font-size: 9px; font-weight: 600; text-align: left; transition: border-color .18s ease, background-color .18s ease; }
  .chat-status-option:hover { border-color: color-mix(in srgb, var(--chat-tone) 45%, var(--rei-border)); }
  .chat-status-option.active { border-color: var(--chat-tone); background: var(--chat-tone-soft); color: var(--chat-tone); font-weight: 800; }
  .chat-status-option.active .chat-status-icon { background: var(--rei-surface); }
  .chat-status-note-row { display: flex; gap: 7px; margin-top: 8px; }
  .chat-status-note-row input { flex: 1; min-width: 0; padding: 8px 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 9px; }
  .chat-status-note-row input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .chat-status-note-row .primary-button { min-height: 31px; padding: 0 12px; }
  .chat-status-hint { margin: 7px 0 0; color: var(--rei-soft); font-size: 8px; line-height: 1.5; }
  .chat-team-search { height: 33px; margin: 14px 0 8px; }
  .chat-team-search input { width: 100%; }
  .chat-team-list { display: grid; gap: 6px; max-height: 280px; overflow-y: auto; padding: 2px; }
  .chat-team-row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface-2); color: var(--rei-text); text-align: left; transition: border-color .18s ease, transform .18s ease; }
  .chat-team-row:hover:not(:disabled) { transform: translateX(1px); border-color: color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); }
  .chat-team-row:disabled { opacity: .6; }
  .chat-team-avatar { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 9px; font-weight: 800; }
  .chat-team-avatar > .chat-presence-dot { position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px; border: 2px solid var(--rei-surface-2); box-shadow: none; }
  .chat-team-info { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .chat-team-info strong { overflow: hidden; color: var(--rei-text); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-team-info small { overflow: hidden; color: var(--rei-muted); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
  .chat-team-info .chat-team-note { color: var(--rei-soft); font-style: italic; }
  .chat-team-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
  .chat-team-online { color: var(--rei-soft); font-size: 8px; font-weight: 700; }
  .chat-team-online.online { color: var(--rei-success-text); }
  .chat-team-hint { margin: 8px 0 0; color: var(--rei-soft); font-size: 8px; text-align: center; }
  .chat-team-error { margin: 0 0 6px; }

  @keyframes chat-message-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes chat-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

  @keyframes page-enter { from { opacity: 0; } to { opacity: 1; } }
  @keyframes card-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modal-enter { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes menu-in { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes option-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes nav-indicator { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
  @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 3px #22a06b18; } 50% { box-shadow: 0 0 0 6px #22a06b10; } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  }

  @media (min-width: 1600px) { .page-content { padding-right: 48px; padding-left: 48px; } }
  @media (max-width: 1150px) {
    .sidebar { width: 215px; }
    .main-content { margin-left: 215px; }
    .topbar { padding: 0 24px; }
    .page-content { padding: 27px 24px 18px; }
    .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .progress-summary { gap: 22px; }
    .progress-ring { width: 110px; height: 110px; }
    .progress-ring-inner { width: 83px; height: 83px; }
    .progress-ring-inner strong { font-size: 22px; }
    .form-grid { grid-template-columns: 1fr 1fr; }
    .chat-layout { grid-template-columns: 260px minmax(0, 1fr); }
  }
  @media (max-width: 800px) {
    .sidebar { position: static; width: 100%; height: auto; padding: 14px 16px; border-right: 0; border-bottom: 1px solid var(--rei-border); }
    .brand { padding-bottom: 12px; }
    .workspace-label, .workspace, .menu-label, .sidebar-bottom { display: none; }
    .navigation { display: flex; overflow-x: auto; gap: 5px; padding: 0 0 2px; }
    .nav-item { width: auto; min-width: max-content; min-height: 36px; padding: 0 11px; }
    .nav-item.active:before { display: none; }
    .main-content { margin-left: 0; }
    .topbar { height: 54px; padding: 0 17px; }
    .page-content { padding: 24px 16px 16px; }
    .welcome-row { align-items: flex-start; flex-direction: column; }
    .welcome-actions { width: 100%; flex-wrap: wrap; }
    .stats-grid { gap: 10px; }
    .stat-card { padding: 14px; }
    .stat-value { font-size: 25px; }
    .overview-grid { grid-template-columns: 1fr; }
    .project-grid { grid-template-columns: 1fr; }
    .tasks-heading { align-items: flex-start; flex-direction: column; }
    .task-tools { width: 100%; }
    .search-box { flex: 1; }
    .search-box input { width: 100%; }
    .form-grid { grid-template-columns: 1fr; }
    .description-field { grid-column: auto; }
    .page-footer { flex-direction: column; }
    .task-link-form { grid-template-columns: 1fr; }
    .task-tag-form { grid-template-columns: 1fr; }
    .task-tags-heading { flex-direction: column; gap: 6px; }
    .task-issue-actions { align-items: flex-start; flex-direction: column; }
    .task-modal { padding: 19px; }
    .theme-toggle span:nth-child(2) { display: none; }
    .chat-panel { padding: 12px; }
    .chat-layout { grid-template-columns: 1fr; height: calc(100vh - 250px); min-height: 440px; }
    .chat-thread { display: none; }
    .chat-layout.has-active .chat-sidebar { display: none; }
    .chat-layout.has-active .chat-thread { display: flex; }
    .chat-back { display: grid; }
    .chat-message { max-width: 92%; }
    .chat-image img { max-width: 200px; }
    .chat-thread-team { display: none; }
    .chat-status-options { grid-template-columns: 1fr; }
    .chat-status-note { max-width: 140px; }
  }
  @media (max-width: 430px) {
    .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .stat-label { font-size: 10px; }
    .stat-note { font-size: 9px; }
    .system-status { display: none; }
    h1 { font-size: 24px; }
    .progress-summary { gap: 17px; }
    .progress-ring { width: 100px; height: 100px; }
    .progress-ring-inner { width: 76px; height: 76px; }
    .progress-legend { min-width: 120px; }
    .progress-legend div { gap: 6px; }
    .filter-select { max-width: 125px; }
    .theme-menu { width: min(244px, calc(100vw - 34px)); }
  }
`;
