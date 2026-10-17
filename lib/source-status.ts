import type {Corpus} from './types.ts';

export function verifiedSourceCorpus(corpus:Corpus):boolean{
  if(corpus.mode==='original-sources')return true;
  return corpus.mode==='source-reviewed'&&corpus.verification?.review_complete===true&&corpus.events.every(event=>event.source_reviewed===true);
}
