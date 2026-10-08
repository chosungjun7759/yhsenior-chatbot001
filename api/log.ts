import { put } from '@vercel/blob';

const MAX_LENGTH = 200;

/** 저장 전에 개인정보로 보이는 부분을 가립니다. */
export function maskPersonalInfo(text: string): string {
  return text
    .replace(/\d{6}\s*[-–]?\s*[1-8]\d{6}/g, '[주민번호]')
    .replace(/0\d{1,2}[\s\-.)]*\d{3,4}[\s\-.]*\d{4}/g, '[전화번호]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[이메일]')
    .replace(/\d{7,}/g, '[숫자]');
}

/** 챗봇이 답하지 못한 질문 1건 저장 (개인정보는 가린 뒤 저장) */
export async function POST(request: Request) {
  let question = '';
  try {
    const body = await request.json();
    question = typeof body?.q === 'string' ? body.q : '';
  } catch {
    return new Response('bad request', { status: 400 });
  }

  question = maskPersonalInfo(question.trim()).slice(0, MAX_LENGTH);
  if (!question) return new Response('empty', { status: 400 });

  // 한국 시간 기준 날짜로 월별 폴더에 저장
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
  await put(`unanswered/${kst.slice(0, 7)}/${kst.slice(0, 19).replace(/:/g, '')}.json`, JSON.stringify({ t: kst.slice(0, 16), q: question }), {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/json',
  });

  return new Response(null, { status: 204 });
}
