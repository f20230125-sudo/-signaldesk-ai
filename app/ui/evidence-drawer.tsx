import { useEffect, useRef } from 'react';
import type { Corpus, Event } from '@/lib/types';
import { formatDate, Icon, ProductTags } from './shared';

export function EvidenceDrawer({ event, corpus, onClose, onInvestigate }: { event: Event; corpus: Corpus; onClose: () => void; onInvestigate: (event: Event) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const passages = corpus.evidence.filter(passage => passage.event_id === event.id);

  return <dialog ref={dialog} className="drawer" aria-labelledby="event-detail-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="drawer-surface">
      <header className="drawer-top"><span><Icon name="document" size={17} />Evidence record</span><button className="icon-button" aria-label="Close event details" onClick={onClose} autoFocus><Icon name="close" size={20} /></button></header>
      <div className="drawer-body">
        <div className="record-meta"><time dateTime={event.approval_date}>{formatDate(event.approval_date)}</time><span>United States · FDA</span></div>
        <h2 id="event-detail-title">{event.title}</h2>
        <ProductTags ids={event.product_ids} products={corpus.products} />
        <section className="record-section"><h3>Approved population</h3><p>{event.population_summary}</p></section>
        {event.evidence_notes.length > 0 && <section className="record-qualifiers"><h3>Important qualifiers</h3><ul>{event.evidence_notes.map(note => <li key={note}>{note}</li>)}</ul></section>}
        <section className="record-section"><div className="record-section-heading"><h3>FDA-cited trials</h3><span>{event.trial_ids.length} linked</span></div>{event.trial_ids.length ? event.trial_ids.map(id => {
          const trial = corpus.trials.find(item => item.id === id);
          return <div className="trial-link" key={id}><a href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noreferrer">{id}<Icon name="external" size={14} /><span className="sr-only"> (opens in new tab)</span></a><span>{trial?.available ? `Snapshot acquired${trial.snapshot_at ? ' · ' + formatDate(trial.snapshot_at) : ''}` : 'Registry snapshot unavailable'}</span></div>;
        }) : <p>No trial identifiers are recorded for this announcement.</p>}</section>
        <section className="provenance"><div><Icon name="book" size={18} /><h3>Source review</h3></div><p>{event.original_verified ? 'Original announcement bytes were acquired and checked.' : event.source_reviewed ? 'Approval fields were developer-reviewed against FDA publisher text. Proof excerpts are selective; full original HTML was not acquired.' : 'Browser-reviewed summary. Inspect the original FDA announcement for the complete source.'}</p>{event.source_reviewed_at && <small>Field review recorded {formatDate(event.source_reviewed_at)}</small>}</section>
        {passages.length > 0 && <details className="record-passages"><summary>Supporting passages ({passages.length})</summary>{passages.map(passage => <div className="source-passage" key={passage.id}><span className="passage-label">{passage.is_original_excerpt ? 'Selected publisher proof' : 'Reviewed paraphrase'}</span><p>{passage.text}</p></div>)}</details>}
        <p className="drawer-disclaimer">Developer review is not independent clinical adjudication. Separate trials do not establish treatment superiority.</p>
      </div>
      <footer className="drawer-actions"><a className="secondary" href={event.source_url} target="_blank" rel="noreferrer">Read the FDA announcement<Icon name="external" size={16} /><span className="sr-only"> (opens in new tab)</span></a><button className="primary" onClick={() => onInvestigate(event)}>Investigate this event<Icon name="arrow" size={16} /></button></footer>
    </div>
  </dialog>;
}
