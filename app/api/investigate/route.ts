import {hosting} from '@/lib/hosting';
import {handleInvestigation} from '@/lib/investigation-endpoint';

export const maxDuration=90;
export async function POST(request:Request){
  try{return await handleInvestigation(request,hosting());}
  catch{return Response.json({status:'unavailable',error:'Live investigations are currently unavailable.'},{status:503,headers:{'cache-control':'no-store'}});}
}
