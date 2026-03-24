/**
 * PDF and XML export utilities for all report pages.
 * PDF uses jsPDF + jspdf-autotable.
 * XML is generated as a UTF-8 encoded Blob.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const BRAND_COLOR = [6, 182, 212]; // Cyan 500 — matches accent in light theme
const DARK_BG    = [15, 23, 42];   // Slate 900

/**
 * Safely load an image URL as a base64 dataURL for jsPDF.
 * Returns null if loading fails (logo is optional).
 */
const loadImageAsDataUrl = (url) =>
  new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

/**
 * Export data to a PDF file with branded header, table, and page numbers.
 *
 * @param {object} opts
 * @param {string} opts.title        - Report title e.g. "Relatório de Eventos"
 * @param {string} opts.subtitle     - Filter summary e.g. "Demo Caminhão 03 | 23/03/2026 – 24/03/2026"
 * @param {string[]} opts.columns    - Column headers
 * @param {string[][]} opts.rows     - Data rows (stringified)
 * @param {string} [opts.logoUrl]    - Tenant logo URL (optional)
 * @param {string} [opts.tenantName] - Tenant name shown in header
 */
export const exportToPdf = async ({
  title,
  subtitle = '',
  columns,
  rows,
  logoUrl,
  tenantName = 'HyperTraccar',
  // Extra detail fields
  deviceName = '',
  deviceImei = '',
  dateFrom = '',
  dateTo = '',
  stats = null,
}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const generatedAt = dayjs().format('DD/MM/YYYY HH:mm');

  // --- Load logo ---
  const logoData = await loadImageAsDataUrl(logoUrl);

  // Header heights
  const H_TOP  = 18; // dark top bar
  const H_INFO =  9; // cyan info bar (device + period)
  const H_HEAD = H_TOP + H_INFO; // 27mm total per-page header

  const drawHeader = (data) => {
    const pageNum = data?.pageNumber ?? 1;

    // ── Dark top bar ──────────────────────────────────────────────────
    doc.setFillColor(...DARK_BG);
    doc.rect(0, 0, pageW, H_TOP, 'F');

    if (logoData) {
      try { doc.addImage(logoData, 'PNG', 5, 2, 28, 14, undefined, 'FAST'); } catch { /* skip */ }
    }

    const textX = logoData ? 38 : 8;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(tenantName.toUpperCase(), textX, 8);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(6, 182, 212); // accent
    doc.text('SISTEMA DE RASTREAMENTO VEICULAR', textX, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageW / 2, 11, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 240);
    doc.text(`Gerado em: ${generatedAt}`, pageW - 8, 7, { align: 'right' });
    doc.text(`Página ${pageNum}`, pageW - 8, 13, { align: 'right' });

    // ── Cyan info bar ─────────────────────────────────────────────────
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, H_TOP, pageW, H_INFO, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    const infoY = H_TOP + 6;
    const col = pageW / 4;
    const labelColor = [0, 80, 100];
    const valueColor = [255, 255, 255];

    // Veículo
    doc.setTextColor(...labelColor);
    doc.setFont('helvetica', 'normal');
    doc.text('VEÍCULO:', 8, infoY);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(deviceName || '--', 8 + doc.getTextWidth('VEÍCULO: '), infoY);

    // IMEI
    doc.setTextColor(...labelColor);
    doc.setFont('helvetica', 'normal');
    doc.text('IMEI:', col, infoY);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(deviceImei || '--', col + doc.getTextWidth('IMEI: '), infoY);

    // Período De
    doc.setTextColor(...labelColor);
    doc.setFont('helvetica', 'normal');
    doc.text('DE:', col * 2, infoY);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(dateFrom || '--', col * 2 + doc.getTextWidth('DE: '), infoY);

    // Período Até
    doc.setTextColor(...labelColor);
    doc.setFont('helvetica', 'normal');
    doc.text('ATÉ:', col * 3, infoY);
    doc.setTextColor(...valueColor);
    doc.setFont('helvetica', 'bold');
    doc.text(dateTo || '--', col * 3 + doc.getTextWidth('ATÉ: '), infoY);
  };

  // ── Draw stats cards below header on page 1 only ──────────────────────────
  const drawStats = () => {
    if (!stats) return;
    const CARDS = [
      { label: 'HODÔMETRO',        value: stats.odometer      ?? '--' },
      { label: 'TEMPO PARADO',     value: stats.stoppedTime   ?? '--' },
      { label: 'TEMPO PERCURSO',   value: stats.travelTime    ?? '--' },
      { label: 'PARADO C/ IGNIÇÃO',value: stats.stoppedIgnOn  ?? '--' },
      { label: 'VEL. MÉDIA',       value: stats.avgSpeed      ?? '--' },
      { label: 'TOTAL POSIÇÕES',   value: String(stats.totalPositions ?? '--') },
    ];
    const cardW = (pageW - 16) / CARDS.length;
    const cardH = 14;
    const y0 = H_HEAD + 3;

    CARDS.forEach((card, i) => {
      const x = 8 + i * cardW;
      // Card background
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(x, y0, cardW - 2, cardH, 2, 2, 'F');
      doc.setDrawColor(...BRAND_COLOR);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y0, cardW - 2, cardH, 2, 2, 'S');
      // Top accent line
      doc.setDrawColor(...BRAND_COLOR);
      doc.setLineWidth(1.2);
      doc.line(x + 2, y0, x + cardW - 4, y0);

      // Value
      doc.setTextColor(...DARK_BG);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + (cardW - 2) / 2, y0 + 7, { align: 'center' });

      // Label
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 100, 120);
      doc.text(card.label, x + (cardW - 2) / 2, y0 + 11.5, { align: 'center' });
    });
  };

  // ── Render page 1 header + stats ─────────────────────────────────────────
  drawHeader({ pageNumber: 1 });
  drawStats();

  const statsH  = stats ? 20 : 0; // height reserved for stats section on page 1
  const startY  = H_HEAD + statsH + 3;

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY,
    margin: { left: 8, right: 8, top: H_HEAD + 3 },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(data);
    },
  });

  const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
  doc.save(filename);
};

