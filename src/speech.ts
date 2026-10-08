import type { Answer } from './answer';

/* ───────── 음성 인식 (말로 질문하기) ───────── */

// 브라우저마다 이름이 달라서 직접 타입을 적어 둠
export interface Recognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function createRecognizer(): Recognizer | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = 'ko-KR';
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  return r;
}

export const canListen = () =>
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

/* ───────── 음성 합성 (답변 읽어주기) ───────── */

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const CIRCLED = '①②③④⑤⑥⑦⑧⑨';

/** 화면용 글을 귀로 듣기 좋은 말로 바꿈 */
export function toSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|️|‍/gu, ' ')
    .replace(new RegExp(`[${CIRCLED}]`, 'g'), c => `${CIRCLED.indexOf(c) + 1}번, `)
    // 전화번호·계좌번호는 한 자리씩 끊어 읽기
    .replace(/\d{2,4}(?:-\d{3,6}){1,3}/g, n => n.split('-').map(part => part.split('').join(' ')).join(', '))
    // 09:15~10:15 → 9시 15분부터 10시 15분 / 13:30 → 오후 1시 30분
    .replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
      const hour = +h > 12 ? `오후 ${+h - 12}` : `${+h}`;
      return `${hour}시${m === '00' ? '' : ` ${+m}분`}`;
    })
    .replace(/~/g, '부터 ')
    .replace(/→/g, ', 다음으로 ')
    .replace(/\(/g, ', ')
    .replace(/\)/g, '')
    .replace(/[·/|※]/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/,(\s*,)+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();
}

export function answerToSpeech(answer: Answer): string {
  const parts = answer.lines.filter(Boolean).map(toSpeech);
  if (answer.table) {
    for (const row of answer.table.rows) {
      // 요일 한 글자면 "화요일"로
      const cells = row.map((c, i) => (i === 0 && /^[월화수목금]$/.test(c) ? `${c}요일` : c));
      parts.push(toSpeech(cells.join(', ')));
    }
  }
  return parts
    .filter(Boolean)
    .map(p => (/[.?!]$/.test(p) ? p : `${p}.`))
    .join(' ');
}

function koreanVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').toLowerCase().startsWith('ko'));
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** 여러 답변을 차례로 읽음. 끝나면 onEnd 호출 */
export function speak(answers: Answer[], onEnd?: () => void) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = koreanVoice();
  answers.forEach((a, i) => {
    const u = new SpeechSynthesisUtterance(answerToSpeech(a));
    u.lang = 'ko-KR';
    u.rate = 0.9; // 어르신용으로 조금 천천히
    if (voice) u.voice = voice;
    if (i === answers.length - 1 && onEnd) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    synth.speak(u);
  });
}

/** 아이폰은 버튼을 누른 순간에 한 번 말해 둬야 나중에 자동으로 읽어줄 수 있음 */
export function unlockSpeech() {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
}
