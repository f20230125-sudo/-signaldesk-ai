import hashlib
import json
from pathlib import Path

import pytest
from tools.apply_source_reviews import checked_review

ROOT=Path(__file__).resolve().parents[2]

def test_review_receipts_match_saved_proof_and_frozen_fields():
    seed=json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))
    manifest=json.loads((ROOT/'data/source-review-manifest.json').read_text(encoding='utf-8'))
    receipts={row['event_id']:row for row in manifest['events']}
    for event in seed['events']:
        review,sha=checked_review(event,ROOT/receipts[event['id']]['path'])
        assert sha==receipts[event['id']]['sha256']
        assert not review.get('independent_clinical_adjudication',False)

def test_review_rejects_unresolved_fields_or_missing_trial_proof(tmp_path):
    event=json.loads((ROOT/'data/seed-events.json').read_text(encoding='utf-8'))['events'][0]
    review=json.loads((ROOT/'data/source-text'/f"{event['id']}.json").read_text(encoding='utf-8'))
    path=tmp_path/'review.json'
    review['field_checks']['qualifiers']=False
    path.write_text(json.dumps(review),encoding='utf-8')
    with pytest.raises(ValueError,match='Unresolved'):checked_review(event,path)
    review['field_checks']['qualifiers']=True
    review['paragraphs']=[text.replace(event['trial_ids'][0],'REMOVED') for text in review['paragraphs']]
    path.write_text(json.dumps(review),encoding='utf-8')
    with pytest.raises(ValueError,match='trial missing'):checked_review(event,path)
