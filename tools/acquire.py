"""Acquire original publisher bytes. Failures are recorded, never replaced by fixtures."""
import argparse
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parents[1]


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    seed = json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))
    sources = [('fda-announcement', e['source_url']) for e in seed['events']]
    sources += [('clinicaltrials', f'https://clinicaltrials.gov/api/v2/studies/{nct}')
                for nct in sorted({n for e in seed['events'] for n in e['trial_ids']})]
    for brand in ['KEYTRUDA','OPDIVO','IMFINZI','TECENTRIQ','LIBTAYO']:
        sources.append(('drugsfda', f'https://api.fda.gov/drug/drugsfda.json?search=products.brand_name:{brand}&limit=100'))
    out=ROOT/'data/raw';out.mkdir(parents=True,exist_ok=True)
    manifest_path=ROOT/'data/source-manifest.json'
    existing={s['url']:s for s in json.loads(manifest_path.read_text(encoding='utf-8')).get('sources',[])} if manifest_path.exists() else {}
    receipts=[]; failures=[]
    session=requests.Session();session.headers['User-Agent']='SignalDeskAI/0.1 (public research portfolio)'
    for kind,url in sources:
        assert urlparse(url).hostname in ['www.fda.gov','api.fda.gov','clinicaltrials.gov']
        dest=out/(digest(url.encode())[:20]+('.html' if kind=='fda-announcement' else '.json'))
        previous=existing.get(url)
        if not args.refresh and previous and dest.exists() and digest(dest.read_bytes())==previous['sha256']:
            receipts.append(previous);continue
        try:
            response=session.get(url,timeout=45);response.raise_for_status()
            raw=response.content
            if kind=='fda-announcement' and b'<html' not in raw.lower(): raise ValueError('Expected original HTML')
            if kind!='fda-announcement': json.loads(raw)
            dest.write_bytes(raw)
            receipts.append({'url':url,'kind':kind,'path':dest.relative_to(ROOT).as_posix(),
                             'sha256':digest(raw),'bytes':len(raw),'retrieved_at':datetime.now(timezone.utc).isoformat()})
        except Exception as error:
            failures.append({'url':url,'error':str(error)})
        time.sleep(1)
    manifest={'schema_version':1,'sources':receipts,'failures':failures,'complete':not failures,
              'expected_sources':len(sources),'period_start':seed['period_start'],'period_end':seed['period_end']}
    manifest_path.write_text(json.dumps(manifest,indent=2),encoding='utf-8',newline='\n')
    print(json.dumps({'acquired':len(receipts),'failed':len(failures),'complete':not failures}))
    if failures: raise SystemExit(1)


if __name__=='__main__':main()
