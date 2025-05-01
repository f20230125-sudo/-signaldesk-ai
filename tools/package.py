"""Package explicit public project assets; omit secrets, private runs and dependencies."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
directories=['app','lib','db','data/evaluation','data/source-text','docs','tests','tools','.github','public','build','scripts','.openai','components','hooks','vendor','drizzle','sql']
files=[p for name in directories for p in (ROOT/name).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
files += [ROOT/n for n in ['README.md','LICENSE','package.json','package-lock.json','pyproject.toml','tsconfig.json','vite.config.ts','cloudflare-env.d.ts','.gitignore','.gitattributes','.npmrc','.env.example','components.json','drizzle.config.ts','next.config.ts','postcss.config.mjs','eslint.config.mjs','data/corpus.json','data/seed-events.json','data/source-manifest.json','data/source-review-manifest.json'] if (ROOT/n).exists()]
files += [p for p in (ROOT/'reports').glob('*.json') if p.name!='package-receipt.json']
archive=ROOT.parent/'SignalDesk-AI-Portfolio.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,strict_timestamps=False) as z:
    for p in sorted(set(files)):z.write(p,'signaldesk-ai/'+p.relative_to(ROOT).as_posix())
receipt={'file':archive.name,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size,'public_files':len(set(files))}
(ROOT/'reports/package-receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8',newline='\n')
print(json.dumps(receipt,indent=2))
