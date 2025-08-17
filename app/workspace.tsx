'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Corpus, Event, Investigation } from '@/lib/types';
import { findEvents } from '@/lib/tools';
import { exportBrief } from '@/lib/agent';
import { EventFeed } from './ui/event-feed';
import { EvidenceDrawer } from './ui/evidence-drawer';
import { InvestigationView } from './ui/investigation-view';
import { EvaluationView, type Evaluation } from './ui/evaluation-view';
import { formatDate, Icon, initialView, repository, starters, viewLabels, type FeedState, type View } from './ui/shared';

function readView(corpus: Corpus): FeedState {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('view');
  const product = params.get('product') ?? 'all';
  const year = params.get('year') ?? 'all';
  return {
    tab: tab === 'investigate' || tab === 'evaluation' ? tab : 'feed',
    product: corpus.products.some(item => item.id === product) ? product : 'all',
    year: corpus.events.some(item => item.approval_date.startsWith(year + '-')) ? year : 'all',
    search: (params.get('search') ?? '').slice(0, 120),
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'latest',
  };
}

function viewUrl(view: FeedState) {
  const params = new URLSearchParams();
  if (view.tab !== 'feed') params.set('view', view.tab);
  if (view.product !== 'all') params.set('product', view.product);
  if (view.year !== 'all') params.set('year', view.year);
  if (view.search) params.set('search', view.search);
  if (view.sort !== 'latest') params.set('sort', view.sort);
  return window.location.pathname + (params.size ? '?' + params.toString() : '');
}

