import css from "styled-jsx/css";

/** Gaya fitur lanjutan (label, filter, pengaturan, riwayat, dst.). Semua warna dari token tema. */
export const featureStyles = css.global`
  /* ---------- Panduan pengguna ---------- */
  .guide-content { display: grid; gap: 18px; margin-bottom: 20px; }
  .guide-panel { min-width: 0; }
  .guide-panel .panel-heading { align-items: center; }
  .guide-download { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; white-space: nowrap; }
  .guide-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 2px; padding: 0; list-style-position: inside; }
  .guide-steps li { min-width: 0; padding: 13px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); color: var(--rei-accent); font-size: 11px; font-weight: 800; }
  .guide-steps li strong, .guide-steps li span { display: block; }
  .guide-steps li strong { margin-top: 6px; color: var(--rei-heading); }
  .guide-steps li span { margin-top: 5px; color: var(--rei-muted); font-size: 10px; font-weight: 500; line-height: 1.55; }
  .guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 18px; }
  .guide-list { display: grid; gap: 9px; margin: 15px 0 0; padding-left: 19px; color: var(--rei-text); font-size: 11px; line-height: 1.65; }
  .guide-list li::marker { color: var(--rei-gold-text); }
  .guide-list strong { color: var(--rei-heading); }
  .guide-note { margin: 16px 0 0; padding: 10px 12px; border-left: 3px solid var(--rei-gold); border-radius: 0 7px 7px 0; background: var(--rei-gold-soft); color: var(--rei-text); font-size: 10px; line-height: 1.6; }

  /* ---------- Label ---------- */
  .label-chips { display: inline-flex; flex-wrap: wrap; gap: 4px; }
  .label-chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--label-color) 14%, transparent); color: color-mix(in srgb, var(--label-color) 78%, var(--rei-text)); font-size: 9px; font-weight: 700; line-height: 1.6; white-space: nowrap; }
  .label-chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--label-color); }
  .label-chips-small { margin-top: 4px; }
  .label-chips-small .label-chip { padding: 1px 6px; font-size: 8px; }
  .task-name + .label-chips-small { margin-left: 18px; }
  .label-picker { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; }
  .label-picker legend { padding: 0 4px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .label-picker small { color: var(--rei-soft); font-size: 10px; }
  .form-grid .label-option { flex-direction: row; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid var(--rei-border); border-radius: 999px; color: var(--rei-text); cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
  .form-grid .label-option input { width: auto; margin: 0; accent-color: var(--label-color); }
  .form-grid .label-option.active { border-color: var(--label-color); background: color-mix(in srgb, var(--label-color) 12%, transparent); }

  /* ---------- Filter lanjutan ---------- */
  .filter-toggle { min-height: 35px; font-size: 10px; }
  .filter-toggle.active { border-color: var(--rei-accent); color: var(--rei-accent); }
  .filter-bar { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)) auto; align-items: end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--rei-border); border-bottom: 1px solid var(--rei-border); background: var(--rei-surface-2); animation: fade-in .18s ease both; }
  .filter-bar label { display: flex; flex-direction: column; gap: 5px; color: var(--rei-muted); font-size: 9px; font-weight: 700; }
  .filter-bar select, .filter-bar input { height: 33px; min-width: 0; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 7px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; }
  .filter-bar-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
  .filter-bar-actions .secondary-button { min-height: 33px; font-size: 10px; }
  .secondary-button.danger { color: var(--rei-danger-text); }
  .secondary-button.danger:hover { border-color: var(--rei-danger-border); background: var(--rei-danger-soft); }

  /* ---------- Riwayat aktivitas ---------- */
  .activity-list { display: flex; flex-direction: column; gap: 10px; margin: 13px 0 8px; padding: 0; list-style: none; }
  .activity-list li { display: flex; align-items: flex-start; gap: 10px; }
  .activity-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; color: var(--rei-text); font-size: 11px; line-height: 1.5; }
  .activity-body time { color: var(--rei-soft); font-size: 9px; }
  .activity-link { padding: 0; border: 0; background: none; color: var(--rei-text); text-align: left; font-size: 11px; line-height: 1.5; }
  .activity-link:hover { color: var(--rei-accent); text-decoration: underline; }
  .activity-panel { margin-bottom: 20px; }
  .activity-feed { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin: 4px 0 0; }

  /* ---------- Edit tugas & modal kecil ---------- */
  .task-edit-form { grid-template-columns: 1fr 1fr; margin-top: 14px; }
  .small-modal { width: min(440px, 100%); }
  .form-grid.single-column { grid-template-columns: 1fr; margin-top: 18px; }

  /* ---------- Pengaturan ---------- */
  .settings-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); align-items: start; gap: 20px; margin-bottom: 20px; }
  .settings-grid > .settings-wide { grid-column: 1 / -1; }
  .settings-panel { margin-bottom: 0; }
  .settings-inline-form { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 0 20px 16px; }
  .settings-inline-form input, .settings-inline-form select { flex: 1 1 160px; height: 35px; min-width: 0; padding: 0 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; }
  .settings-inline-form .primary-button { min-height: 35px; }
  .settings-name { display: flex; flex-direction: column; gap: 2px; }
  .settings-name small { color: var(--rei-muted); font-size: 10px; }
  .settings-rename { display: flex; align-items: center; gap: 6px; }
  .settings-rename input { height: 30px; min-width: 0; padding: 0 8px; border: 1px solid var(--rei-accent); border-radius: 6px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; }
  .settings-empty { margin: 0; padding: 0 20px 20px; color: var(--rei-muted); font-size: 11px; }
  .settings-label-list { display: flex; flex-direction: column; margin: 0; padding: 0 20px 16px; list-style: none; }
  .settings-label-list li { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid var(--rei-border); }
  .settings-label-list .label-chip { justify-self: start; }
  .settings-label-list small { color: var(--rei-muted); font-size: 10px; }
  .settings-label-list input[type="color"] { width: 28px; height: 24px; padding: 0; border: 1px solid var(--rei-border); border-radius: 6px; background: none; cursor: pointer; }
  .color-swatches { display: flex; gap: 5px; }
  .color-swatch { width: 22px; height: 22px; padding: 0; border: 2px solid transparent; border-radius: 50%; box-shadow: 0 0 0 1px var(--rei-border); transition: transform .15s ease; }
  .color-swatch:hover { transform: scale(1.12); }
  .color-swatch.active { border-color: var(--rei-surface); box-shadow: 0 0 0 2px var(--rei-text); }

  /* ---------- Aksi baris tabel ---------- */
  .row-actions { white-space: nowrap; text-align: right; }
  .icon-action { display: inline-grid; place-items: center; width: 28px; height: 28px; margin-left: 4px; padding: 0; border: 1px solid var(--rei-border); border-radius: 7px; background: var(--rei-surface); color: var(--rei-muted); font-size: 11px; transition: color .15s ease, border-color .15s ease, background-color .15s ease; }
  .icon-action:hover { border-color: var(--rei-accent); color: var(--rei-accent); }
  .icon-action.danger:hover { border-color: var(--rei-danger-border); background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .profile-menu button + button { margin-top: 6px; }

  /* ---------- Sub-tugas ---------- */
  .subtask-progress { margin: 12px 0 4px; }
  .subtask-list { display: flex; flex-direction: column; gap: 2px; margin: 8px 0 12px; padding: 0; list-style: none; }
  .subtask-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 8px; transition: background-color .15s ease; }
  .subtask-list li:hover { background: var(--rei-surface-2); }
  .subtask-list label { display: flex; flex: 1; align-items: center; gap: 9px; min-width: 0; color: var(--rei-text); font-size: 11px; cursor: pointer; }
  .subtask-list input { width: 15px; height: 15px; accent-color: var(--rei-accent); }
  .subtask-list li.done label span { color: var(--rei-soft); text-decoration: line-through; }
  .subtask-actions { display: flex; gap: 2px; opacity: 0; transition: opacity .15s ease; }
  .subtask-list li:hover .subtask-actions, .subtask-actions:focus-within { opacity: 1; }
  .subtask-actions button { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--rei-muted); font-size: 10px; }
  .subtask-actions button:hover:not(:disabled) { background: var(--rei-surface-3); color: var(--rei-text); }
  .inline-input { width: 100%; min-width: 0; height: 34px; padding: 0 9px; border: 1px solid var(--rei-border-strong); border-radius: 7px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; }
  .inline-input:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }

  /* ---------- Indikator kartu ---------- */
  .task-badges { display: inline-flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; color: var(--rei-muted); font-size: 9px; }
  .task-badges span { display: inline-flex; align-items: center; gap: 4px; }
  .task-badges .complete { color: var(--rei-success-text); }
  td .task-badges { margin-left: 18px; }

  /* ---------- Diskusi ---------- */
  .comment-list { display: flex; flex-direction: column; gap: 12px; margin: 13px 0; padding: 0; list-style: none; }
  .comment-list li { display: flex; align-items: flex-start; gap: 10px; }
  .comment-body { flex: 1; min-width: 0; padding: 9px 12px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .comment-list li.mine .comment-body { border-color: color-mix(in srgb, var(--rei-accent) 26%, var(--rei-border)); }
  .comment-meta { display: flex; align-items: baseline; gap: 8px; font-size: 10px; }
  .comment-meta strong { color: var(--rei-heading); }
  .comment-meta time { color: var(--rei-soft); font-size: 9px; }
  .comment-actions { display: flex; gap: 2px; margin-left: auto; opacity: 0; transition: opacity .15s ease; }
  .comment-list li:hover .comment-actions, .comment-actions:focus-within { opacity: 1; }
  .comment-actions button { padding: 2px 5px; border: 0; background: none; color: var(--rei-muted); font-size: 10px; }
  .comment-actions button:hover { color: var(--rei-accent); }
  .comment-body p { margin: 5px 0 0; color: var(--rei-text); font-size: 11px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
  .mention { padding: 0 3px; border-radius: 4px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-weight: 700; }
  .comment-edit textarea, .comment-composer textarea { width: 100%; min-width: 0; padding: 9px; border: 1px solid var(--rei-border-strong); border-radius: 8px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; line-height: 1.5; resize: vertical; }
  .comment-edit textarea:focus, .comment-composer textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
  .comment-edit { margin-top: 6px; }
  .comment-edit div { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
  .comment-composer { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 8px; }
  .comment-composer .primary-button { min-height: 36px; }
  .mention-suggestions { position: absolute; bottom: calc(100% + 4px); left: 0; z-index: 5; width: min(260px, 100%); margin: 0; padding: 4px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface); box-shadow: var(--rei-shadow); list-style: none; }
  .mention-suggestions button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border: 0; border-radius: 6px; background: none; color: var(--rei-text); text-align: left; font-size: 11px; }
  .mention-suggestions li:first-child button, .mention-suggestions button:hover { background: var(--rei-accent-soft-bg); }

  /* ---------- Lampiran ---------- */
  .attachment-list { display: flex; flex-direction: column; gap: 8px; margin: 13px 0; padding: 0; list-style: none; }
  .attachment-list > li { padding: 8px; border: 1px solid var(--rei-border); border-radius: 10px; }
  .attachment-row { display: flex; align-items: center; gap: 10px; }
  .attachment-thumb { display: grid; flex-shrink: 0; place-items: center; width: 38px; height: 38px; border-radius: 7px; background: var(--rei-surface-3); color: var(--rei-muted); object-fit: cover; font-size: 15px; }
  .attachment-info { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .attachment-info a { overflow: hidden; color: var(--rei-text); font-size: 11px; font-weight: 700; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-info a:hover { color: var(--rei-accent); }
  .attachment-info small { color: var(--rei-muted); font-size: 9px; }
  .attachment-note { font-style: italic; }
  .attachment-row .icon-action { text-decoration: none; }
  .attachment-history-toggle { margin: 6px 0 0 48px; font-size: 10px; }
  .attachment-versions { margin: 6px 0 0 48px; padding-left: 14px; color: var(--rei-muted); font-size: 10px; line-height: 1.8; }
  .attachment-form { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 10px; border: 1px dashed var(--rei-border-strong); border-radius: 10px; background: var(--rei-surface-2); }
  .attachment-form .inline-input { grid-column: 1 / -1; grid-row: 2; }
  .attachment-picker { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--rei-muted); font-size: 10px; cursor: pointer; }
  .attachment-picker span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attachment-picker input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .attachment-picker:focus-within { color: var(--rei-accent); }

  /* ---------- Kontrol umum ---------- */
  .segmented { display: inline-flex; padding: 3px; border: 1px solid var(--rei-border-strong); border-radius: 9px; background: var(--rei-surface-2); }
  .segmented button { padding: 6px 11px; border: 0; border-radius: 6px; background: transparent; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .segmented button.active { background: var(--rei-surface); color: var(--rei-accent); box-shadow: var(--rei-shadow-soft); }
  .checkbox-field { grid-column: 1 / -1; }
  .form-grid .checkbox-field { flex-direction: row; align-items: center; gap: 8px; color: var(--rei-text); font-size: 11px; font-weight: 600; }
  .form-grid .checkbox-field input { width: auto; accent-color: var(--rei-accent); }
  .milestone-pill { padding: 2px 8px; border-radius: 999px; background: var(--rei-gold-soft); color: var(--rei-gold-text); font-size: 9px; font-weight: 800; letter-spacing: .3px; }

  /* ---------- Kalender ---------- */
  .calendar, .timeline { padding: 0 20px 16px; }
  .calendar-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0 14px; }
  .calendar-nav { display: flex; align-items: center; gap: 6px; }
  .calendar-nav .icon-action { margin: 0; }
  .calendar-nav .secondary-button { min-height: 30px; font-size: 10px; }
  .calendar-nav strong { margin-left: 8px; color: var(--rei-heading); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; text-transform: capitalize; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); overflow: hidden; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-border); gap: 1px; }
  .calendar-weekday { padding: 8px; background: var(--rei-surface-2); color: var(--rei-muted); font-size: 9px; font-weight: 800; letter-spacing: .5px; text-align: center; text-transform: uppercase; }
  .calendar-cell { display: flex; flex-direction: column; gap: 3px; min-height: 104px; padding: 6px; background: var(--rei-surface); transition: background-color .15s ease; }
  .calendar-week .calendar-cell { min-height: 320px; }
  .calendar-cell.muted { background: var(--rei-surface-2); }
  .calendar-cell.muted .calendar-date { color: var(--rei-soft); }
  .calendar-cell.today .calendar-date { display: inline-grid; place-items: center; min-width: 22px; height: 22px; border-radius: 999px; background: var(--rei-accent); color: var(--rei-accent-contrast); }
  .calendar-cell.drop { background: color-mix(in srgb, var(--rei-accent) 10%, var(--rei-surface)); outline: 2px dashed var(--rei-accent); outline-offset: -3px; }
  .calendar-date { align-self: flex-start; margin-bottom: 2px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .calendar-task { display: flex; align-items: center; gap: 4px; width: 100%; padding: 3px 6px; border: 0; border-left: 3px solid currentColor; border-radius: 5px; font-size: 9px; font-weight: 700; text-align: left; }
  .calendar-task span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .calendar-task[draggable="true"] { cursor: grab; }
  .calendar-task.overdue { box-shadow: inset 0 0 0 1px var(--rei-danger-border); }
  .calendar-task.milestone { border-left-color: var(--rei-gold); }
  .calendar-task.milestone svg { color: var(--rei-gold); font-size: 8px; }
  .calendar-more { align-self: flex-start; padding: 0 4px; border: 0; background: none; color: var(--rei-accent); font-size: 9px; font-weight: 700; }
  .calendar-footnote { margin: 10px 0 0; color: var(--rei-muted); font-size: 10px; }

  /* ---------- Timeline ---------- */
  .timeline-controls { display: flex; flex-wrap: wrap; gap: 8px; }
  .timeline-scroll { overflow-x: auto; border: 1px solid var(--rei-border); border-radius: 10px; }
  .timeline-inner { min-width: calc(var(--tl-width) + 220px); }
  .timeline-header, .timeline-row { display: grid; grid-template-columns: 220px var(--tl-width); }
  .timeline-header { position: sticky; top: 0; z-index: 2; border-bottom: 1px solid var(--rei-border); background: var(--rei-surface-2); }
  .timeline-label-col { position: sticky; left: 0; z-index: 1; display: flex; align-items: center; gap: 6px; min-width: 0; padding: 0 12px; border-right: 1px solid var(--rei-border); background: var(--rei-surface); color: var(--rei-muted); font-size: 9px; font-weight: 800; letter-spacing: .5px; }
  .timeline-header .timeline-label-col { background: var(--rei-surface-2); text-transform: uppercase; }
  .timeline-days { display: flex; }
  .timeline-day { position: relative; display: flex; flex-direction: column; justify-content: flex-end; width: var(--tl-day); height: 40px; padding-bottom: 5px; color: var(--rei-muted); font-size: 9px; text-align: center; }
  .timeline-day small { position: absolute; top: 4px; left: 3px; color: var(--rei-heading); font-size: 9px; font-weight: 800; white-space: nowrap; text-transform: capitalize; }
  .timeline-day span { white-space: nowrap; }
  .timeline-day.weekend { background: color-mix(in srgb, var(--rei-text) 4%, transparent); }
  .timeline-day.today span { color: var(--rei-accent); font-weight: 800; }
  .timeline-group-title { position: sticky; left: 0; display: flex; align-items: center; gap: 8px; width: max-content; padding: 10px 12px 4px; font-size: 11px; }
  .timeline-group-title strong { color: var(--rei-heading); }
  .timeline-group-title small { color: var(--rei-muted); font-size: 9px; }
  .timeline-conflict-pill { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; background: var(--rei-danger-soft); color: var(--rei-danger-text); font-size: 9px; font-weight: 700; }
  .timeline-row { min-height: 32px; border-bottom: 1px solid var(--rei-border-soft); }
  .timeline-task-name { overflow: hidden; border-width: 0 1px 0 0; color: var(--rei-text); font-size: 10px; font-weight: 600; letter-spacing: 0; text-align: left; cursor: pointer; }
  .timeline-task-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .timeline-task-name svg { flex-shrink: 0; color: var(--rei-warning-text); }
  .timeline-task-name:hover { color: var(--rei-accent); }
  .timeline-track { position: relative; }
  .timeline-today { position: absolute; top: 0; bottom: 0; width: 2px; background: color-mix(in srgb, var(--rei-accent) 55%, transparent); }
  .timeline-bar { position: absolute; top: 7px; height: 18px; overflow: hidden; padding: 0 6px; border: 0; border-radius: 5px; font-size: 9px; font-weight: 700; text-align: left; white-space: nowrap; transition: filter .15s ease, transform .15s ease; }
  .timeline-bar:hover { filter: brightness(.96); transform: translateY(-1px); }
  .timeline-bar.overdue { box-shadow: inset 0 0 0 1.5px var(--rei-danger-text); }
  .timeline-bar.conflict { background-image: repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--rei-danger-text) 22%, transparent) 6px 9px); }
  .timeline-milestone { position: absolute; top: 6px; display: grid; place-items: center; width: 20px; height: 20px; margin-left: -10px; padding: 0; border: 0; background: none; color: var(--rei-gold); font-size: 15px; }
  .timeline-milestone.status-done { color: var(--rei-success-text); }
  .timeline-empty { margin: 0; padding: 24px; color: var(--rei-muted); font-size: 11px; text-align: center; }

  /* ---------- Kanban WIP ---------- */
  .wip-count.full { color: var(--rei-warning-text); }
  .wip-count.over { padding: 1px 7px; border-radius: 999px; background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .kanban-column.wip-over { border-color: var(--rei-danger-border); background: color-mix(in srgb, var(--rei-danger-soft) 45%, var(--rei-surface-3)); }
  .wip-warning { margin: -4px 2px 10px; color: var(--rei-danger-text); font-size: 9px; line-height: 1.4; }
  .kanban-card.milestone { border-color: color-mix(in srgb, var(--rei-gold) 55%, var(--rei-border)); }
  .kanban-card.milestone strong svg { color: var(--rei-gold); font-size: 9px; }
  .wip-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; align-items: end; gap: 10px; padding: 0 20px 18px; }
  .wip-form label { display: flex; flex-direction: column; gap: 6px; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .wip-form input { height: 35px; padding: 0 10px; border: 1px solid var(--rei-border-strong); border-radius: 8px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; }
  .wip-form .primary-button { min-height: 35px; }

  /* ---------- Tabel: urut, pilih, halaman ---------- */
  .sort-button { display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; }
  .sort-button .sort-idle { opacity: .35; }
  .sort-button:hover .sort-idle { opacity: .7; }
  .sort-button .sort-active { color: var(--rei-accent); }
  .select-col { width: 34px; }
  .select-col input { accent-color: var(--rei-accent); }
  tr.selected td { background: color-mix(in srgb, var(--rei-accent) 6%, transparent); }
  .bulk-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 20px 12px; padding: 9px 12px; border: 1px solid color-mix(in srgb, var(--rei-accent) 35%, var(--rei-border)); border-radius: 10px; background: var(--rei-accent-soft-bg); animation: fade-in .15s ease both; }
  .bulk-bar strong { margin-right: 4px; color: var(--rei-accent-soft-text); font-size: 11px; }
  .bulk-bar select { height: 32px; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 7px; background: var(--rei-surface); color: var(--rei-text); font-size: 10px; }
  .bulk-bar .secondary-button { min-height: 32px; font-size: 10px; }
  .bulk-busy { color: var(--rei-muted); font-size: 10px; }
  .pagination { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 0 0; color: var(--rei-muted); font-size: 10px; }
  .pagination .icon-action { margin: 0; }
  .pagination .icon-action:disabled { opacity: .4; cursor: not-allowed; }

  /* ---------- Dependensi ---------- */
  .dep-warning { display: flex; align-items: center; gap: 7px; margin: 12px 0 0; padding: 8px 10px; border-radius: 8px; background: var(--rei-warning-soft); color: var(--rei-warning-text); font-size: 10px; font-weight: 700; }
  .dep-heading { margin: 13px 0 6px; color: var(--rei-muted); font-size: 9px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; }
  .dep-list { display: flex; flex-direction: column; gap: 5px; margin: 0 0 10px; padding: 0; list-style: none; }
  .dep-list li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 1px solid var(--rei-border); border-radius: 8px; }
  .dep-link { flex: 1; min-width: 0; overflow: hidden; padding: 0; border: 0; background: none; color: var(--rei-text); text-align: left; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  .dep-link:hover { color: var(--rei-accent); text-decoration: underline; }
  .dep-done .dep-link { color: var(--rei-soft); text-decoration: line-through; }
  .dep-status { padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
  .task-badges .blocked { color: var(--rei-warning-text); font-weight: 700; }

  /* ---------- Pemberitahuan ---------- */
  .notif-root { position: relative; }
  .notif-button { position: relative; }
  .notif-count { position: absolute; top: -6px; right: -8px; min-width: 17px; height: 17px; padding: 0 4px; border: 2px solid var(--rei-topbar-bg, var(--rei-surface)); border-radius: 999px; background: var(--rei-danger-text); color: #fff; font-size: 9px; font-weight: 800; line-height: 13px; text-align: center; }
  .notif-panel { position: absolute; top: calc(100% + 10px); right: -40px; z-index: 60; display: flex; flex-direction: column; width: min(380px, calc(100vw - 32px)); max-height: min(540px, 75vh); border: 1px solid var(--rei-border); border-radius: 14px; background: var(--rei-surface); box-shadow: var(--rei-shadow); animation: fade-in .15s ease both; }
  .notif-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 8px; }
  .notif-head strong { color: var(--rei-heading); font-size: 13px; }
  .notif-head .text-button { font-size: 10px; }
  .notif-filter { margin: 0 16px 8px; align-self: flex-start; }
  .notif-empty { margin: 0; padding: 28px 16px; color: var(--rei-muted); font-size: 11px; text-align: center; }
  .notif-list { flex: 1; overflow-y: auto; margin: 0; padding: 0 6px 8px; list-style: none; }
  .notif-item { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 10px; border: 0; border-radius: 10px; background: transparent; color: var(--rei-text); text-align: left; transition: background-color .15s ease; }
  .notif-item:hover { background: var(--rei-surface-2); }
  .notif-item.unread { background: var(--rei-accent-soft-bg); }
  .notif-item.unread .notif-text strong::after { content: ''; display: inline-block; width: 7px; height: 7px; margin-left: 6px; border-radius: 50%; background: var(--rei-accent); vertical-align: middle; }
  .notif-icon { display: grid; flex-shrink: 0; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--rei-surface-3); color: var(--rei-muted); font-size: 12px; }
  .notif-overdue .notif-icon { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .notif-due_soon .notif-icon { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
  .notif-mentioned .notif-icon, .notif-assigned .notif-icon { background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
  .notif-dependency_ready .notif-icon, .notif-status_changed .notif-icon { background: var(--rei-success-soft); color: var(--rei-success-text); }
  .notif-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .notif-text strong { font-size: 11px; line-height: 1.4; }
  .notif-text span { overflow: hidden; color: var(--rei-muted); font-size: 10px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .notif-text time { color: var(--rei-soft); font-size: 9px; }

  /* ---------- Otomatisasi ---------- */
  .automation-list { display: flex; flex-direction: column; padding: 0 20px 6px; }
  .automation-rule { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 13px 0; border-top: 1px solid var(--rei-border); cursor: pointer; }
  .automation-rule > span:first-child { display: flex; flex-direction: column; gap: 3px; }
  .automation-rule strong { color: var(--rei-text); font-size: 11px; }
  .automation-rule small { color: var(--rei-muted); font-size: 10px; line-height: 1.5; }
  .automation-hours { display: flex; flex-shrink: 0; align-items: center; gap: 8px; color: var(--rei-muted); font-size: 10px; }
  .automation-hours input { width: 64px; height: 32px; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 7px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 11px; }
  .switch { position: relative; flex-shrink: 0; width: 38px; height: 22px; margin: 0; border-radius: 999px; background: var(--rei-border-strong); cursor: pointer; transition: background-color .2s ease; appearance: none; -webkit-appearance: none; }
  .switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.25); transition: transform .2s ease; }
  .switch:checked { background: var(--rei-accent); }
  .switch:checked::after { transform: translateX(16px); }
  .switch:disabled { opacity: .55; cursor: not-allowed; }
  .switch:focus-visible { outline: 2px solid var(--rei-accent); outline-offset: 2px; }
  .automation-note { margin: 0; padding: 12px 0 4px; border-top: 1px solid var(--rei-border); color: var(--rei-muted); font-size: 10px; line-height: 1.6; }
  .automation-messages { padding: 0 20px 14px; }
  .recurring-pill { background: var(--rei-info-soft); color: var(--rei-info-text); }

  /* ---------- Grafik (palet tervalidasi: terang & gelap) ---------- */
  :root { --chart-1: #2a78d6; --chart-2: #eb6834; }
  :root[data-theme="dark"], :root[data-theme="glass"] { --chart-1: #3987e5; --chart-2: #d95926; }
  .trend-chart { display: flex; flex-direction: column; gap: 10px; }
  .trend-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .trend-legend { display: flex; gap: 14px; margin: 0; padding: 0; list-style: none; color: var(--rei-muted); font-size: 10px; font-weight: 700; }
  .trend-legend li { display: inline-flex; align-items: center; gap: 6px; }
  .trend-swatch { width: 10px; height: 10px; border-radius: 3px; }
  .trend-plot { position: relative; }
  .trend-plot svg { display: block; width: 100%; height: auto; overflow: visible; }
  .trend-grid { stroke: var(--rei-border); stroke-width: 1; }
  .trend-baseline { stroke: var(--rei-border-strong); stroke-width: 1; }
  .trend-axis { fill: var(--rei-muted); font-size: 9px; }
  .trend-bar { transition: opacity .15s ease; }
  .trend-bar.dim { opacity: .35; }
  .trend-plot rect[tabindex]:focus-visible { outline: none; stroke: var(--rei-accent); stroke-width: 1.5; }
  .trend-tooltip { position: absolute; top: 0; z-index: 3; display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; border: 1px solid var(--rei-border); border-radius: 9px; background: var(--rei-surface); box-shadow: var(--rei-shadow); color: var(--rei-text); font-size: 10px; white-space: nowrap; pointer-events: none; transform: translateX(-50%); }
  .trend-tooltip span { display: flex; align-items: center; gap: 6px; color: var(--rei-muted); }
  .trend-tooltip span.current { color: var(--rei-text); font-weight: 700; }
  .trend-tooltip i { width: 8px; height: 8px; border-radius: 2px; }
  .trend-tooltip b { margin-left: auto; padding-left: 10px; color: var(--rei-text); }

  /* ---------- Kesehatan proyek & laporan waktu ---------- */
  .health-list { display: flex; flex-direction: column; gap: 4px; }
  .health-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--rei-border-soft); }
  .health-row strong { overflow: hidden; color: var(--rei-text); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .health-row small { color: var(--rei-muted); font-size: 10px; }
  .health-pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
  .health-on-track, .health-done { background: var(--rei-success-soft); color: var(--rei-success-text); }
  .health-at-risk { background: var(--rei-warning-soft); color: var(--rei-warning-text); }
  .health-off-track { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .over-estimate { color: var(--rei-danger-text); font-weight: 700; }
  .under-estimate { color: var(--rei-success-text); }

  /* ---------- Waktu kerja ---------- */
  .time-progress { margin: 12px 0 4px; }
  .time-progress small { display: block; margin-top: 5px; color: var(--rei-muted); font-size: 10px; }
  .time-progress.over small { color: var(--rei-danger-text); font-weight: 700; }
  .time-progress.over .progress-fill { background: var(--rei-danger-text); }
  .time-actions { margin: 12px 0; }
  .timer-running { animation: pulse-soft 2s ease-in-out infinite; }
  @keyframes pulse-soft { 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--rei-accent) 18%, transparent); } }
  .time-form { display: grid; grid-template-columns: 70px 70px 135px 1fr auto; gap: 6px; padding: 10px; border: 1px solid var(--rei-border); border-radius: 10px; background: var(--rei-surface-2); }
  .time-form input { min-width: 0; height: 32px; padding: 0 8px; border: 1px solid var(--rei-border-strong); border-radius: 7px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 10px; }
  .time-form .secondary-button { min-height: 32px; font-size: 10px; }
  .time-list { display: flex; flex-direction: column; margin: 10px 0 0; padding: 0; list-style: none; }
  .time-list li { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--rei-border-soft); color: var(--rei-text); font-size: 10px; }
  .time-list li > span { flex: 1; min-width: 0; }
  .time-list time { color: var(--rei-soft); font-size: 9px; white-space: nowrap; }
  .running-timer { display: inline-flex; align-items: center; gap: 7px; max-width: 240px; padding: 6px 10px; border: 1px solid color-mix(in srgb, var(--rei-accent) 40%, var(--rei-border)); border-radius: 999px; background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); font-size: 10px; }
  .running-timer svg { animation: pulse-soft 2s ease-in-out infinite; border-radius: 50%; }
  .running-timer-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .running-timer strong { font-variant-numeric: tabular-nums; }

  /* ---------- Templat ---------- */
  .template-modal { width: min(640px, 100%); }
  .template-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
  .template-option { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--rei-border); border-radius: 10px; cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
  .template-option.active { border-color: var(--rei-accent); background: var(--rei-accent-soft-bg); }
  .template-option input { accent-color: var(--rei-accent); }
  .template-option > span { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
  .template-option strong { color: var(--rei-text); font-size: 11px; }
  .template-option small { color: var(--rei-muted); font-size: 9px; }
  .template-option .icon-action { margin: 0; }
  .template-preview { max-height: 220px; overflow-y: auto; margin: 12px 0; padding: 10px 10px 10px 30px; border-radius: 10px; background: var(--rei-surface-2); }
  .template-preview li { padding: 4px 0; color: var(--rei-text); font-size: 11px; }
  .template-preview li span svg { color: var(--rei-gold); font-size: 9px; }
  .template-preview small { display: block; color: var(--rei-muted); font-size: 9px; }
  .template-fields { grid-template-columns: 1fr 1fr; }

  /* ---------- Beban kerja ---------- */
  .team-pills { display: inline-flex; gap: 6px; }
  .overload-pill { background: var(--rei-danger-soft); color: var(--rei-danger-text); }
  .workload { display: flex; flex-direction: column; gap: 4px; min-width: 190px; }
  .workload-bar { height: 6px; overflow: hidden; border-radius: 999px; background: var(--rei-chart-track); }
  .workload-bar span { display: block; height: 100%; border-radius: 999px; background: var(--rei-accent); transition: width .4s ease; }
  .workload-high .workload-bar span { background: var(--rei-warning-text); }
  .workload-over .workload-bar span { background: var(--rei-danger-text); }
  .workload small { color: var(--rei-muted); font-size: 9px; }
  .capacity-input { width: 38px; height: 20px; padding: 0 3px; border: 1px solid var(--rei-border-strong); border-radius: 5px; background: var(--rei-input-bg); color: var(--rei-text); font-size: 9px; }
  .overload-badge { align-self: flex-start; padding: 1px 7px; border-radius: 999px; background: var(--rei-danger-soft); color: var(--rei-danger-text); font-size: 9px; font-weight: 800; }

  /* ---------- Formulir, webhook, integrasi ---------- */
  .inline-check { display: inline-flex; align-items: center; gap: 6px; color: var(--rei-muted); font-size: 10px; font-weight: 700; white-space: nowrap; }
  .inline-check input { accent-color: var(--rei-accent); }
  .webhook-form { align-items: flex-start; }
  .event-chips { display: flex; flex: 1 1 100%; flex-wrap: wrap; gap: 6px; }
  .event-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border: 1px solid var(--rei-border); border-radius: 999px; color: var(--rei-muted); font-size: 10px; cursor: pointer; }
  .event-chip.active { border-color: var(--rei-accent); background: var(--rei-accent-soft-bg); color: var(--rei-accent-soft-text); }
  .event-chip input { display: none; }
  .secret-box { display: flex; flex-direction: column; gap: 6px; margin: 0 20px 14px; padding: 12px; border: 1px dashed var(--rei-warning-text); border-radius: 10px; background: var(--rei-warning-soft); color: var(--rei-text); font-size: 10px; }
  .task-modal .secret-box { margin: 12px 0; }
  .secret-box code, .copy-row code { overflow-wrap: anywhere; padding: 6px 8px; border-radius: 6px; background: var(--rei-surface); font-size: 10px; }
  .secret-box button { align-self: flex-start; }
  .copy-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; }
  .copy-row code { flex: 1 1 260px; min-width: 0; }
  .copy-row .icon-action { margin: 0; }
  .task-tags-heading h3 svg { margin-right: 4px; color: var(--rei-accent); }
  .task-tags-heading code { padding: 1px 4px; border-radius: 4px; background: var(--rei-surface-3); font-size: 9px; }
  .truncate { display: block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .delivery-ok { color: var(--rei-success-text); font-size: 10px; }
  .delivery-fail { color: var(--rei-danger-text); font-size: 10px; }
  .danger-text { color: var(--rei-danger-text); }

  @media (max-width: 1150px) {
    .guide-grid { grid-template-columns: 1fr; }
    .guide-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .filter-bar { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .filter-bar-actions { grid-column: 1 / -1; }
    .settings-grid { grid-template-columns: 1fr; }
    .activity-feed { grid-template-columns: 1fr; }
  }
  @media (max-width: 800px) {
    .guide-panel .panel-heading { align-items: stretch; flex-direction: column; }
    .guide-download { width: 100%; justify-content: center; }
    .filter-bar { grid-template-columns: 1fr 1fr; padding: 12px; }
    .calendar, .timeline { padding: 0 12px 12px; }
    .calendar-cell { min-height: 72px; padding: 4px; }
    .calendar-task span { display: none; }
    .wip-form { grid-template-columns: 1fr 1fr; }
    .task-edit-form { grid-template-columns: 1fr; }
    .time-form { grid-template-columns: 1fr 1fr; }
    .template-options, .template-fields { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .guide-steps { grid-template-columns: 1fr; }
  }
`;
