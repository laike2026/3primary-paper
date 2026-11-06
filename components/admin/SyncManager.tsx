'use client';

import {useCallback, useEffect, useState} from 'react';
import {AdminIcon} from './AdminIcon';
import {displayStatus} from '@/lib/admin/presentation';

type Job = {
  id: string; job_type: string; status: string; attempt: number; max_attempts: number;
  last_error: string; created_at: string; available_at: string; finished_at: string | null;
  payload: {day?: string; id?: string; result?: {rowCount?: number; urlCount?: number; deliveryId?: string}};
};
type Summary = {last_search_sync: string; last_submission: string; open: number; exhausted: number};
type Receipt = {
  verified: boolean; permissionLevel?: string; siteUrl: string; checkedAt: string;
  sitemap: {isPending?: boolean; lastSubmitted?: string; lastDownloaded?: string; errors?: string; warnings?: string} | null;
  urls: {url: string; error?: string; index: {
    verdict?: string; coverageState?: string; lastCrawlTime?: string; googleCanonical?: string;
  } | null}[];
};

const date = (value?: string | null) => value
  ? new Date(value).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})
  : '—';

const jobName: Record<string, string> = {
  gsc_day: '搜索数据同步', sitemap_submit: '站点地图提交', notify_inquiry: '询盘邮件通知',
};

function jobResult(job: Job) {
  if (job.status === 'failed') {
    const status = job.last_error.match(/(?:HTTP|OAuth) (\d{3})/)?.[1];
    const reason = status ? '服务返回 ' + status : '处理失败';
    return job.attempt >= job.max_attempts ? reason + '，已达重试上限' : reason + '，下次 ' + date(job.available_at);
  }
  if (job.status !== 'succeeded') return job.status === 'pending' ? '等待执行' : '—';
  const result = job.payload?.result;
  if (result?.deliveryId) return '发信服务已受理';
  if (typeof result?.urlCount === 'number') return 'Google API 已接受 · ' + result.urlCount + ' 个 URL';
  if (typeof result?.rowCount === 'number') return '已同步 · ' + result.rowCount + ' 条明细';
  return '处理完成';
}

