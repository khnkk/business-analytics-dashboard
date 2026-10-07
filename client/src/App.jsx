import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, CalendarDays, ChevronDown, CircleAlert, Clock3, Database,
  FileText, Menu, RotateCcw, Server, X
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || '';

const formatNumber = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0));
const formatDecimal = value => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
const formatAmount = value => formatNumber(value);

function apiUrl(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => { if (value) url.searchParams.set(key, value); });
  return url.toString();
}

function useDashboard(filters) {
  const [data, setData] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestMs, setRequestMs] = useState(null);

  const query = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const startedAt = performance.now();
    Promise.all([
      fetch(apiUrl('/api/dashboard', query)).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(new Error(e.error || 'Request failed')))),
      options ? Promise.resolve(options) : fetch(apiUrl('/api/filters')).then(r => r.ok ? r.json() : Promise.reject(new Error('Unable to load filter options')))
    ])
      .then(([dashboard, filterOptions]) => {
        if (!cancelled) {
          const dashboardPayloadBytes = new TextEncoder().encode(JSON.stringify(dashboard)).length;
          const aggregatedRows = dashboard.revenueTrend.length + dashboard.categories.length + dashboard.outlets.length + dashboard.orderTypes.length + dashboard.hourly.length + dashboard.topItems.length;
          setData({ ...dashboard, _performance: { aggregatedRows, payloadBytes: dashboardPayloadBytes } });
          setOptions(filterOptions);
          setRequestMs(Math.round(performance.now() - startedAt));
        }
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Unable to load analytics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, options]);

  return { data, options, loading, error, requestMs };
}

function Filters({ filters, options, onChange, onReset }) {
  const fields = [
    ['startDate', 'Start date', 'date'],
    ['endDate', 'End date', 'date']
  ];
  return (
    <section className="filter-section" aria-label="Dashboard filters">
      <div className="filter-heading">
        <div>
          <h2 className="eyebrow">FILTERS</h2>
        </div>
        <button className="reset" type="button" onClick={onReset}><RotateCcw size={14} /> Reset filters</button>
      </div>
      <div className="filters">
        {fields.map(([key, label, type]) => (
          <label className="filter-field" key={key}>
            <span>{label}</span>
            <input type={type} value={filters[key]} min={options?.dateRange?.minDate?.slice(0,10)} max={options?.dateRange?.maxDate?.slice(0,10)} onChange={e => onChange(key, e.target.value)} />
          </label>
        ))}
        <Select label="Outlet" value={filters.outlet} options={options?.outlets || []} onChange={v => onChange('outlet', v)} />
        <Select label="Category" value={filters.group} options={options?.groups || []} onChange={v => onChange('group', v)} />
        <Select label="Order type" value={filters.orderType} options={options?.orderTypes || []} onChange={v => onChange('orderType', v)} />
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <div className="select-wrap">
        <select value={value} onChange={e => onChange(e.target.value)}>
          <option value="All">All</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown size={14} />
      </div>
    </label>
  );
}

function Panel({ title, description, children, id }) {
  return <section className="panel" id={id}><div className="panel-head"><h2>{title}</h2><p>{description}</p></div>{children}</section>;
}

const tooltipStyle = { background: '#171717', border: '1px solid #333', color: '#fff', fontSize: 12 };

function RevenueChart({ data }) {
  const chartData = data.map(row => ({ ...row, label: row.date.slice(5) }));
  return <div className="chart"><ResponsiveContainer width="100%" height={310}><LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}><CartesianGrid stroke="#e8e6e1" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#777' }} minTickGap={22} /><YAxis tick={{ fontSize: 10, fill: '#777' }} tickFormatter={formatNumber} width={58} /><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(value), name === 'revenue' ? 'Revenue' : 'Orders']} /><Line type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>;
}

function HorizontalBars({ data, categoryKey }) {
  const chartData = data.map(row => ({ ...row, label: row[categoryKey] }));
  return <div className="chart"><ResponsiveContainer width="100%" height={310}><BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, left: 20, bottom: 4 }}><CartesianGrid stroke="#e8e6e1" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10, fill: '#777' }} tickFormatter={formatNumber} /><YAxis type="category" dataKey="label" width={82} tick={{ fontSize: 10, fill: '#555' }} /><Tooltip contentStyle={tooltipStyle} formatter={value => [formatNumber(value), 'Revenue']} /><Bar dataKey="revenue" fill="#171717" barSize={18} /></BarChart></ResponsiveContainer></div>;
}

function HourlyChart({ data }) {
  const chartData = data.map(row => ({ ...row, label: `${String(row.hour).padStart(2, '0')}:00` }));
  return <div className="chart"><ResponsiveContainer width="100%" height={310}><BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}><CartesianGrid stroke="#e8e6e1" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#777' }} interval={1} /><YAxis tick={{ fontSize: 10, fill: '#777' }} tickFormatter={formatNumber} width={58} /><Tooltip contentStyle={tooltipStyle} formatter={value => [formatNumber(value), 'Revenue']} /><Bar dataKey="revenue" fill="#5f665f" barSize={22} /></BarChart></ResponsiveContainer></div>;
}