/**
 * Export data to an XML file.
 */
export const exportToXml = ({ title, columns, rows, subtitle = '' }) => {
  const tag = (name, value) => `<${name}>${String(value ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))}</${name}>`;
  const colKeys = columns.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, '_'));

  const itemsXml = rows
    .map(
      (row) =>
        `    <item>\n${row
          .map((val, i) => `      ${tag(colKeys[i] || `col_${i}`, val)}`)
          .join('\n')}\n    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<report>\n  <title>${title}</title>\n  <subtitle>${subtitle}</subtitle>\n  <generated>${dayjs().toISOString()}</generated>\n  <total>${rows.length}</total>\n  <items>\n${itemsXml}\n  </items>\n</report>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}.xml`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Export data to a self-contained HTML dashboard with stats, sortable table, search and print.
 *
 * @param {object} opts
 * @param {string}   opts.title
 * @param {string}   [opts.subtitle]
 * @param {string[]} opts.columns
 * @param {string[][]} opts.rows
 * @param {object}   [opts.stats]       - { odometer, stoppedTime, travelTime, stoppedIgnOn, avgSpeed, totalPositions }
 * @param {string}   [opts.logoUrl]     - Tenant logo URL (will be inlined as base64)
 * @param {string}   [opts.tenantName]
 */
export const exportToHtml = async ({ title, subtitle = '', columns, rows, stats = null, logoUrl = null, tenantName = 'HyperTraccar' }) => {
  const esc = (v) => String(v ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' }[c]));
  const generatedAt = dayjs().format('DD/MM/YYYY HH:mm');

  // Inline logo as base64 for offline use
  let logoHtml = '';
  if (logoUrl) {
    const logoData = await loadImageAsDataUrl(logoUrl);
    if (logoData) logoHtml = `<img src="${logoData}" alt="logo" style="height:36px;object-fit:contain;margin-right:14px;">`;
  }

  // Stat cards HTML
  const STAT_ICONS = {
    odometer:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
    stoppedTime:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2zm0 8h2v2h-2z"/></svg>`,
    travelTime:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>`,
    stoppedIgnOn:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`,
    avgSpeed:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 001.72 1h13.85a2 2 0 001.74-1 10 10 0 00-.27-10.44zm-9.79 6.84a2 2 0 002.83 0l5.66-8.49-8.49 5.66a2 2 0 000 2.83z"/></svg>`,
    totalPositions:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  };
  const STAT_LABELS = {
    odometer: 'Hodômetro', stoppedTime: 'Tempo Parado', travelTime: 'Tempo de Percurso',
    stoppedIgnOn: 'Parado c/ Ignição', avgSpeed: 'Vel. Média', totalPositions: 'Total de Posições',
  };
  const STAT_COLORS = {
    odometer: '#06b6d4', stoppedTime: '#f59e0b', travelTime: '#22c55e',
    stoppedIgnOn: '#ef4444', avgSpeed: '#a78bfa', totalPositions: '#38bdf8',
  };

  const statsHtml = stats ? `
  <section class="stats-section">
    <div class="stats-label">RESUMO DO PERCURSO</div>
    <div class="stats-grid">
      ${Object.entries(STAT_LABELS).map(([key, label]) => `
      <div class="stat-card" style="--c:${STAT_COLORS[key]}">
        <div class="stat-icon">${STAT_ICONS[key]}</div>
        <div class="stat-value">${esc(stats[key] ?? '--')}</div>
        <div class="stat-label">${label}</div>
      </div>`).join('')}
    </div>
  </section>` : '';

  // Table rows with data-* for sorting + speed/ignition color coding
  const COL_VEL = columns.findIndex((c) => c.toLowerCase().includes('vel'));
  const COL_IGN = columns.findIndex((c) => c.toLowerCase().includes('igni'));

  const tbodyRows = rows.map((row, i) => {
    const cells = row.map((v, ci) => {
      let cls = '';
      let display = esc(v);
      if (ci === COL_VEL) {
        const n = parseFloat(v);
        cls = n > 100 ? 'speed-high' : n > 60 ? 'speed-mid' : n > 0 ? 'speed-ok' : 'speed-zero';
        display = `<span class="speed-badge ${cls}">${esc(v)}</span>`;
      } else if (ci === COL_IGN) {
        const on = v.toLowerCase().includes('lig');
        display = `<span class="ign-badge ${on ? 'ign-on' : 'ign-off'}">${on ? '● Ligada' : '○ Desligada'}</span>`;
      }
      return `<td data-v="${esc(v)}">${display}</td>`;
    }).join('');
    return `<tr class="${i % 2 === 0 ? 'row-even' : ''}">${cells}</tr>`;
  }).join('\n');

  const theadCells = columns.map((h, i) => `<th onclick="sortTable(${i})" title="Ordenar por ${esc(h)}">${esc(h)}<span class="sort-icon" id="si-${i}">⇅</span></th>`).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)} — ${esc(subtitle)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0f1a;--bg2:#131929;--bg3:#1e2a3a;--bg4:#253347;
  --accent:#06b6d4;--border:rgba(255,255,255,0.07);
  --text:#e2e8f0;--text2:#94a3b8;--text3:#64748b;
  --green:#22c55e;--yellow:#f59e0b;--red:#ef4444;--purple:#a78bfa;
  --radius:14px;--radius-sm:8px;
}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding:0}

