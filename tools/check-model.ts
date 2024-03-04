import fs from 'node:fs';

const key=process.env.GEMINI_API_KEY;
const model=process.env.GEMINI_MODEL??'gemini-3.5-flash-lite';
if(!key)throw new Error('GEMINI_API_KEY is missing from secure environment settings.');
if(!/^[a-zA-Z0-9._-]+$/.test(model))throw new Error('Invalid model name');
const headers={'x-goog-api-key':key,'content-type':'application/json'};
const report:{checked_at:string;model:string;catalog_http?:number;listed?:boolean;generation_http?:number;usable?:boolean}={checked_at:new Date().toISOString(),model};
try{
  const catalog=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers,signal:AbortSignal.timeout(30000)});
  report.catalog_http=catalog.status;
  if(!catalog.ok)throw new Error(`Model catalog request failed (HTTP ${catalog.status}); check the key's project and API permissions.`);
  const data=await catalog.json() as {models?:{name:string;supportedGenerationMethods?:string[]}[]};
  report.listed=!!data.models?.some(m=>m.name===`models/${model}`&&m.supportedGenerationMethods?.includes('generateContent'));
  if(!report.listed)throw new Error('The configured model is absent from the model catalog available to this key.');
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers,signal:AbortSignal.timeout(45000),body:JSON.stringify({contents:[{role:'user',parts:[{text:'Return only the JSON object {"ok":true}.'}]}],generationConfig:{responseMimeType:'application/json',maxOutputTokens:512}})});
  report.generation_http=response.status;
  if(!response.ok)throw new Error(`Model access check failed (HTTP ${response.status}). No benchmark calls were started.`);
  const result=await response.json() as {candidates?:{content?:{parts?:{text?:string;thought?:boolean}[]}}[]};
  const text=result.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text??'').join('')??'';
  try{report.usable=JSON.parse(text).ok===true;}catch{report.usable=false;}
  if(!report.usable)throw new Error('The model did not return the requested structured access-check response.');
  console.log(JSON.stringify(report));
}catch(error){console.error(error instanceof Error?error.message:'Model access check failed.');process.exitCode=1;}
finally{fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/model-access.json',JSON.stringify(report,null,2)+'\n');}