function Kpi({ label, value, note, primary }) {
  return <article className={primary ? 'kpi kpi-primary' : 'kpi'}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function MethodNotes() {
  return <section className="method-notes" aria-label="Metric definitions">
    <div><strong>Revenue</strong><span>Price × Quantity across filtered line items</span></div>
    <div><strong>Orders</strong><span>Distinct BillNo values</span></div>
    <div><strong>AOV</strong><span>Filtered revenue ÷ orders containing matching lines</span></div>
  </section>;
}

function PaginatedItems({ rows }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [rows]);

  return <div className="table-block">
    <div className="table-wrap">
      <table>
        <thead><tr><th>Item</th><th>Group</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>{visible.map(row => <tr key={row.item}><td>{row.item}</td><td>{row.group || row.groupName || '—'}</td><td>{formatAmount(row.revenue)}</td><td>{formatNumber(row.orders)}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="table-footer">
      <span>Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} of {rows.length} returned items</span>
      <div className="pager">
        <button type="button" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
        <span>Page {safePage} of {pageCount}</span>
        <button type="button" disabled={safePage === pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>Next</button>
      </div>
    </div>
  </div>;
}

function LegalPage({ type }) {
  const isPrivacy = type === 'privacy';
  return <main className="legal"><a className="back" href="/">← Back to dashboard</a><p className="eyebrow">BUSINESS ANALYTICS DASHBOARD</p><h1>{isPrivacy ? 'Privacy Policy' : 'Terms and Conditions'}</h1><p className="legal-date">Last updated: October 2026</p>{isPrivacy ? <><h2>Overview</h2><p>This assessment dashboard is a demonstration application using the provided sales dataset. The application does not require an account and does not intentionally collect personal information from dashboard visitors.</p><h2>Data used by the dashboard</h2><p>The analytics are calculated from the assessment workbook supplied for this project. The dashboard uses aggregated sales information for reporting and does not claim that the source data represents California Burrito unless separately confirmed.</p><h2>Cookies and tracking</h2><p>No advertising or behavioral tracking is intentionally implemented in this assessment application.</p><h2>Contact</h2><p>For questions about this demonstration application, use the contact information supplied with the assessment submission.</p></> : <><h2>Use of the application</h2><p>This dashboard is provided as a demonstration and assessment application. It is intended for viewing and analyzing the supplied dataset.</p><h2>Accuracy</h2><p>Analytics are calculated from the source dataset. The application does not guarantee that the underlying dataset is complete, current, or suitable for operational, financial, or legal decisions.</p><h2>Acceptable use</h2><p>Do not attempt to disrupt the application, bypass access controls, or use the dashboard for unlawful purposes.</p><h2>Intellectual property</h2><p>Third-party brand names and source data remain subject to their respective rights. The application code is part of the technical assessment submission.</p></>}</main>;
}

function Dashboard() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', outlet: '', group: '', orderType: '' });
  const { data, options, loading, error, requestMs } = useDashboard(filters);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = Object.values(filters).filter(Boolean).length;
  const topItems = data?.topItems || [];

  const update = (key, value) => setFilters(current => ({ ...current, [key]: value === 'All' ? '' : value }));
  const reset = () => setFilters({ startDate: '', endDate: '', outlet: '', group: '', orderType: '' });

  const peakHours = [...(data?.hourly || [])].sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 2);
  const peakText = peakHours.length === 2
    ? `Revenue is strongest around ${String(peakHours[0].hour).padStart(2, '0')}:00 and ${String(peakHours[1].hour).padStart(2, '0')}:00.`
    : 'Hourly revenue is available for operational planning.';

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="/"><span className="brand-mark">BA</span><span><strong>Business Analytics</strong><small>Assessment dashboard</small></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#performance" onClick={() => setMenuOpen(false)}>Performance</a><a href="#operations" onClick={() => setMenuOpen(false)}>Operations</a><a href="#about" onClick={() => setMenuOpen(false)}>Data notes</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
      <button className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <main className="container">
      <section className="intro">
        <div><p className="eyebrow">SALES OPERATIONS</p><h1>Business performance overview.</h1><p className="intro-copy">Revenue, orders and product performance across the available sales data, with filters applied before aggregation.</p></div>
        <div className="dataset-note"><Database size={17}/><span><strong>300,000</strong> line items<br/><small>17 Jun 2025 to 16 Jun 2026</small></span></div>
      </section>

      <Filters filters={filters} options={options} onChange={update} onReset={reset}/>
      {active > 0 && <div className="filter-status"><strong>{active}</strong> filter{active > 1 ? 's' : ''} active · Results update from the server</div>}
      {error && <div className="error"><CircleAlert size={18}/><div><strong>Unable to load analytics</strong><span>{error}</span></div></div>}

      {loading && !data ? <div className="loading"><Server size={18}/> Loading analytics</div> : data && <>
        <section className="overview-heading"><div><h2>Key measures</h2></div><span>All amounts shown in the source unit</span></section>
        <section className="kpi-grid">
          <Kpi primary label="Revenue" value={formatAmount(data.summary.revenue)} note="No currency symbol is provided in the source"/>
          <Kpi label="Orders" value={formatNumber(data.summary.orders)} note="COUNT(DISTINCT BillNo)"/>
          <Kpi label="Line items" value={formatNumber(data.summary.lineItems)} note="Rows in the filtered result"/>
          <Kpi label="Average order value" value={formatDecimal(data.summary.aov)} note="Revenue ÷ distinct orders"/>
        </section>
        <MethodNotes />

        <section className="performance-strip" id="performance" aria-label="Application performance">
          <div><p className="eyebrow">PERFORMANCE</p><h2>Measured request performance.</h2><p>Filtering and aggregation happen in SQLite. React receives only the summarized datasets needed to render this view.</p></div>
          <div className="performance-grid">
            <article><span>Response time</span><strong>{requestMs !== null ? `${requestMs} ms` : 'Measuring...'}</strong><small>Browser-side elapsed time for the latest dashboard request, including JSON parsing.</small></article>
            <article><span>Aggregated response</span><strong>{data?._performance ? `${formatNumber(data._performance.aggregatedRows)} rows` : 'Measuring...'}</strong><small>Combined rows returned across the dashboard's aggregated datasets.</small></article>
            <article><span>Source rows</span><strong>{data?.summary ? formatNumber(data.summary.lineItems) : 'Measuring...'}</strong><small>Source line items remain in SQLite and are not transferred to the browser.</small></article>
            <article><span>Client payload</span><strong>{data?._performance ? `${formatNumber(data._performance.payloadBytes / 1024)} KB` : 'Measuring...'}</strong><small>Uncompressed JSON size of the dashboard response received by the client.</small></article>
          </div>
        </section>

        <section className="insight"><Clock3 size={18}/><div><strong>Operational pattern</strong><span>{peakText} Daily revenue is shown rather than a monthly growth story because the source period begins and ends on partial months.</span></div></section>

        <section className="section-heading"><p className="eyebrow">REVENUE ANALYSIS</p><h2>Where revenue comes from</h2></section>
        <section className="two-col">
          <Panel title="Daily revenue trend" description="Daily revenue across the source period. June 2025 and June 2026 are partial months."><RevenueChart data={data.revenueTrend}/></Panel>
          <Panel title="Revenue by category" description="Contribution from the selected menu groups, ranked by revenue."><HorizontalBars data={data.categories} categoryKey="groupName"/></Panel>
        </section>
        <section className="two-col">
          <Panel title="Revenue by outlet" description="Revenue contribution from each outlet under the selected filters."><HorizontalBars data={data.outlets} categoryKey="outlet"/></Panel>
          <Panel title="Revenue by order type" description="Revenue split across Dine-In, Delivery and Takeaway."><HorizontalBars data={data.orderTypes} categoryKey="orderType"/></Panel>
        </section>

        <section className="section-heading" id="operations"><p className="eyebrow">OPERATIONS</p><h2>Demand and product mix</h2></section>
        <section className="two-col">
          <Panel title="Revenue by hour" description="Hourly revenue distribution for operational planning."><HourlyChart data={data.hourly}/></Panel>
          <Panel title="Top items by revenue" description="Top 10 items returned by the server, with simple client-side pagination."><PaginatedItems rows={topItems}/></Panel>
        </section>
      </>}

      <section className="about" id="about"><div><p className="eyebrow">DATA METHODOLOGY</p><h2>Built around the source data.</h2><p>The source workbook contains 300,000 line items across six outlets and 45 menu items. Orders are counted by distinct BillNo, and line revenue is calculated as Price × Quantity. Zero-price lines are retained because the source analysis identifies them as legitimate free items.</p></div><div className="about-meta"><span><FileText size={16}/> Currency is not specified in the source</span><span><BarChart3 size={16}/> Seven product categories</span><span><Database size={16}/> Server-side aggregation</span><span><CalendarDays size={16}/> 17 Jun 2025 to 16 Jun 2026</span></div></section>
      <footer><span>Business Analytics Dashboard</span><span>Data source: provided assessment workbook</span></footer>
    </main>
  </div>;
}

export default function App() {
  const path = window.location.pathname;
  if (path === '/privacy') return <LegalPage type="privacy"/>;
  if (path === '/terms') return <LegalPage type="terms"/>;
  return <Dashboard/>;
}