/* ─── HEADER ─── */
.header{background:linear-gradient(135deg,#0b1628 0%,#0f2040 100%);border-bottom:1px solid var(--border);padding:18px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.header-left{display:flex;align-items:center;gap:0}
.header-brand{display:flex;flex-direction:column;gap:2px}
.header-tenant{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);opacity:.8}
.header-title{font-size:20px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#fff;line-height:1}
.header-sub{margin-top:6px;display:inline-block;background:var(--accent);color:#fff;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:3px 10px;border-radius:20px}
.header-right{text-align:right;flex-shrink:0}
.header-date{font-size:11px;color:var(--text2)}
.header-date strong{color:var(--text);display:block;font-size:13px;margin-top:2px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);border:none;cursor:pointer;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:all .15s;white-space:nowrap}
.btn-print{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
.btn-print:hover{background:var(--bg4);color:var(--text)}

/* ─── STATS ─── */
.stats-section{padding:20px 28px 0}
.stats-label{font-size:9px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--text3);margin-bottom:10px}
.stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;overflow:hidden;transition:transform .2s}
.stat-card:hover{transform:translateY(-2px)}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c)}
.stat-icon{width:28px;height:28px;color:var(--c);opacity:.85}
.stat-icon svg{width:100%;height:100%}
.stat-value{font-size:18px;font-weight:900;color:#fff;line-height:1;text-align:center}
.stat-label{font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--text3);text-align:center;line-height:1.3}

/* ─── CONTROLS ─── */
.controls{padding:16px 28px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--border)}
.search-wrap{position:relative;flex:1;max-width:340px}
.search-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--text3)}
.search-input{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);padding:8px 10px 8px 32px;font-size:12px;outline:none;transition:border-color .2s}
.search-input:focus{border-color:var(--accent)}
.search-input::placeholder{color:var(--text3)}
.record-count{font-size:11px;color:var(--text3)}
.record-count strong{color:var(--text2)}

