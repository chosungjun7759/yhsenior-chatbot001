import { get, list } from '@vercel/blob';

/**
 * 답하지 못한 질문 목록 보기 (관리자용)
 *   /api/unanswered?key=관리자키              → 전체
 *   /api/unanswered?key=관리자키&month=2026-10 → 해당 월만
 *   &format=json                               → JSON
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return new Response('ADMIN_KEY가 설정되지 않았습니다.', { status: 503 });
  if (url.searchParams.get('key') !== adminKey) return new Response('권한이 없습니다.', { status: 401 });

  const month = url.searchParams.get('month');
  const prefix = /^\d{4}-\d{2}$/.test(month ?? '') ? `unanswered/${month}/` : 'unanswered/';

  const pathnames: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    pathnames.push(...page.blobs.map(b => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const items = (
    await Promise.all(
      pathnames.map(async p => {
        const res = await get(p, { access: 'private' });
        if (!res || res.statusCode !== 200) return null;
        return JSON.parse(await new Response(res.stream).text()) as { t: string; q: string };
      }),
    )
  )
    .filter((x): x is { t: string; q: string } => x !== null)
    .sort((a, b) => b.t.localeCompare(a.t));

  // 같은 질문(띄어쓰기 무시)은 묶어서 횟수 표시
  const groups = new Map<string, { q: string; count: number; last: string }>();
  for (const it of items) {
    const k = it.q.replace(/\s/g, '');
    const g = groups.get(k);
    if (g) g.count++;
    else groups.set(k, { q: it.q, count: 1, last: it.t });
  }
  const grouped = [...groups.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last));

  if (url.searchParams.get('format') === 'json') {
    return Response.json({ total: items.length, grouped });
  }

  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const rows = grouped.map(g => `<tr><td>${g.count}</td><td>${esc(g.q)}</td><td>${g.last}</td></tr>`).join('');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>답하지 못한 질문</title>
<style>body{font-family:sans-serif;margin:16px;color:#222}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:15px}th{background:#1E90FF;color:#fff}td:first-child,td:last-child{text-align:center;white-space:nowrap}</style>
</head><body><h2>챗봇이 답하지 못한 질문 ${month ? `(${esc(month)})` : '(전체)'}</h2>
<p>총 ${items.length}건 · 같은 질문은 묶어서 표시</p>
<table><thead><tr><th>횟수</th><th>질문</th><th>마지막</th></tr></thead><tbody>${rows || '<tr><td colspan="3">아직 없습니다.</td></tr>'}</tbody></table>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
