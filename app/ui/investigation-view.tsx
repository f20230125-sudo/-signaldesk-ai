import { useRef, useState } from 'react';
import type { Corpus, Investigation } from '@/lib/types';
import { formatDate, Icon, PageHeading, ProductTags, starters } from './shared';

type Props = {
  corpus: Corpus; product: string; question: string; busy: boolean; error: string;
  result: Investigation | null; resultQuestion: string;
  onProduct: (value: string) => void; onQuestion: (value: string) => void;
  onRun: () => void; onExport: () => void; onBrowse: () => void;
};

export function InvestigationView({ corpus, product, question, busy, error, result, resultQuestion, onProduct, onQuestion, onRun, onExport, onBrowse }: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [validation, setValidation] = useState('');
  const submit = () => {
    if (busy) return;
    if (question.trim().length < 8) { setValidation('Enter a research question with at least 8 characters.'); textarea.current?.focus(); return; }
    setValidation(''); onRun();
  };
  return <section className="investigation">
    <PageHeading eyebrow="Research workspace" title="Investigate a question" description="Turn a focused question into a brief with FDA records, linked trials and explicit evidence limits." />
    <div className="research-layout"><div className="research-main">
      <form className="question-box" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
        <div className="form-section-top"><h2>Your investigation</h2><span className="quiet-tag">Source-backed research</span></div>
        <label className="filter-label scope-selector"><span>Product scope</span><select value={product} disabled={busy} onChange={e => onProduct(e.target.value)}><option value="all">All formulations in this collection</option>{corpus.products.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="question-label" htmlFor="question">Research question</label>
        <p id="question-hint" className="field-hint">Include the product, indication or period you want to explore.</p>
        <textarea ref={textarea} id="question" value={question} rows={5} maxLength={1600} readOnly={busy} aria-invalid={Boolean(validation)} aria-describedby={'question-hint question-count' + (validation ? ' question-error' : '')} onChange={e => { onQuestion(e.target.value); if (validation) setValidation(''); }} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); } }} />
        <div className="question-help"><span id="question-count">{question.length.toLocaleString()} / 1,600 characters</span><span className="keyboard-hint">Ctrl / ⌘ + Enter to run</span></div>
        {validation && <p id="question-error" className="field-error" role="alert">{validation}</p>}
        <div className="question-footer"><span><Icon name="clock" size={15} />Evidence through {formatDate(corpus.cutoff)}</span><button type="submit" className="primary" disabled={busy}>{busy ? <><span className="spinner" />Investigating…</> : <>Run investigation<Icon name="arrow" size={16} /></>}</button></div>
      </form>
      <section className="starter-section" aria-labelledby="starter-title"><h2 id="starter-title">Start with a question</h2><div className="starter-questions">{starters.map((starter, index) => <button key={starter.label} disabled={busy} onClick={() => { onQuestion(starter.question); onProduct('all'); setValidation(''); textarea.current?.focus(); }}><span className="starter-number">0{index + 1}</span><span><strong>{starter.label}</strong><small>{starter.detail}</small></span><Icon name="arrow" size={16} /></button>)}</div></section>
    </div><aside className="research-guide" aria-label="Research scope"><span className="guide-icon"><Icon name="book" size={22} /></span><h2>A brief you can inspect</h2><p>Every selected fact stays connected to its source record.</p><ol><li><strong>Documented developments</strong><span>Approval dates, populations and important qualifiers.</span></li><li><strong>Supporting trials</strong><span>FDA-cited identifiers and available registry snapshots.</span></li><li><strong>Evidence boundaries</strong><span>Interpretations for review, follow-up questions and limitations.</span></li></ol><div className="guide-boundary"><strong>Selected US evidence</strong><p>{corpus.events.length} announcements · {corpus.products.length} formulations. Developer-reviewed, with no independent clinical adjudication.</p><p>Live investigations are rate limited. You can browse source records at any time.</p></div><button className="text-button" onClick={onBrowse}>Browse the evidence<Icon name="arrow" size={15} /></button></aside></div>

    <div className="investigation-status" role="status" aria-live="polite" aria-atomic="true">{busy ? <div className="loading"><span className="spinner" /><div><strong>Reviewing the selected evidence</strong><p>An investigation can take up to a minute. You can continue browsing the event feed.</p></div></div> : result && !error ? <span className="sr-only">Investigation ready. {result.facts.length} documented facts selected.</span> : null}</div>
    {error && <div className="error" role="alert"><Icon name="info" size={20} /><div><strong>Investigation unavailable</strong><p>{error}</p><p>{result ? 'Your previous brief is still available below. ' : ''}The source records remain available.</p><button className="text-button" onClick={onBrowse}>Explore the event feed<Icon name="arrow" size={15} /></button></div></div>}
    {result && <Brief result={result} question={resultQuestion} onExport={onExport} previous={Boolean(error || busy)} />}
  </section>;
}