/* ─── TABLE ─── */
.table-wrap{padding:0 28px 28px;overflow-x:auto}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:11px}
thead th{background:var(--bg3);color:var(--text2);padding:9px 10px;text-align:left;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid var(--border);cursor:pointer;user-select:none;position:sticky;top:0;z-index:2;transition:background .15s}
thead th:hover{background:var(--bg4);color:var(--text)}
.sort-icon{margin-left:4px;opacity:.4;font-size:10px}
tbody tr{border-bottom:1px solid var(--border);transition:background .12s}
tbody tr:hover td{background:rgba(6,182,212,.06)!important}
tbody tr.row-even td{background:rgba(255,255,255,.015)}
td{padding:8px 10px;color:var(--text2);vertical-align:middle}
td:first-child{color:var(--text3);font-weight:700;font-size:10px;font-variant-numeric:tabular-nums;min-width:32px}
td:nth-child(2){color:var(--text);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
td:nth-child(4){font-family:monospace;font-size:10px}

/* Speed badges */
.speed-badge{display:inline-block;padding:2px 7px;border-radius:20px;font-weight:800;font-size:10px;font-variant-numeric:tabular-nums}
.speed-zero{color:var(--text3)}
.speed-ok{background:rgba(34,197,94,.15);color:var(--green)}
.speed-mid{background:rgba(245,158,11,.15);color:var(--yellow)}
.speed-high{background:rgba(239,68,68,.15);color:var(--red)}

/* Ignition badges */
.ign-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;letter-spacing:.04em}
.ign-on{color:var(--green)}
.ign-off{color:var(--text3)}

/* ─── FOOTER ─── */
footer{padding:16px 28px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.footer-brand{font-size:10px;color:var(--text3)}
.footer-brand strong{color:var(--accent)}
.footer-info{font-size:10px;color:var(--text3)}

/* ─── PRINT ─── */
@media print{
  body{background:#fff;color:#000}
  .controls .btn-print,.controls .search-wrap{display:none}
  .header{background:#0f172a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .stat-card{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  thead th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>

<!-- HEADER -->
<header class="header">
  <div class="header-left">
    ${logoHtml}
    <div class="header-brand">
      <span class="header-tenant">${esc(tenantName)}</span>
      <h1 class="header-title">${esc(title)}</h1>
      ${subtitle ? `<span class="header-sub">${esc(subtitle)}</span>` : ''}
    </div>
  </div>
  <div class="header-right">
    <div class="header-date">Gerado em<strong>${generatedAt}</strong></div>
    <button class="btn btn-print" onclick="window.print()" style="margin-top:8px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
      Imprimir
    </button>
  </div>
</header>

${statsHtml}

<!-- CONTROLS -->
<div class="controls">
  <div class="search-wrap">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    <input class="search-input" type="text" id="searchInput" placeholder="Buscar em todos os campos…" oninput="filterTable()"/>
  </div>
  <span class="record-count">Exibindo <strong id="visibleCount">${rows.length}</strong> de <strong>${rows.length}</strong> registros</span>
</div>

<!-- TABLE -->
<div class="table-wrap">
  <table id="mainTable">
    <thead><tr>${theadCells}</tr></thead>
    <tbody id="mainTbody">${tbodyRows}</tbody>
  </table>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-brand"><strong>${esc(tenantName)}</strong> &nbsp;·&nbsp; Relatório gerado automaticamente</div>
  <div class="footer-info">${rows.length} registros &nbsp;·&nbsp; ${generatedAt}</div>
</footer>

<script>
// ── Sort ──────────────────────────────────────────────────────────────────────
let sortCol = -1, sortAsc = true;
function sortTable(col) {
  const tbody = document.getElementById('mainTbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
  document.querySelectorAll('.sort-icon').forEach((el,i) => {
    el.textContent = i === col ? (sortAsc ? '↑' : '↓') : '⇅';
    el.style.opacity = i === col ? '1' : '.4';
  });
  rows.sort((a, b) => {
    const av = a.querySelectorAll('td')[col]?.dataset.v ?? '';
    const bv = b.querySelectorAll('td')[col]?.dataset.v ?? '';
    const an = parseFloat(av.replace(/[^0-9.-]/g,'')); const bn = parseFloat(bv.replace(/[^0-9.-]/g,''));
    const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv, 'pt-BR');
    return sortAsc ? cmp : -cmp;
  });
  rows.forEach(r => tbody.appendChild(r));
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#mainTbody tr');
  let visible = 0;
  rows.forEach(r => {
    const match = !q || r.textContent.toLowerCase().includes(q);
    r.style.display = match ? '' : 'none';
    if (match) visible++;
  });
  document.getElementById('visibleCount').textContent = visible;
}
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
