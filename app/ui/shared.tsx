import type { ReactNode } from 'react';
import type { Product } from '@/lib/types';

export type View = 'feed' | 'investigate' | 'evaluation';
export type FeedState = { tab: View; product: string; year: string; search: string; sort: 'latest' | 'oldest' };
export const initialView: FeedState = { tab: 'feed', product: 'all', year: 'all', search: '', sort: 'latest' };
export const viewLabels: Record<View, string> = { feed: 'Event feed', investigate: 'Investigate', evaluation: 'Evaluation' };
export const repository = 'https://github.com/f20230125-sudo/-signaldesk-ai';
export const starters = [
  { label: 'Compare approval populations', detail: 'Imfinzi and Opdivo · resectable NSCLC', question: 'Compare the 2024 Imfinzi and Opdivo approvals for resectable NSCLC. Include the approved populations, exclusions and supporting trial IDs. What cannot be concluded from separate trials?' },
  { label: 'Separate the formulations', detail: 'KEYTRUDA QLEX, OPDIVO QVANTIG and TECENTRIQ HYBREZA', question: 'Which subcutaneous formulations appear in this collection? Keep KEYTRUDA QLEX, OPDIVO QVANTIG and TECENTRIQ HYBREZA distinct from the intravenous products.' },
  { label: 'Review a product’s developments', detail: 'KEYTRUDA · 2025 announcements', question: 'Which KEYTRUDA developments are documented during 2025? Show the event dates, populations and FDA-cited trial identifiers.' },
];

export const formatDate = (value: string) => new Date(value.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const paths = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  external: <><path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  check: <path d="m5 12 4 4L19 6" />,
  signal: <path d="M4 19v-5m5 5V9m5 10V4m5 15v-8" />,
  book: <><path d="M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3V4Zm9 2v16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  investigate: <><path d="M9 3h6m-5 0v7L4 20h16l-6-10V3M8 15h8" /></>,
  chart: <><path d="M4 3v18h17M8 16v-5m5 5V7m5 9v-3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  link: <><path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 -1)" /></>,
  document: <><path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6" /></>,
} satisfies Record<string, ReactNode>;

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export function ProductTags({ ids, products }: { ids: string[]; products: Product[] }) {
  return <div className="product-pills">{ids.map(id => {
    const product = products.find(p => p.id === id);
    return <span key={id} className={'pill ' + id.split('-')[0]}>{product?.name ?? id}</span>;
  })}</div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1 id="view-title" tabIndex={-1}>{title}</h1><p className="page-description">{description}</p></div>{action}</header>;
}