export default function Workspace({ corpus, evaluation }: { corpus: Corpus; evaluation: Evaluation }) {
  const [view, setView] = useState<FeedState>(initialView);
  const [selected, setSelected] = useState<Event | null>(null);
  const [question, setQuestion] = useState(starters[0].question);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Investigation | null>(null);
  const [resultQuestion, setResultQuestion] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const main = useRef<HTMLElement>(null);
  const previousTab = useRef<View>('feed');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const restore = () => { setView(readView(corpus)); setSelected(null); };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [corpus]);
  useEffect(() => {
    document.title = viewLabels[view.tab] + ' · SignalDesk AI';
    if (previousTab.current !== view.tab) {
      main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      previousTab.current = view.tab;
    }
  }, [view.tab]);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  function changeView(patch: Partial<FeedState>, push = false) {
    const next = { ...view, ...patch };
    const url = viewUrl(next);
    if (url !== window.location.pathname + window.location.search) {
      if (push) window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    }
    setView(next);
  }
  function navigate(tab: View) { changeView({ tab }, true); setSelected(null); }
  function investigate(event?: Event) {
    if (event && !busy) {
      setQuestion(`Investigate the FDA announcement "${event.title}" dated ${event.approval_date}. Include its approved population, important qualifiers and supporting trial identifiers.`);
      changeView({ tab: 'investigate', product: 'all' }, true);
    } else navigate('investigate');
    setSelected(null);
    if (!busy) setError('');
  }

  const events = useMemo(() => {
    const found = findEvents(corpus, {
      ...(view.product !== 'all' ? { products: [view.product] } : {}),
      ...(view.year !== 'all' ? { start: view.year + '-01-01', end: view.year + '-12-31' } : {}),
      ...(view.search.trim() ? { condition: view.search.trim() } : {}),
    });
    return view.sort === 'oldest' ? found.reverse() : found;
  }, [corpus, view.product, view.year, view.search, view.sort]);

  async function run() {
    if (inFlight.current || question.trim().length < 8) return;
    inFlight.current = true;
    setBusy(true); setError('');
    const submittedQuestion = question;
    try {
      const response = await fetch('/api/investigate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: submittedQuestion, filters: { ...(view.product !== 'all' ? { products: [view.product] } : {}) } }), signal: AbortSignal.timeout(65000) });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Live investigations are currently unavailable.';
        throw new Error(message);
      }
      if (!data || typeof data !== 'object' || !('facts' in data) || !Array.isArray(data.facts) || !('status' in data)) throw new Error('The investigation returned an invalid response.');
      setResult(data as Investigation); setResultQuestion(submittedQuestion);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The investigation could not complete.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([exportBrief(result)], { type: 'text/markdown;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'SignalDesk-Brief.md'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copyView() {
    try { await navigator.clipboard.writeText(window.location.origin + viewUrl(view)); setCopyStatus('Link copied'); }
    catch { setCopyStatus('Copy the link from your address bar'); }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(''), 4000);
  }

  return <div className="shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <div className="brand-row"><a href="/" className="brand" aria-label="SignalDesk AI home"><span className="brand-mark"><Icon name="signal" size={23} /></span><span>SignalDesk{' '}<span className="brand-ai">AI</span></span></a><button className="mobile-copy" onClick={copyView} aria-label={copyStatus === 'Link copied' ? 'Link copied' : 'Copy link to this view'}><Icon name="link" size={14} />{copyStatus === 'Link copied' ? 'Copied' : 'Copy link'}</button></div>
      <div className="workspace-label"><span>RESEARCH WORKSPACE</span><span className="preview-label">Portfolio</span></div>
      <nav aria-label="Main navigation">{(['feed', 'investigate', 'evaluation'] as const).map(tab => <button key={tab} className={'nav-button ' + (view.tab === tab ? 'active' : '')} aria-current={view.tab === tab ? 'page' : undefined} onClick={() => navigate(tab)}><Icon name={tab === 'feed' ? 'signal' : tab === 'investigate' ? 'investigate' : 'chart'} /><span>{viewLabels[tab]}</span>{tab === 'feed' && <span className="nav-count">{corpus.events.length}</span>}{tab === 'investigate' && busy && <span className="nav-working" aria-label="Investigation running" />}</button>)}</nav>
      <section className="watchlist" aria-labelledby="watchlist-title"><div className="watchlist-heading"><h2 id="watchlist-title">Tracked formulations</h2><span>{corpus.products.length}</span></div>
        {corpus.products.map(product => <button key={product.id} className={'watch-item ' + (view.product === product.id ? 'chosen' : '')} aria-pressed={view.product === product.id} onClick={() => changeView({ tab: 'feed', product: product.id, year: 'all', search: '' }, view.tab !== 'feed')}><span className={'product-dot ' + product.id.split('-')[0]} /><span className="watch-name">{product.name}<small>{product.route}</small></span><span className="watch-count" aria-label={corpus.events.filter(event => event.product_ids.includes(product.id)).length + ' developments'}>{corpus.events.filter(event => event.product_ids.includes(product.id)).length}</span></button>)}
        <button className="reset-watch" onClick={() => changeView({ tab: 'feed', product: 'all', year: 'all', search: '' }, view.tab !== 'feed')}>All formulations<Icon name="arrow" size={15} /></button>
      </section>
      <div className="sidebar-bottom"><div><Icon name="book" size={16} /><span>Public US evidence</span></div><p>Snapshot {formatDate(corpus.cutoff)}<br />Independent research project</p><a href={repository} target="_blank" rel="noreferrer">Project repository<Icon name="external" size={13} /><span className="sr-only"> (opens in new tab)</span></a></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13} /><strong>{viewLabels[view.tab]}</strong></div><div className="topbar-right"><span className="jurisdiction">US oncology</span><span className="snapshot"><Icon name="clock" size={14} />{formatDate(corpus.cutoff)}</span><button className="copy-view" onClick={copyView}><Icon name="link" size={15} /><span>Copy view link</span></button><span className="sr-only" role="status">{copyStatus}</span>{copyStatus && <span className="copy-feedback" aria-hidden="true">{copyStatus}</span>}</div></header>
      <main id="main-content" ref={main} tabIndex={-1}>
        {view.tab === 'feed' && <EventFeed corpus={corpus} events={events} view={view} onChange={changeView} onInspect={setSelected} onInvestigate={() => investigate()} onEvaluation={() => navigate('evaluation')} />}
        {view.tab === 'investigate' && <InvestigationView corpus={corpus} product={view.product} question={question} busy={busy} error={error} result={result} resultQuestion={resultQuestion} onProduct={product => changeView({ product })} onQuestion={setQuestion} onRun={run} onExport={download} onBrowse={() => navigate('feed')} />}
        {view.tab === 'evaluation' && <EvaluationView evaluation={evaluation} />}
        <footer className="site-footer"><span>SignalDesk AI <span className="footer-divider">/</span> Independent portfolio work</span><span>Public US evidence · No MSD affiliation</span></footer>
      </main>
    </div>
    <span className="sr-only mobile-copy-status" role="status">{copyStatus}</span>
    {selected && <EvidenceDrawer event={selected} corpus={corpus} onClose={() => setSelected(null)} onInvestigate={investigate} />}
  </div>;
}
