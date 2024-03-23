import hashlib
import json
import os
import sqlite3
import shutil
from pathlib import Path

import pytest
from tools.build_corpus import parse_html
from tools import build_corpus

ROOT=Path(__file__).resolve().parents[2]

def test_parser_ignores_navigation_and_scripts():
    html=b'<html><nav>wrong</nav><main><h1>Approval</h1><p>On August 15, 2024, FDA approved <strong>durvalumab</strong>.</p><script>ignore</script></main></html>'
    assert parse_html(html)==['Approval','On August 15, 2024, FDA approved durvalumab.']

def test_parser_refuses_changed_page_shape():
    with pytest.raises(ValueError):parse_html(b'<html>Access denied</html>')


def test_explicit_seed_build_without_raw_artifact(tmp_path,monkeypatch):
    (tmp_path/'data').mkdir();(tmp_path/'sql').mkdir()
    for path in ['data/seed-events.json','data/source-manifest.json','sql/quality.sql']:shutil.copyfile(ROOT/path,tmp_path/path)
    monkeypatch.setattr(build_corpus,'ROOT',tmp_path)
    corpus=build_corpus.build(seed_only=True)
    assert corpus['mode']=='browser-reviewed-seed'
    assert len(corpus['events'])==29
    assert not any(t['available'] for t in corpus['trials'])
    assert not any(p['identity_verified'] for p in corpus['products'])
    assert not any(e['is_original_excerpt'] for e in corpus['evidence'])

def test_seed_has_unique_real_source_identifiers():
    events=json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))['events']
    assert len(events)==len({e['id'] for e in events})==len({e['source_url'] for e in events})
    assert all(e['source_url'].startswith('https://www.fda.gov/drugs/') for e in events)
    assert all('2024-01-01'<=e['approval_date']<='2026-10-17' for e in events)

def test_corpus_never_marks_unacquired_trial_as_available():
    corpus=json.loads((ROOT/'data/corpus.json').read_text(encoding='utf-8'))
    for t in corpus['trials']:
        if t['available']:assert t.get('sha256') and t['snapshot_at']
        else:assert not t.get('status')
    for e in corpus['events']:
        if e['original_verified']:assert e['source_sha256']

def test_atomic_quota_limit():
    db=sqlite3.connect(':memory:')
    for migration in sorted((ROOT/'drizzle').glob('*.sql')):db.executescript(migration.read_text(encoding='utf-8'))
    sql='INSERT INTO quotas (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count'
    assert db.execute(sql,['global',100,2]).fetchone()==(1,)
    assert db.execute(sql,['global',100,2]).fetchone()==(2,)
    assert db.execute(sql,['global',100,2]).fetchone() is None

def test_available_records_match_acquisition_receipts():
    corpus=json.loads((ROOT/'data/corpus.json').read_text(encoding='utf-8'))
    manifest=ROOT/'data/source-manifest.json'
    sources={s['url']:s for s in json.loads(manifest.read_text(encoding='utf-8'))['sources']} if manifest.exists() else {}
    for trial in corpus['trials']:
        if trial['available']:
            receipt=sources[trial['api_url']]
            assert receipt['kind']=='clinicaltrials'
            assert trial['sha256']==receipt['sha256']
            assert trial['snapshot_at']==receipt['retrieved_at']
    for product in corpus['products']:
        if product.get('identity_verified'):
            assert sources[product['identity_source_url']]['kind']=='drugsfda'
            assert product['application_numbers']


def test_original_checksums_when_acquired():
    manifest=ROOT/'data/source-manifest.json'
    if not manifest.exists():pytest.skip('Original acquisition has not run')
    sources=json.loads(manifest.read_text(encoding='utf-8'))['sources']
    if sources and not any((ROOT/s['path']).exists() for s in sources):
        if os.environ.get('SIGNALDESK_REQUIRE_RAW')=='1':pytest.fail('Required original-byte artifact is missing')
        pytest.skip('Original bytes are retained in the acquisition artifact, not the source checkout')
    for s in sources:
        assert hashlib.sha256((ROOT/s['path']).read_bytes()).hexdigest()==s['sha256']
