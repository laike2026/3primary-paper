import 'server-only';
import {cookies} from 'next/headers';
import {createHash, randomBytes, scryptSync, timingSafeEqual, randomUUID} from 'node:crypto';
import {db} from './db';

export const COOKIE_NAME = 'primary_admin_session';
export const roles = ['superadmin','admin','editor','marketing','sales','analyst','viewer'] as const;
export type Role = typeof roles[number];
export type Permission = 'dashboard:read'|'content:read'|'content:write'|'content:publish'|'media:read'|'media:write'|'inquiries:read'|'inquiries:write'|'inquiries:export'|'analytics:read'|'seo:read'|'seo:write'|'sync:read'|'sync:run'|'users:read'|'users:write'|'settings:read'|'settings:write'|'audit:read';
const grants: Record<Role, Permission[]> = {
  superadmin:['dashboard:read','content:read','content:write','content:publish','media:read','media:write','inquiries:read','inquiries:write','inquiries:export','analytics:read','seo:read','seo:write','sync:read','sync:run','users:read','users:write','settings:read','settings:write','audit:read'],
  admin:['dashboard:read','content:read','content:write','content:publish','media:read','media:write','inquiries:read','inquiries:write','inquiries:export','analytics:read','seo:read','seo:write','sync:read','sync:run','users:read','users:write','settings:read','settings:write','audit:read'],
  editor:['dashboard:read','content:read','content:write','content:publish','media:read','media:write','seo:read'],
  marketing:['dashboard:read','content:read','content:write','media:read','media:write','analytics:read','seo:read','seo:write'],
  sales:['dashboard:read','inquiries:read','inquiries:write','inquiries:export'],
  analyst:['dashboard:read','analytics:read','seo:read','sync:read'],
  viewer:['dashboard:read','content:read','media:read','seo:read']
};
export function can(role: Role, permission: Permission) {return grants[role]?.includes(permission) || false;}

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  const [algorithm,salt,hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  const candidate = scryptSync(password,salt,64);
  return timingSafeEqual(candidate,Buffer.from(hash,'hex'));
}
export function tokenHash(token: string) {return createHash('sha256').update(token).digest('hex');}
export function constantEquals(a: string, b: string) {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah,bh);
}
export type AdminUser = {id:string;email:string;name:string;role:Role};

export async function currentAdmin(): Promise<AdminUser|null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !process.env.DATABASE_URL) return null;
  const rows = await db().query(`SELECT u.id,u.email,u.name,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.active=true LIMIT 1`,[tokenHash(token)]);
  return rows[0] as AdminUser || null;
}
export async function issueSession(userId: string, remember: boolean, userAgent='') {
  const token = randomBytes(32).toString('base64url');
  const maxAge = remember ? 60*60*24*30 : 60*60*12;
  await db().query('INSERT INTO admin_sessions(token_hash,user_id,expires_at,user_agent) VALUES($1,$2,now()+($3::int * interval \'1 second\'),$4)',[tokenHash(token),userId,maxAge,userAgent.slice(0,300)]);
  (await cookies()).set(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge});
}
export async function revokeSession() {
  const jar=await cookies();const token=jar.get(COOKIE_NAME)?.value;
  if(token && process.env.DATABASE_URL) await db().query('UPDATE admin_sessions SET revoked_at=now() WHERE token_hash=$1',[tokenHash(token)]);
  jar.delete(COOKIE_NAME);
}
export async function audit(actorId:string|null,action:string,entityType:string,entityId='',details:Record<string,unknown>={}) {
  await db().query('INSERT INTO admin_audit_log(actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)',[actorId,action,entityType,entityId,JSON.stringify(details)]);
}
export function newId() {return randomUUID();}