export function SyncManager({canRun}: {canRun: boolean}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>();
  const [ready, setReady] = useState<{gsc: boolean; mail: boolean; submission: boolean}>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [receipt, setReceipt] = useState<Receipt>();
  const [receiptError, setReceiptError] = useState('');
  const [receiptBusy, setReceiptBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/sync?page=' + page, {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '无法读取同步记录');
      setJobs(data.items);
      setTotal(data.total);
      setSummary(data.summary);
      setReady(data.ready);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '加载失败');
    }
  }, [page]);

  useEffect(() => {void Promise.resolve().then(load);}, [load]);

  async function readReceipt() {
    setReceiptBusy(true);
    setReceiptError('');
    setReceipt(undefined);
    try {
      const response = await fetch('/api/admin/sync/search-console', {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReceipt(data);
    } catch (cause) {
      setReceiptError(cause instanceof Error ? cause.message : '无法读取 Google 回执');
    } finally {
      setReceiptBusy(false);
    }
  }

  async function run(kind: string, id?: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/sync', {method: 'POST',
        headers: {'content-type': 'application/json'}, body: JSON.stringify({kind, id})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '无法启动任务');
      await load();
      if (data.jobs?.some((job: {status: string}) => job.status === 'failed')) {
        setError('本次有任务失败，请查看下方的状态和重试时间。');
      } else if (kind === 'retry') {
        setNotice('任务已重新排队，等待下一次同步。');
      } else if (data.jobs?.length) {
        setNotice('本次已执行 ' + data.jobs.length + ' 个任务。');
      } else {
        setNotice(data.added ? '任务已排队。' : '当前没有到期的新任务。');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法启动任务');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="admin-page-heading"><div><small>网站资源</small><h1>数据同步</h1></div>
      <button className="admin-secondary" onClick={() => void load()}><AdminIcon name="refresh"/>刷新队列</button>
    </div>
    <section className="admin-panel" aria-label="任务状态">
      <h2><AdminIcon name="sync"/>同步概况</h2>
      <dl className="sync-overview">
        <div><dt>待处理 / 等待重试</dt><dd>{summary?.open ?? '—'}</dd></div>
        <div><dt>达到重试上限</dt><dd>{summary?.exhausted ?? '—'}</dd></div>
        <div><dt>最近搜索数据同步</dt><dd>{date(summary?.last_search_sync)}</dd></div>
        <div><dt>最近提交获 API 接受</dt><dd>{date(summary?.last_submission)}</dd></div>
      </dl>
      {ready && !ready.mail && <p className="admin-error"><AdminIcon name="warning"/>发信服务待配置。新询盘仍保存在询盘管理，邮件等待处理。</p>}
      {canRun && <div className="admin-toolbar">
        <button className="admin-primary" disabled={busy || !ready?.gsc} onClick={() => void run('gsc')}><AdminIcon name="sync"/>同步搜索数据</button>
        <button className="admin-secondary" disabled={busy || !ready?.gsc || !ready.submission} onClick={() => void run('sitemap')}><AdminIcon name="upload"/>提交站点地图</button>
        <button className="admin-secondary" disabled={busy || !ready?.mail} onClick={() => void run('notification')}><AdminIcon name="mail"/>处理待发邮件</button>
      </div>}
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><h2><AdminIcon name="search"/>Google 回执</h2>
        <button className="admin-secondary" disabled={receiptBusy || !ready?.gsc}
          onClick={() => void readReceipt()}>{receiptBusy ? '读取中…' : '读取 Google 状态'}</button>
      </div>
      <p>API 接受提交、Google 读取站点地图、页面收录分别显示。</p>
      {ready && !ready.gsc && <p>Search Console 待配置。</p>}
      {receiptError && <p className="admin-error" role="alert">{receiptError}</p>}
      {receipt && <>
        <p className="admin-stat-note">{receipt.siteUrl} · {receipt.verified ? '属性可访问' : '属性未验证'} · 检查时间 {date(receipt.checkedAt)}</p>
        {receipt.verified && <>
          <dl className="sync-overview">
            <div><dt>Google 记录的提交</dt><dd>{date(receipt.sitemap?.lastSubmitted)}</dd></div>
            <div><dt>Google 最后读取</dt><dd>{date(receipt.sitemap?.lastDownloaded)}</dd></div>
            <div><dt>站点地图状态</dt><dd>{!receipt.sitemap ? '尚无回执' : receipt.sitemap.isPending ? '等待处理' : receipt.sitemap.lastDownloaded ? '已读取' : '已登记，等待读取'}</dd></div>
            <div><dt>错误 / 警告</dt><dd>{receipt.sitemap ? (receipt.sitemap.errors ?? '0') + ' / ' + (receipt.sitemap.warnings ?? '0') : '—'}</dd></div>
          </dl>
          <ul className="sync-inspections">{receipt.urls.map(({url, index, error}) => <li key={url}>
            <strong>{new URL(url).pathname}</strong>
            <span>{error || (index ? (index.coverageState || index.verdict || '暂无索引状态') : '暂无索引状态')}</span>
            {index?.lastCrawlTime && <small>上次抓取 {date(index.lastCrawlTime)}</small>}
            {index?.googleCanonical && <small>Google 选定的规范 URL {index.googleCanonical}</small>}
          </li>)}</ul>
        </>}
      </>}
    </section>
    {error && <p className="admin-error" role="alert"><AdminIcon name="warning"/>{error}</p>}
    {notice && <p className="admin-success" role="status">{notice}</p>}
    <div className="admin-table-wrap admin-card-wrap"><table className="admin-table admin-card-table">
      <thead><tr><th>创建时间</th><th>任务</th><th>状态</th><th>尝试</th><th>结果</th></tr></thead>
      <tbody>{jobs.map((job) => <tr key={job.id}>
        <td data-label="创建时间">{date(job.created_at)}</td>
        <td data-label="任务"><strong>{jobName[job.job_type] || '网站任务'}</strong>
          {(job.payload?.day || job.payload?.id) && <small className="admin-cell-note">{job.payload.day || job.payload.id}</small>}
        </td>
        <td data-label="状态"><span className="admin-pill" data-status={job.status}>{displayStatus(job.status)}</span></td>
        <td data-label="尝试">{job.attempt} / {job.max_attempts}</td>
        <td data-label="结果"><div>{jobResult(job)}
          {canRun && job.status === 'failed' && job.attempt >= job.max_attempts &&
            <button disabled={busy} onClick={() => void run('retry', job.id)}>重新排队</button>}
        </div></td>
      </tr>)}</tbody>
    </table>{!jobs.length && <div className="admin-empty"><AdminIcon name="sync"/>暂无同步记录</div>}</div>
    <div className="admin-pager"><span>共 {total} 条</span>
      <button disabled={page === 1} onClick={() => setPage(page - 1)}><AdminIcon name="chevronLeft"/>上一页</button>
      <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>下一页<AdminIcon name="chevronRight"/></button>
    </div>
  </>;
}
