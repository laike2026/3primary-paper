import {NextRequest,NextResponse} from 'next/server';
import {can,currentAdmin,type Permission} from './auth';

export function sameOrigin(request: NextRequest) {
  const origin=request.headers.get('origin');
  return Boolean(origin && origin===request.nextUrl.origin);
}
export async function guard(permission: Permission) {
  const user=await currentAdmin();
  if(!user) return {user:null,response:NextResponse.json({error:'请先登录'},{status:401})};
  if(!can(user.role,permission)) return {user:null,response:NextResponse.json({error:'没有操作权限'},{status:403})};
  return {user,response:null};
}
export function jsonError(message:string,status=400) {return NextResponse.json({error:message},{status});}
