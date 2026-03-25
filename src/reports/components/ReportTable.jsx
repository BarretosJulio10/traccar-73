/**
 * Shared themed table with client-side pagination, PDF and XML export.
 * Used by all report pages.
 */
import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useHudTheme } from '../../common/util/ThemeContext';

const PAGE_SIZES = [25, 50, 100];

/**
 * @param {object}   props
 * @param {string[]} props.columns       Column headers
 * @param {any[][]}  props.rows          Data rows — each cell can be string or JSX
 * @param {string[][]} props.exportRows  Plain-text rows used for PDF/XML export
 * @param {boolean}  [props.loading]
 * @param {string}   [props.emptyText]
 * @param {Function} [props.onExportPdf]   Called when user clicks PDF button
 * @param {Function} [props.onExportHtml]  Called when user clicks HTML button
 * @param {Function} [props.onExportXml]   Called when user clicks XML button
 * @param {boolean}  [props.exporting]    Shows spinner on export buttons
 */
const ReportTable = ({
  columns,
  rows = [],
  loading = false,
  emptyText = 'Nenhum dado encontrado.',
  onExportPdf,
  onExportHtml,
  onExportXml,
  exporting = false,
}) => {
  const { theme } = useHudTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  const handlePageSize = (size) => {
    setPageSize(size);
    setPage(0);
  };

  const cellStyle = {
    padding: '8px 12px',
    fontSize: '11px',
    borderBottom: `1px solid ${theme.borderCard}`,
    color: theme.textSecondary,
    whiteSpace: 'nowrap',
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const headCellStyle = {
    ...cellStyle,
    fontWeight: 800,
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: theme.textMuted,
    background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    borderBottom: `2px solid ${theme.border}`,
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className="rounded-3xl overflow-hidden border shadow-sm transition-colors"
      style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: theme.borderCard }}
      >
        <span className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: theme.textMuted }}>
          {loading ? 'Carregando...' : `${rows.length} registro${rows.length !== 1 ? 's' : ''}`}
        </span>

        <div className="flex items-center gap-2">
          {/* Page size selector */}
          {rows.length > 0 && (
            <div className="flex items-center gap-1">
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePageSize(s)}
                  className="px-1.5 py-0.5 rounded-lg text-[6px] font-black uppercase transition-colors"
                  style={{
                    background: pageSize === s ? theme.accent : 'transparent',
                    color: pageSize === s ? '#fff' : theme.textMuted,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Export buttons */}
          {[
            onExportPdf  && { fn: onExportPdf,  Icon: PictureAsPdfIcon, title: 'PDF',  color: '#ef4444' },
            onExportHtml && { fn: onExportHtml, Icon: CodeIcon,          title: 'HTML', color: '#f59e0b' },
            onExportXml  && { fn: onExportXml,  Icon: DataObjectIcon,    title: 'XML',  color: theme.accent },
          ].filter(Boolean).map(({ fn, Icon, title, color }) => (
            <button
              key={title}
              onClick={fn}
              disabled={exporting || rows.length === 0}
              title={`Exportar ${title}`}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all active:scale-95 disabled:opacity-40"
              style={{ borderColor: `${color}50`, color, background: `${color}12` }}
            >
              {exporting ? <CircularProgress size={9} color="inherit" /> : <Icon sx={{ fontSize: 13 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <CircularProgress size={28} sx={{ color: theme.accent }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
              Buscando dados...
            </span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-[11px] font-bold" style={{ color: theme.textMuted }}>{emptyText}</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={headCellStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    background: ri % 2 === 0
                      ? (theme.isDark ? 'transparent' : 'rgba(0,0,0,0.01)')
                      : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)'),
                  }}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} style={cellStyle}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {rows.length > 0 && !loading && (
        <div
          className="flex items-center justify-between px-5 py-3 border-t"
          style={{ borderColor: theme.borderCard }}
        >
          <span className="text-[9px] font-bold" style={{ color: theme.textMuted }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} de {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 rounded-lg text-[9px] font-black transition-colors disabled:opacity-30"
              style={{ color: theme.textMuted }}
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: theme.textMuted }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </button>
            <span
              className="px-3 py-1 rounded-lg text-[9px] font-black"
              style={{ background: theme.accent, color: '#fff' }}
            >
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: theme.textMuted }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded-lg text-[9px] font-black transition-colors disabled:opacity-30"
              style={{ color: theme.textMuted }}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
