import {NextResponse} from 'next/server';
import {db} from '@/lib/admin/db';
export const runtime='nodejs';
export async function GET(){
  if(!process.env.DATABASE_URL)return NextResponse.json({ok:false,database:'unconfigured'},{status:503,headers:{'Cache-Control':'no-store'}});
  try{await db().query('SELECT 1');return NextResponse.json({ok:true,database:'connected'},{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({ok:false,database:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
