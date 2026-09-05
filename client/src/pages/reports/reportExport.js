const escapeCsv = (value) => {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const escapeHtml = (value) => {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const formatReportDate = (value) => {
  if (!value) return 'All dates';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const buildFilename = (section, extension) => {
  const stamp = new Date().toISOString().slice(0, 10);
  return `TUC_HelpDesk_${section}_Report_${stamp}.${extension}`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const filterTicketsByDateRange = (tickets, startDate, endDate) => {
  const list = Array.isArray(tickets) ? tickets : [];
  if (!startDate && !endDate) return list;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  return list.filter((ticket) => {
    const created = new Date(ticket.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    if (start && created < start) return false;
    if (end && created > end) return false;
    return true;
  });
};

export const buildTicketExportData = ({
  ticketData,
  monthlyTrendRows,
  resolutionTimes,
  startDate,
  endDate,
  generatedAt = new Date(),
}) => {
  const summary = ticketData?.summary || {};
  const toRows = (arr) =>
    (Array.isArray(arr) ? arr : []).map((item) => ({
      label: item?._id || item?.label || 'Unknown',
      count: Number(item?.count ?? 0),
    }));

  return {
    title: 'TUC Help Desk — Ticket Report',
    section: 'Tickets',
    generatedAt,
    dateRange: {
      start: startDate || null,
      end: endDate || null,
      label:
        startDate || endDate
          ? `${formatReportDate(startDate)} to ${formatReportDate(endDate)}`
          : 'All dates',
    },
    summary: {
      total: Number(summary.total || 0),
      open: Number(summary.open || 0),
      resolved: Number(summary.resolved || 0),
      closed: Number(summary.closed || 0),
      inProgress: toRows(ticketData?.byStatus).find((row) => row.label === 'In Progress')?.count || 0,
    },
    byStatus: toRows(ticketData?.byStatus),
    byPriority: toRows(ticketData?.byPriority),
    byCategory: toRows(ticketData?.byCategory),
    byDepartment: toRows(ticketData?.byDepartment),
    monthlyTrend: (monthlyTrendRows || []).map((row) => ({
      label: row.label,
      count: Number(row.count || 0),
    })),
    resolutionTimes: {
      average: resolutionTimes?.avg ?? 0,
      minimum: resolutionTimes?.min ?? 0,
      maximum: resolutionTimes?.max ?? 0,
    },
  };
};

const rowsToCsvSection = (title, rows, headers = ['Category', 'Count']) => {
  const lines = [`\n${title}`, headers.join(',')];
  if (!rows.length) {
    lines.push('No data,0');
    return lines;
  }
  rows.forEach((row) => {
    lines.push([escapeCsv(row.label), escapeCsv(row.count)].join(','));
  });
  return lines;
};

export const buildTicketReportCsvContent = (report) => {
  const lines = [
    report.title,
    `Generated,${escapeCsv(new Date(report.generatedAt).toLocaleString())}`,
    `Date Range,${escapeCsv(report.dateRange.label)}`,
    '',
    'Summary Metric,Count',
    `Total Tickets,${report.summary.total}`,
    `Open,${report.summary.open}`,
    `In Progress,${report.summary.inProgress}`,
    `Resolved,${report.summary.resolved}`,
    `Closed,${report.summary.closed}`,
    ...rowsToCsvSection('Tickets by Status', report.byStatus),
    ...rowsToCsvSection('Tickets by Priority', report.byPriority),
    ...rowsToCsvSection('Tickets by Category', report.byCategory),
    ...rowsToCsvSection('Tickets by Department', report.byDepartment),
    '\nMonthly Trend',
    'Period,Count',
    ...(report.monthlyTrend.length
      ? report.monthlyTrend.map((row) => `${escapeCsv(row.label)},${row.count}`)
      : ['No data,0']),
    '\nResolution Time (hours)',
    'Metric,Hours',
    `Average,${Number(report.resolutionTimes.average || 0).toFixed(2)}`,
    `Minimum,${Number(report.resolutionTimes.minimum || 0).toFixed(2)}`,
    `Maximum,${Number(report.resolutionTimes.maximum || 0).toFixed(2)}`,
  ];
  return `\uFEFF${lines.join('\n')}`;
};

export const exportTicketReportCsv = (report) => {
  const csv = buildTicketReportCsvContent(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, buildFilename(report.section, 'csv'));
  return buildFilename(report.section, 'csv');
};

const renderTableRows = (rows) => {
  if (!rows.length) {
    return '<tr><td colspan="2">No data available</td></tr>';
  }
  return rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right">${row.count}</td></tr>`
    )
    .join('');
};

export const buildTicketReportHtml = (report) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #4b5563; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .card strong { display: block; font-size: 20px; }
    .card span { color: #6b7280; font-size: 12px; }
    h2 { font-size: 16px; margin: 24px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 13px; }
    th { background: #f9fafb; text-align: left; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <div class="meta">
    Generated: ${escapeHtml(new Date(report.generatedAt).toLocaleString())}<br />
    Date range: ${escapeHtml(report.dateRange.label)}
  </div>
  <div class="grid">
    <div class="card"><strong>${report.summary.total}</strong><span>Total Tickets</span></div>
    <div class="card"><strong>${report.summary.open}</strong><span>Open</span></div>
    <div class="card"><strong>${report.summary.inProgress}</strong><span>In Progress</span></div>
    <div class="card"><strong>${report.summary.resolved}</strong><span>Resolved</span></div>
    <div class="card"><strong>${report.summary.closed}</strong><span>Closed</span></div>
  </div>
  <h2>Tickets by Status</h2>
  <table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${renderTableRows(report.byStatus)}</tbody></table>
  <h2>Tickets by Priority</h2>
  <table><thead><tr><th>Priority</th><th>Count</th></tr></thead><tbody>${renderTableRows(report.byPriority)}</tbody></table>
  <h2>Tickets by Category</h2>
  <table><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>${renderTableRows(report.byCategory)}</tbody></table>
  <h2>Tickets by Department</h2>
  <table><thead><tr><th>Department</th><th>Count</th></tr></thead><tbody>${renderTableRows(report.byDepartment)}</tbody></table>
  <h2>Monthly Trend</h2>
  <table><thead><tr><th>Period</th><th>Count</th></tr></thead><tbody>${
    report.monthlyTrend.length
      ? report.monthlyTrend
          .map(
            (row) =>
              `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right">${row.count}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="2">No data available</td></tr>'
  }</tbody></table>
  <h2>Resolution Time</h2>
  <table>
    <thead><tr><th>Metric</th><th>Hours</th></tr></thead>
    <tbody>
      <tr><td>Average</td><td style="text-align:right">${Number(report.resolutionTimes.average || 0).toFixed(2)}</td></tr>
      <tr><td>Minimum</td><td style="text-align:right">${Number(report.resolutionTimes.minimum || 0).toFixed(2)}</td></tr>
      <tr><td>Maximum</td><td style="text-align:right">${Number(report.resolutionTimes.maximum || 0).toFixed(2)}</td></tr>
    </tbody>
  </table>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

export const exportTicketReportPdf = (report) => {
  const html = buildTicketReportHtml(report);
  const popup = window.open('', '_blank');

  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    return { mode: 'print', filename: buildFilename(report.section, 'pdf') };
  }

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = buildFilename(report.section, 'html');
  downloadBlob(blob, filename);
  return { mode: 'download', filename };
};
