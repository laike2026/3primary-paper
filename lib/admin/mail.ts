import 'server-only';
import {site} from '@/lib/site';

function mailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();
  const address = from?.match(/<([^<>]+)>$/)?.[1] || from;
  if (!apiKey || !from || !address || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address)) return null;
  return {apiKey, from};
}

export function isMailConfigured() {
  return Boolean(mailConfig());
}

// The recipient is the confirmed business address shared by the site's public contact points.
export const inquiryRecipient = site.email;

export async function sendTransactionalMail(
  input: {to: string; subject: string; text: string},
  idempotencyKey: string,
): Promise<string> {
  const config = mailConfig();
  if (!config) throw new Error('发信服务未配置');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify({from: config.from, to: [input.to], subject: input.subject, text: input.text}),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`邮件服务返回 HTTP ${response.status}`);
  const result = (await response.json()) as {id?: string};
  if (!result.id) throw new Error('邮件服务未返回受理编号');
  return result.id;
}
