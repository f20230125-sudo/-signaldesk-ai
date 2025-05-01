import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {verifiedSourceCorpus} from '../lib/source-status.ts';
import type {Corpus} from '../lib/types.ts';
const corpus=JSON.parse(fs.readFileSync('data/corpus.json','utf8')) as Corpus;
test('Source eligibility rejects missing reviews without confusing HTML acquisition',()=>{
 assert(verifiedSourceCorpus(corpus));
 assert.equal(corpus.acquisition.complete,false);
 assert.equal(corpus.verification?.original_html_verified,0);
 const incomplete=structuredClone(corpus);incomplete.events[0].source_reviewed=false;
 assert.equal(verifiedSourceCorpus(incomplete),false);
 assert.equal(verifiedSourceCorpus({...corpus,mode:'browser-reviewed-seed'}),false);
});
