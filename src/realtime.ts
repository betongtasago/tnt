import {createClient} from '@supabase/supabase-js';

const url=String(import.meta.env.VITE_SUPABASE_URL||'').trim();
const key=String(import.meta.env.VITE_SUPABASE_ANON_KEY||'').trim();
const client=url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;

export function subscribeFleetChanges(onChange:()=>void){
  if(!client)return()=>{};
  const channel=client.channel('tnt-fleet-state-sync').on('broadcast',{event:'state_updated'},()=>onChange()).subscribe();
  return()=>{void client.removeChannel(channel);};
}
