import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const roots=['app','lib','tools','tests'];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const files=roots.flatMap(walk).filter(p=>/\.tsx?$/.test(p)&&!p.endsWith('.d.ts'));
const syntax=[];
for(const file of files){const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});syntax.push(...(result.diagnostics??[]));}
const core=['types','tools','retrieval','agent','model','quota','scoring'].map(n=>'lib/'+n+'.ts');
const program=ts.createProgram(core,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,allowImportingTsExtensions:true,skipLibCheck:true,types:[],lib:['lib.es2023.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts']});
const diagnostics=[...syntax,...ts.getPreEmitDiagnostics(program)];
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));process.exitCode=1;}
else console.log(JSON.stringify({syntax_files:files.length,strict_core_modules:core.length,result:'passed',full_framework_build:'requires complete installed dependencies'}));
