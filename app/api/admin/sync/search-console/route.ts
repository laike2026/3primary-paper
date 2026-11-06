import {NextResponse} from 'next/server';
import {guard, jsonError} from '@/lib/admin/http';
import {isSearchConsoleConfigured, searchConsoleReceipt} from '@/lib/admin/search-console';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const auth = await guard('sync:read');
  if (auth.response) return auth.response;
  if (!isSearchConsoleConfigured()) return jsonError('Search Console 尚未配置', 503);
  try {
    return NextResponse.json(await searchConsoleReceipt(), {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    const status = error instanceof Error ? error.message.match(/HTTP (\d{3})$/)?.[1] : undefined;
    return jsonError(status ? 'Google 暂未返回回执，HTTP ' + status : '无法读取 Google 回执，请检查属性权限或稍后重试', 502);
  }
}
