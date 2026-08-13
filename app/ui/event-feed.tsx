import type { Corpus, Event } from '@/lib/types';
import { formatDate, Icon, PageHeading, ProductTags, type FeedState } from './shared';

type Props = {
  corpus: Corpus;
  events: Event[];
  view: FeedState;
  onChange: (patch: Partial<FeedState>) => void;
  onInspect: (event: Event) => void;
  onInvestigate: () => void;
  onEvaluation: () => void;
};

export function EventFeed({ corpus, events, view, onChange, onInspect, onInvestigate, onEvaluation }: Props) {
  const reviewed = corpus.events.filter(event => event.source_reviewed || event.original_verified).length;
  const filtered = view.product !== 'all' || view.year !== 'all' || Boolean(view.search);
  const reset = () => onChange({ product: 'all', year: 'all', search: '' });
  const productName = corpus.products.find(p => p.id === view.product)?.name;
  const years = [...new Set(corpus.events.map(event => event.approval_date.slice(0, 4)))].sort().reverse();

  return <>
    <PageHeading eyebrow="Oncology intelligence / US regulatory evidence" title="Follow the evidence."
      description="Explore FDA developments, inspect the supporting trials, and build a cited research brief."
      action={<button className="primary" onClick={onInvestigate}><Icon name="investigate" />Start an investigation<Icon name="arrow" size={16} /></button>} />

    <section className="coverage" aria-label="Corpus coverage">
      <div><strong>{corpus.events.length}</strong><span>Documented events<small>Selected FDA announcements</small></span></div>
      <div><strong>{corpus.products.length}</strong><span>Product formulations<small>Separate IV and SC identities</small></span></div>
      <div><strong>{corpus.trials.length}</strong><span>FDA-cited trials<small>{corpus.trials.filter(t => t.available).length} registry snapshots acquired</small></span></div>
      <div><strong>{reviewed}<span className="coverage-total">/{corpus.events.length}</span></strong><span>Announcement fields reviewed<small>Dated publisher field reviews</small></span></div>
    </section>

    <div className="source-notice"><Icon name="info" size={18} /><div><strong>Selected evidence. Clear boundaries.</strong> FDA fields are developer-reviewed; this collection is not a complete approval history and has no independent clinical adjudication.<details><summary>How the sources were reviewed</summary><p>Approval fields were checked against FDA publisher pages using selected proof excerpts. Full original HTML was not acquired. Trial records are separately acquired registry snapshots; their retrieval dates are distinct from approval dates.</p></details></div></div>

    <section className="event-section" aria-labelledby="developments-title">
      <div className="section-heading"><div><h2 id="developments-title">Documented developments</h2><p>Approval dates from the announcement body.</p></div><span className="section-kicker">FDA announcements</span></div>
      <div className="filter-toolbar">
        <label className="filter-label search-label"><span>Search records</span><span className="search-field"><Icon name="search" size={17} /><input type="search" placeholder="Indication or keyword" value={view.search} maxLength={120} onChange={e => onChange({ search: e.target.value })} aria-label="Search event title or population" /></span></label>
        <label className="filter-label"><span>Product</span><select aria-label="Product" value={view.product} onChange={e => onChange({ product: e.target.value })}><option value="all">All formulations</option>{corpus.products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <label className="filter-label year-filter"><span>Approval year</span><select value={view.year} onChange={e => onChange({ year: e.target.value })}><option value="all">All years</option>{years.map(year => <option key={year}>{year}</option>)}</select></label>
      </div>
      <div className="results-toolbar"><p role="status" aria-live="polite" aria-atomic="true"><strong>{events.length}</strong> of {corpus.events.length} developments{filtered ? ' match your filters' : ' in this collection'}</p><label className="sort-control"><span>Sort</span><select aria-label="Sort developments" value={view.sort} onChange={e => onChange({ sort: e.target.value as FeedState['sort'] })}><option value="latest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
      {filtered && <div className="active-filters" aria-label="Active filters">
        {view.product !== 'all' && <button onClick={() => onChange({ product: 'all' })} aria-label={'Remove product filter ' + productName}>{productName}<Icon name="close" size={13} /></button>}
        {view.year !== 'all' && <button onClick={() => onChange({ year: 'all' })} aria-label={'Remove year filter ' + view.year}>{view.year}<Icon name="close" size={13} /></button>}
        {view.search && <button onClick={() => onChange({ search: '' })} aria-label="Remove search filter"><span>“{view.search}”</span><Icon name="close" size={13} /></button>}
        <button className="clear-filters" onClick={reset}>Reset</button>
      </div>}

      <div className="table-wrap"><table className="events-table" role="table"><caption className="sr-only">Selected US FDA oncology announcements. {events.length} matching developments, sorted {view.sort === 'latest' ? 'newest' : 'oldest'} first.</caption><thead role="rowgroup"><tr role="row"><th scope="col">Development</th><th scope="col">Formulation</th><th scope="col" aria-sort={view.sort === 'latest' ? 'descending' : 'ascending'}>Approval date</th><th scope="col">Evidence</th></tr></thead>
        <tbody role="rowgroup">{events.map(event => <tr key={event.id} role="row">
          <td className="development-cell" role="cell"><button className="event-title" onClick={() => onInspect(event)}><span>{event.title}</span><Icon name="chevron" size={17} /></button><div className="event-subtitle">{event.trial_names.length ? event.trial_names.join(' · ') : 'Open record for source details'}</div></td>
          <td className="formulation-cell" role="cell"><span className="mobile-label" aria-hidden="true">Formulation</span><ProductTags ids={event.product_ids} products={corpus.products} /></td>
          <td className="date-cell" role="cell"><span className="mobile-label" aria-hidden="true">Approval date</span><time dateTime={event.approval_date}>{formatDate(event.approval_date)}</time></td>
          <td className="evidence-cell" role="cell"><span className="mobile-label" aria-hidden="true">Evidence</span><span className="evidence-count"><Icon name="book" size={15} />{event.trial_ids.length} {event.trial_ids.length === 1 ? 'trial' : 'trials'}</span><span className="status-note">{event.original_verified ? 'Original checked' : event.source_reviewed ? 'Field review recorded' : 'Browser reviewed'}</span></td>
        </tr>)}</tbody></table>
        {!events.length && <div className="empty"><span className="empty-icon"><Icon name="search" size={24} /></span><h3>No matching developments</h3><p>Try a broader keyword or remove a filter.<br />This collection covers selected announcements only.</p><button className="secondary" onClick={reset}>Clear all filters<Icon name="arrow" size={16} /></button></div>}
      </div>
      <div className="table-footer"><span>{events.length ? 'Select a development to inspect its population, qualifiers and sources.' : 'No records selected.'}</span><button className="text-button" onClick={onEvaluation}>Method and evaluation<Icon name="arrow" size={15} /></button></div>
    </section>
  </>;
}
