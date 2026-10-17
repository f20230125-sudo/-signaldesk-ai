import type {Model,ModelInput,ModelReply} from './types.ts';
import {TOOL_SCHEMA} from './tools.ts';

export class ProviderError extends Error {status:number;constructor(message:string,status=503){super(message);this.status=status;}}
export function geminiModel(key:string,name='gemini-3.5-flash-lite',fetcher:typeof fetch=fetch):Model{
  if(!key)throw new ProviderError('Live AI is not configured. A server-side free-tier Gemini key is required.');
  if(!/^[a-zA-Z0-9._-]+$/.test(name))throw new ProviderError('Invalid model configuration');
  return {name,async generate(input:ModelInput,signal:AbortSignal):Promise<ModelReply>{
    const prompt=[input.question,...input.history.map(m=>`${m.role}: ${m.content}`)].join('\n\n');
    const body={systemInstruction:{parts:[{text:input.system}]},contents:[{role:'user',parts:[{text:prompt}]}],
      tools:input.finalOnly?undefined:[{functionDeclarations:TOOL_SCHEMA}],
      generationConfig:{temperature:0,maxOutputTokens:2400,...(input.finalOnly?{responseMimeType:'application/json'}:{})}};
    const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`,{
      method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});
    if(!response.ok)throw new ProviderError(response.status===429?'The free model allowance is currently exhausted. Please try again later.':`Model service unavailable (${response.status}).`,response.status===429?429:503);
    const raw=await response.json() as {candidates?:{content?:{parts?:{text?:string;functionCall?:{name:string;args:Record<string,unknown>}}[]}}[];usageMetadata?:{promptTokenCount?:number;candidatesTokenCount?:number}};
    const parts=raw.candidates?.[0]?.content?.parts??[];
    const calls=parts.flatMap(p=>p.functionCall?[{name:p.functionCall.name,arguments:p.functionCall.args??{}}]:[]);
    const text=parts.map(p=>p.text??'').join('').trim();
    let draft; if(text&&!calls.length){try{draft=JSON.parse(text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw new ProviderError('The model returned an invalid brief. No unverified answer was published.');}}
    if(!calls.length&&!draft)throw new ProviderError('The model returned no usable answer.');
    return {calls:calls as ModelReply['calls'],draft,input_tokens:raw.usageMetadata?.promptTokenCount??0,output_tokens:raw.usageMetadata?.candidatesTokenCount??0};
  }};
}
