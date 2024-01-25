"""Build evidence corpus and SQL warehouse from checked original sources or explicit seed mode."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

import duckdb

ROOT=Path(__file__).resolve().parents[1]
PRODUCTS=[
    ('keytruda','KEYTRUDA','pembrolizumab','Merck & Co. / MSD','intravenous'),
    ('keytruda-qlex','KEYTRUDA QLEX','pembrolizumab and berahyaluronidase alfa-pmph','Merck & Co. / MSD','subcutaneous'),
    ('opdivo','OPDIVO','nivolumab','Bristol Myers Squibb','intravenous'),
    ('opdivo-qvantig','OPDIVO QVANTIG','nivolumab and hyaluronidase-nvhy','Bristol Myers Squibb','subcutaneous'),
    ('imfinzi','IMFINZI','durvalumab','AstraZeneca','intravenous'),
    ('tecentriq','TECENTRIQ','atezolizumab','Genentech / Roche','intravenous'),
    ('tecentriq-hybreza','TECENTRIQ HYBREZA','atezolizumab and hyaluronidase-tqjs','Genentech / Roche','subcutaneous'),
    ('libtayo','LIBTAYO','cemiplimab-rwlc','Regeneron','intravenous')]


class Paragraphs(HTMLParser):
    def __init__(self):
        super().__init__();self.main=0;self.capture=0;self.skip=0;self.buffer=[];self.paragraphs=[]
    def handle_starttag(self,tag,attrs):
        if tag=='main':self.main+=1
        if tag in ('script','style','nav','footer'):self.skip+=1
        if self.main and not self.skip and tag in ('p','h1','h2','h3','li'):
            if self.buffer:self.flush()
            self.capture+=1
    def handle_endtag(self,tag):
        if tag in ('p','h1','h2','h3','li') and self.capture:self.flush();self.capture=max(0,self.capture-1)
        if tag in ('script','style','nav','footer'):self.skip=max(0,self.skip-1)
        if tag=='main':self.main=max(0,self.main-1)
    def handle_data(self,data):
        if self.capture and not self.skip:self.buffer.append(data)
    def flush(self):
        value=re.sub(r'\s+',' ',''.join(self.buffer)).strip();self.buffer=[]
        if value:self.paragraphs.append(value)


def parse_html(raw):
    parser=Paragraphs();parser.feed(raw.decode('utf-8',errors='replace'));parser.flush()
    if not parser.paragraphs:raise ValueError('FDA main content was not found; source format changed')
    return parser.paragraphs


def build(seed_only=False):
    seed=json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))
    mp=ROOT/'data/source-manifest.json'
    manifest=json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {'sources':[],'complete':False}
    by_url={s['url']:s for s in manifest['sources']}
    if not seed_only and not manifest.get('complete'):raise ValueError('Complete original acquisition is required; seed mode must be explicit')
    events=[];evidence=[];trials=[];checks=[]
    for e in seed['events']:
        src=by_url.get(e['source_url']);paragraphs=[];verified=False
        if src:
            raw=(ROOT/src['path']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=src['sha256']:raise ValueError('Source checksum mismatch: '+e['id'])
            paragraphs=parse_html(raw)
            body=' '.join(paragraphs)
            date=datetime.strptime(e['approval_date'],'%Y-%m-%d')
            pattern=rf'{date.strftime("%B")}\s+0?{date.day},\s*{date.year}'
            date_ok=bool(re.search(pattern,body,re.I))
            missing=[n for n in e['trial_ids'] if n not in body]
            checks.append({'event_id':e['id'],'approval_date_present':date_ok,'missing_nct_ids':missing})
            if not date_ok or missing:raise ValueError('Seed/source discrepancy: '+json.dumps(checks[-1]))
            verified=True
        elif not seed_only:raise ValueError('Missing source for '+e['id'])
        eid=e['id']
        evidence_ids=[]
        for i,text in enumerate(paragraphs or [e['population_summary'],*e['evidence_notes']]):
            pid=f'{eid}:p{i+1:03d}';evidence_ids.append(pid)
            evidence.append({'id':pid,'event_id':eid,'text':text,'source_url':e['source_url'],
                             'is_original_excerpt':verified,'source_sha256':src['sha256'] if src else None})
        events.append({**e,'evidence_ids':evidence_ids,'original_verified':verified,
                       'source_sha256':src['sha256'] if src else None})
    for nct in sorted({n for e in events for n in e['trial_ids']}):
        url=f'https://clinicaltrials.gov/api/v2/studies/{nct}';src=by_url.get(url)
        record={'id':nct,'source_url':f'https://clinicaltrials.gov/study/{nct}',
                'api_url':url,'linked_event_ids':[e['id'] for e in events if nct in e['trial_ids']],
                'available':False,'snapshot_at':None}
        if src:
            raw=(ROOT/src['path']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=src['sha256']:raise ValueError('Trial checksum mismatch')
            data=json.loads(raw).get('protocolSection',{})
            if data.get('identificationModule',{}).get('nctId')!=nct:raise ValueError('Trial identity mismatch')
            record.update({'available':True,'snapshot_at':src['retrieved_at'],'sha256':src['sha256'],
                           'title':data.get('identificationModule',{}).get('briefTitle'),
                           'status':data.get('statusModule',{}).get('overallStatus'),
                           'last_update_posted':data.get('statusModule',{}).get('lastUpdatePostDateStruct',{}).get('date'),
                           'phase':data.get('designModule',{}).get('phases',[]),
                           'conditions':data.get('conditionsModule',{}).get('conditions',[]),
                           'enrollment':data.get('designModule',{}).get('enrollmentInfo',{}),
                           'sponsor':data.get('sponsorCollaboratorsModule',{}).get('leadSponsor',{}).get('name')})
        trials.append(record)
    products=[dict(zip(['id','name','ingredient','company','route'],p)) for p in PRODUCTS]
    metadata=[]
    for source in manifest['sources']:
        if source['kind']!='drugsfda':continue
        raw=(ROOT/source['path']).read_bytes()
        if hashlib.sha256(raw).hexdigest()!=source['sha256']:raise ValueError('Drugs@FDA checksum mismatch')
        for application in json.loads(raw).get('results',[]):
            for product in application.get('products',[]):
                metadata.append({'brand':re.sub(r'\s+',' ',product.get('brand_name','')).strip().upper(),
                                 'application':application.get('application_number'),
                                 'ingredients':[i.get('name','') for i in product.get('active_ingredients',[])],
                                 'url':source['url']})
    for product in products:
        matches=[m for m in metadata if m['brand']==product['name']]
        product['identity_verified']=bool(matches)
        product['application_numbers']=sorted({m['application'] for m in matches if m['application']})
        product['identity_source_url']=matches[0]['url'] if matches else None
        product['fda_ingredient_names']=sorted({i for m in matches for i in m['ingredients']})
    known={p['id'] for p in products}
    if any(p not in known for e in events for p in e['product_ids']):raise ValueError('Unknown product identity in seed')
    corpus={'schema_version':1,'cutoff':seed['period_end'],'period_start':seed['period_start'],
            'mode':'original-sources' if manifest.get('complete') and all(e['original_verified'] for e in events) else 'browser-reviewed-seed',
            'collection_notice':'Selected FDA announcements; not a complete approval history. Current trial snapshots are separate from event dates.',
            'products':products,'events':events,'evidence':evidence,'trials':trials,
            'acquisition':{'expected':manifest.get('expected_sources',0),'acquired':len(manifest['sources']),
                           'complete':bool(manifest.get('complete'))}}
    (ROOT/'data/corpus.json').write_text(json.dumps(corpus,indent=2,ensure_ascii=False),encoding='utf-8',newline='\n')
    out=ROOT/'reports';out.mkdir(exist_ok=True)
    (out/'source-validation.json').write_text(json.dumps({'events':len(events),'trials':len(trials),
        'original_events_verified':sum(e['original_verified'] for e in events),'product_identities_verified':sum(p['identity_verified'] for p in products),'checks':checks,'mode':corpus['mode']},indent=2),encoding='utf-8',newline='\n')
    warehouse=ROOT/'data/warehouse';warehouse.mkdir(exist_ok=True)
    con=duckdb.connect(str(warehouse/'signaldesk.duckdb'))
    for name,rows in [('events',events),('trials',trials),('products',products),('evidence',evidence)]:
        path=warehouse/f'{name}.json';path.write_text(json.dumps(rows),encoding='utf-8',newline='\n')
        con.execute(f"CREATE OR REPLACE TABLE {name} AS SELECT * FROM read_json_auto(?)",[str(path)])
    quality=con.execute((ROOT/'sql/quality.sql').read_text(encoding='utf-8')).fetchall()
    if any(not passed for _,passed in quality):raise ValueError('SQL quality failure: '+str(quality))
    (out/'data-quality.json').write_text(json.dumps([{'check':name,'passed':passed} for name,passed in quality],indent=2),encoding='utf-8',newline='\n')
    con.close()
    print(json.dumps({'events':len(events),'trials':len(trials),'evidence_passages':len(evidence),'mode':corpus['mode']}))
    return corpus


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--seed-only',action='store_true');build(p.parse_args().seed_only)
