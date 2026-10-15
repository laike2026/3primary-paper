import {NextRequest,NextResponse} from 'next/server';
import {currentAdmin,revokeSession,audit} from '@/lib/admin/auth';
import {jsonError,sameOrigin} from '@/lib/admin/http';
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return jsonError('请求来源无效',403);
  const user=await currentAdmin();await revokeSession();
  if(user)await audit(user.id,'logout','admin_user',user.id);
  return NextResponse.json({ok:true});
}
