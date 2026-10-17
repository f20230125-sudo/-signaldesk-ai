"""Validate publisher field reviews without relabelling them as downloaded HTML."""
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REQUIRED=('approval_date','trial_ids','population_summary','qualifiers')


def checked_review(event,path):
    raw=path.read_bytes();review=json.loads(raw)
    if review.get('event_id')!=event['id'] or review.get('source_url')!=event['source_url']:
        raise ValueError('Review identity mismatch: '+event['id'])
    if review.get('capture_format')!='browser-extracted-publisher-text':raise ValueError('Unrecognised capture format')
    if not all(review.get('field_checks',{}).get(key) is True for key in REQUIRED):raise ValueError('Unresolved source field review: '+event['id'])
    if not review.get('reviewer') or not review.get('review_notes'):raise ValueError('Source reviewer and notes are required')
    paragraphs=review.get('paragraphs',[])
    if not paragraphs or any(not isinstance(p,str) or not p.strip() for p in paragraphs):raise ValueError('Publisher proof excerpts are required')
    body=' '.join(paragraphs)
    if len(body.split())>25:raise ValueError('Selected publisher proof exceeds the quotation budget')
    date=datetime.strptime(event['approval_date'],'%Y-%m-%d')
    if not re.search(rf'{date.strftime("%B")}\s+0?{date.day},\s*{date.year}',body,re.I):raise ValueError('Approval date missing from publisher proof: '+event['id'])
    if any(nct not in body for nct in event['trial_ids']):raise ValueError('Cited trial missing from publisher proof: '+event['id'])
    datetime.fromisoformat(review['captured_at'].replace('Z','+00:00'))
    return review,hashlib.sha256(raw).hexdigest()


def apply():
    seed=json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))
    corpus=json.loads((ROOT/'data/corpus.json').read_text(encoding='utf-8'))
    acquisition=json.loads((ROOT/'data/source-manifest.json').read_text(encoding='utf-8'))
    receipts={source['url']:source for source in acquisition['sources']}
    for trial in corpus['trials']:
        receipt=receipts.get(trial['api_url'],{})
        if not trial['available'] or trial.get('sha256')!=receipt.get('sha256') or trial['snapshot_at']!=receipt.get('retrieved_at'):
            raise ValueError('Acquired registry provenance is required: '+trial['id'])
    if not all(product.get('identity_verified') and receipts.get(product.get('identity_source_url'),{}).get('kind')=='drugsfda' for product in corpus['products']):
        raise ValueError('Drugs@FDA identity receipts are required')
    events={event['id']:event for event in corpus['events']};reviews=[]
    if set(events)!={event['id'] for event in seed['events']}:raise ValueError('Corpus and seed event identities differ')
    for event in seed['events']:
        path=ROOT/'data/source-text'/f"{event['id']}.json"
        review,sha=checked_review(event,path)
        current=events[event['id']]
        for key in ('approval_date','source_url','population_summary','trial_ids','evidence_notes','product_ids'):
            if current[key]!=event[key]:raise ValueError('Reviewed seed/corpus fields differ: '+event['id'])
        current.update(source_reviewed=True,source_review_sha256=sha,source_review_path=path.relative_to(ROOT).as_posix(),source_reviewed_at=review['captured_at'])
        proof_id=event['id']+':publisher-proof'
        corpus['evidence']=[p for p in corpus['evidence'] if p['id']!=proof_id]
        corpus['evidence'].append(dict(id=proof_id,event_id=event['id'],text=' '.join(review['paragraphs']),source_url=event['source_url'],is_original_excerpt=True,source_sha256=sha,source_format='selected-browser-publisher-text',excerpt_notice='Selected literal publisher proof. Hash identifies the saved review capture, not HTTP HTML bytes.'))
        current['evidence_ids']=list(dict.fromkeys([*current['evidence_ids'],proof_id]))
        reviews.append(dict(event_id=event['id'],path=path.relative_to(ROOT).as_posix(),sha256=sha,source_url=event['source_url'],captured_at=review['captured_at'],field_checks=review['field_checks']))
    manifest=dict(schema_version=1,method='Developer field review against official FDA publisher pages with selected literal proof excerpts',transport='Browser-extracted text; original HTTP HTML acquisition remains separate',review_complete=True,events=reviews)
    corpus['mode']='source-reviewed'
    corpus['verification']=dict(review_complete=True,reviewed_events=len(reviews),registry_snapshots=len(corpus['trials']),product_identities=len(corpus['products']),original_html_verified=sum(e['original_verified'] for e in corpus['events']),method=manifest['method'],clinical_adjudication='No independent clinical adjudication')
    corpus['collection_notice']='Selected US FDA announcements, developer-reviewed against publisher text; not a complete approval history. Current registry snapshots are separate from event dates. Publisher proof excerpts are selective; original HTTP HTML bytes were not acquired.'
    for path,value in [(ROOT/'data/source-review-manifest.json',manifest),(ROOT/'data/corpus.json',corpus),(ROOT/'reports/source-review-validation.json',dict(**corpus['verification'],quote_budget='At most 25 copied publisher words per announcement',frozen_seed_changed=False))]:
        path.write_text(json.dumps(value,indent=2,ensure_ascii=False),encoding='utf-8',newline='\n')
    print(json.dumps(corpus['verification']))
    return corpus


if __name__=='__main__':apply()