function Brief({ result, question, onExport, previous }: { result: Investigation; question: string; onExport: () => void; previous: boolean }) {
  return <article className="brief" aria-labelledby="brief-title">
    <header className="brief-header"><div><p className="eyebrow">{previous ? 'Previous completed brief' : 'Research brief'} · {result.status}</p><h2 id="brief-title">{result.title}</h2></div><button className="secondary" onClick={onExport}><Icon name="download" size={17} />Export brief</button></header>
    <p className="brief-question">{question}</p><div className="brief-meta"><span>Generated {formatDate(result.generated_at)}</span><span>{result.model}</span><span>{(result.usage.latency_ms / 1000).toFixed(1)} s · {result.usage.model_calls} model calls</span><span>Evidence cutoff {formatDate(result.cutoff)}</span></div>
    <section className="brief-facts"><h3>Documented facts <span className="section-count">{result.facts.length}</span></h3>{result.products.length > 0 && <div className="brief-products">{result.products.map(product => <div key={product.id}><ProductTags ids={[product.id]} products={result.products} /><span>{product.ingredient}</span><small>{product.route}</small></div>)}</div>}
      {result.facts.map(event => <section className="fact" key={event.id}><time dateTime={event.approval_date}>{formatDate(event.approval_date)}</time><h4>{event.title}</h4><p>{event.population_summary}</p>{event.evidence_notes.map(note => <p className="qualifier" key={note}>{note}</p>)}<a href={event.source_url} target="_blank" rel="noreferrer">FDA announcement<Icon name="external" size={13} /><span className="sr-only"> (opens in new tab)</span></a></section>)}
      {!result.facts.length && !result.products.length && <p>No supported factual answer was selected.</p>}
    </section>
    {result.trials.length > 0 && <section><h3>Supporting trial records</h3>{result.trials.map(trial => <div className="trial-link" key={trial.id}><a href={trial.source_url} target="_blank" rel="noreferrer">{trial.id}<Icon name="external" size={13} /><span className="sr-only"> (opens in new tab)</span></a><span>{trial.available ? `${trial.status ?? 'Registry record'}${trial.snapshot_at ? ' · acquired ' + formatDate(trial.snapshot_at) : ''}` : 'FDA-cited identifier; snapshot unavailable'}</span></div>)}</section>}
    {result.commercial_relevance.length > 0 && <section><h3>Possible commercial relevance <span className="hypothesis">For review</span></h3><ul>{result.commercial_relevance.map(item => <li key={item}>{item}</li>)}</ul></section>}
    {result.follow_up_questions.length > 0 && <section><h3>Follow-up questions</h3><ul>{result.follow_up_questions.map(item => <li key={item}>{item}</li>)}</ul></section>}
    <section className="limitations"><h3>What the evidence does not establish</h3><ul>{result.limitations.map(item => <li key={item}>{item}</li>)}</ul></section>
    <details><summary>Inspect supporting passages ({result.evidence.length})</summary>{result.evidence.map(passage => <div className="source-passage" key={passage.id}><span className="passage-label">{passage.is_original_excerpt ? passage.source_format === 'selected-browser-publisher-text' ? 'Selected publisher proof' : 'Original source excerpt' : 'Reviewed paraphrase'}</span><p>{passage.text}</p><a href={passage.source_url} target="_blank" rel="noreferrer">Open source<Icon name="external" size={13} /><span className="sr-only"> (opens in new tab)</span></a></div>)}</details>
    <details><summary>Tool activity ({result.trace.length} calls)</summary>{result.trace.map((call, index) => <div className="trace" key={index}><strong>{index + 1}. {call.name}</strong><code>{JSON.stringify(call.arguments)}</code>{call.error && <span>{call.error}</span>}</div>)}</details>
  </article>;
}
