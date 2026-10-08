import { CENTER, FAQS, FLOORS, PROGRAMS, SCHEDULE_LABEL, SERVICES, TRANSPORT, WEEKDAYS, type Program, type Weekday } from './data';

/** 말풍선 하나에 들어갈 답변 */
export interface Answer {
  lines: string[];
  table?: { head: string[]; rows: string[][] };
  actions?: { label: string; href: string }[];
}

const telHref = `tel:${CENTER.tel.replace(/-/g, '')}`;
export const CALL_ACTION = { label: '📞 복지관에 전화 걸기', href: telHref };
const MAP_ACTION = { label: '📍 지도에서 위치 보기', href: CENTER.mapUrl };

const programTable = (list: Program[]) => ({
  head: ['요일', '프로그램', '시간', '장소'],
  rows: list.map(p => [p.day, p.name, p.time, p.place]),
});

export function scheduleAnswer(): Answer {
  return {
    lines: [`📅 전체 프로그램 시간표 (${SCHEDULE_LABEL})`],
    table: programTable(PROGRAMS),
  };
}

export function directionsAnswer(): Answer {
  return {
    lines: ['📍 오시는 길', CENTER.address, CENTER.parking],
    table: { head: ['정류장·역', '교통편'], rows: TRANSPORT.map(t => [t.how, t.detail]) },
    actions: [MAP_ACTION],
  };
}

export function floorsAnswer(): Answer {
  return {
    lines: ['🏢 층별 안내'],
    table: { head: ['층', '시설'], rows: FLOORS.map(f => [f.floor, f.rooms]) },
  };
}

/** 이용 시간 + 층별 안내 */
export function infoAnswer(): Answer {
  const hours = FAQS.find(f => f.id === 'hours')!;
  return { ...floorsAnswer(), lines: ['🏛️ 복지관 이용 안내', ...hours.lines, '', '🏢 층별 안내'] };
}

export function servicesAnswer(): Answer {
  return {
    lines: ['🌟 연희노인복지관이 하는 일', '궁금한 사업 이름을 입력해 주시면 자세히 알려 드려요.'],
    table: { head: ['사업', '내용'], rows: SERVICES.map(s => [s.name, s.desc]) },
  };
}

export function phoneAnswer(): Answer {
  return {
    lines: [`📞 복지관 전화번호: ${CENTER.tel}`, `📠 팩스: ${CENTER.fax}`, '아래 버튼을 누르시면 바로 전화가 걸려요.'],
    actions: [CALL_ACTION],
  };
}

export function faqAnswer(id: string): Answer {
  const f = FAQS.find(x => x.id === id)!;
  return { lines: [f.title, ...f.lines] };
}

export const DEFAULT_ANSWER: Answer = {
  lines: [
    '죄송해요, 그 내용은 제가 바로 안내해 드리기 어려워요. 😊',
    `복지관(${CENTER.tel})으로 전화 주시면 친절히 알려 드릴게요.`,
  ],
  actions: [CALL_ACTION],
};

const has = (q: string, words: string[]) => words.some(w => q.includes(w));

/** 질문에 나온 요일 찾기: "월요일", "화욜", "오늘", "내일" */
function findDay(q: string, now: Date): Weekday | 'weekend' | null {
  const m = q.match(/(월|화|수|목|금|토|일)(요일|욜)/);
  let idx: number | null = null; // 0=일 ~ 6=토
  if (m) idx = '일월화수목금토'.indexOf(m[1]);
  else if (q.includes('오늘')) idx = now.getDay();
  else if (q.includes('내일')) idx = (now.getDay() + 1) % 7;
  if (idx === null) return null;
  if (idx === 0 || idx === 6) return 'weekend';
  return WEEKDAYS[idx - 1];
}

/**
 * 질문 → 답변(최대 2개 말풍선).
 * 우선순위: 프로그램 이름 > 요일 > 자주 묻는 질문 > 오시는 길·층별·전화 > 전체 시간표
 */
export function answerQuestion(question: string, now = new Date()): Answer[] {
  const q = question.replace(/\s/g, '');
  const answers: Answer[] = [];

  const day = findDay(q, now);
  // 과목 이름을 정확히 말하면 그 과목만, 아니면 비슷한 말(키워드)로 찾기
  const byName = PROGRAMS.filter(p => q.includes(p.name.replace(/\s|\(.*\)/g, '')));
  const matchedPrograms = byName.length ? byName : PROGRAMS.filter(p => has(q, p.keywords));

  if (matchedPrograms.length) {
    let list = matchedPrograms;
    if (day && day !== 'weekend') {
      const sameDay = list.filter(p => p.day === day);
      if (sameDay.length) list = sameDay;
    }
    answers.push({ lines: ['📌 프로그램 안내입니다.'], table: programTable(list) });
  } else if (day === 'weekend') {
    answers.push({ lines: ['🚫 주말(토·일)과 공휴일은 복지관이 쉬어요.', '평일(월~금)에 프로그램이 있어요.'] });
  } else if (day) {
    const list = PROGRAMS.filter(p => p.day === day);
    answers.push(
      list.length
        ? { lines: [`📅 ${day}요일 프로그램입니다.`], table: programTable(list) }
        : { lines: [`${day}요일에는 프로그램이 없어요.`] },
    );
  }

  for (const f of FAQS) {
    if (answers.length >= 2) break;
    if (has(q, f.keywords)) {
      answers.push(faqAnswer(f.id));
      if (f.only) return answers;
    }
  }

  if (answers.length < 2 && has(q, ['오시는길', '가는길', '찾아가', '찾아오', '버스', '지하철', '주소', '위치', '정류장', '어떻게가', '복지관어디', '복지관이어디', '복지관위치', '오는길', '차댈', '차를댈', '차세울', '주차', '자가용', '차가지고', '차를가지고'])) {
    answers.push(directionsAnswer());
  }
  if (answers.length < 2 && has(q, ['층별', '몇층', '시설', '강당', '사무실', '안내데스크', '경로당', '청춘마루', '청춘나래', '청춘누리'])) {
    answers.push(floorsAnswer());
  }
  if (answers.length < 2 && has(q, ['전화', '번호', '연락처', '문의', '통화', '담당자', '팩스'])) {
    answers.push(phoneAnswer());
  }

  if (!answers.length && has(q, ['프로그램', '수업', '강좌', '교실', '과목', '시간표', '뭐있', '무엇이있', '배울', '강의', '배우는'])) {
    answers.push(scheduleAnswer());
  }
  if (!answers.length && has(q, ['사업', '하는일', '서비스', '복지관에서'])) {
    answers.push(servicesAnswer());
  }

  return answers.length ? answers : [DEFAULT_ANSWER];
}
