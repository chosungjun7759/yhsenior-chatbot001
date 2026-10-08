/**
 * 복지관 안내 정보 — 챗봇의 모든 답변은 이 파일 하나에서만 나옵니다.
 * 학기가 바뀌면 이 파일만 고치면 됩니다. (화면 코드 App.tsx는 건드릴 필요 없음)
 *
 * ⚠️ 프로그램 시간표는 2026년 1학기 기준입니다. 2학기 시간표로 교체 필요.
 */

export const SCHEDULE_LABEL = '2026년 1학기';

export const CENTER = {
  name: '연희노인복지관',
  address: '서울특별시 서대문구 홍제천로2길 111 (연희동)',
  tel: '02-3143-7778',
  fax: '02-3143-7779',
  homepage: 'www.yhsenior.or.kr',
  hours: '평일(월~금) 오전 9시 ~ 오후 6시',
  closed: '주말(토·일) 및 공휴일',
  mapUrl: 'https://map.kakao.com/link/search/연희노인복지관',
};

export const FLOORS: { floor: string; rooms: string }[] = [
  { floor: '옥상', rooms: '휴게 공간' },
  { floor: '4층', rooms: '청춘마루 (강당·프로그램실)' },
  { floor: '3층', rooms: '청춘나래, 청춘누리 (프로그램실)' },
  { floor: '2층', rooms: '사무실, 관장실, 할머니방, 할아버지방' },
  { floor: '1층', rooms: '스마트라운지, 도담도담, 경로식당' },
  { floor: '지하1층', rooms: '자료실, 어울림실, 건강튼튼실' },
];

export const TRANSPORT: { how: string; detail: string }[] = [
  { how: '연가교 앞 (도보 5분)', detail: '버스 272, 마포06' },
  { how: '연흥교회 앞 (도보 6분)', detail: '버스 7739' },
  { how: '홍남교·자전거대여소 앞 (도보 8분)', detail: '버스 7612, 7734, 7738, 7739' },
  { how: '가좌역 4번 출구 (도보 16분)', detail: '지하철 경의중앙선' },
];

export const WEEKDAYS = ['월', '화', '수', '목', '금'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface Program {
  name: string;
  day: Weekday;
  time: string;
  place: string;
  /** 어르신이 다르게 부를 만한 말 (두 글자 이상) */
  keywords: string[];
}

export const PROGRAMS: Program[] = [
  { day: '월', name: '라인댄스', time: '10:00~11:00', place: '4층 청춘마루', keywords: ['라인댄스'] },
  { day: '월', name: '칼림바', time: '10:00~11:00', place: '3층', keywords: ['칼림바'] },
  { day: '월', name: '오카리나 초급', time: '15:00~16:00', place: '3층', keywords: ['오카리나'] },
  { day: '화', name: '의자요가', time: '10:00~11:00', place: '4층 청춘마루', keywords: ['요가', '스트레칭'] },
  { day: '화', name: '생활영어회화', time: '10:00~11:00', place: '3층', keywords: ['영어', '회화'] },
  { day: '화', name: '미술반', time: '14:00~16:00', place: '3층', keywords: ['미술', '그림'] },
  { day: '화', name: '스포츠댄스', time: '14:00~15:00', place: '4층 청춘마루', keywords: ['스포츠댄스'] },
  { day: '수', name: '맷돌체조', time: '09:20~10:20', place: '4층 청춘마루', keywords: ['맷돌', '체조'] },
  { day: '수', name: '캘리그래피', time: '10:00~11:00', place: '3층', keywords: ['캘리', '붓글씨', '서예'] },
  { day: '수', name: '단학기공', time: '10:30~11:30', place: '4층 청춘마루', keywords: ['단학', '기공'] },
  { day: '수', name: '색연필 드로잉', time: '16:00~17:00', place: '3층', keywords: ['색연필', '드로잉', '그림'] },
  { day: '목', name: '노래교실', time: '10:00~11:30', place: '4층 청춘마루', keywords: ['노래', '트로트', '음악', '합창'] },
  { day: '목', name: '영어문법', time: '13:00~14:00', place: '3층', keywords: ['영어', '문법'] },
  { day: '목', name: '소도구 필라테스', time: '14:00~15:00', place: '4층 청춘마루', keywords: ['필라테스'] },
  { day: '목', name: '오카리나', time: '16:00~17:00', place: '3층', keywords: ['오카리나'] },
  { day: '금', name: '스마트폰 초급', time: '09:30~10:30', place: '3층 청춘누리', keywords: ['스마트폰', '핸드폰', '휴대폰', '스마트', '디지털', '카톡'] },
  { day: '금', name: '스마트폰 중급', time: '11:00~12:00', place: '3층 청춘나래', keywords: ['스마트폰', '핸드폰', '휴대폰', '스마트', '디지털', '카톡'] },
];

export const FEE = '과목당 월 4,000원';

/** 자주 묻는 질문. lines는 한 줄씩 표시됩니다. */
export interface Faq {
  id: string;
  title: string;
  keywords: string[];
  lines: string[];
}

export const FAQS: Faq[] = [
  {
    id: 'register',
    title: '📝 접수 안내',
    keywords: ['접수', '등록', '신청', '가입', '수강신청'],
    lines: [
      '📅 접수일: 매월 25일 오전 9시부터',
      '📍 장소: 1층 안내데스크',
      '⚠️ 선착순이라 일찍 오시는 게 좋아요.',
      '🪪 회원증을 꼭 가져와 주세요.',
    ],
  },
  {
    id: 'fee',
    title: '💳 수강료',
    keywords: ['수강료', '회비', '비용', '얼마', '가격', '요금'],
    lines: [`💳 수강료: ${FEE}`, '자세한 내용은 2층 사무실에 문의해 주세요.'],
  },
  {
    id: 'refund',
    title: '💰 환불 문의',
    keywords: ['환불', '취소', '돌려받', '반환', '못가', '못나가', '그만'],
    lines: [
      '✅ 개강 전에는 전액 환불됩니다.',
      '📍 방문 장소: 2층 사무실',
      '📋 준비물: 영수증 + 결제하신 카드',
    ],
  },
  {
    id: 'meal',
    title: '🍱 점심 식사',
    keywords: ['점심', '식사', '밥', '식당', '급식', '배식', '경로식당'],
    lines: ['🕛 평일 낮 12시부터', '📍 1층 경로식당'],
  },
  {
    id: 'member',
    title: '🪪 회원증',
    keywords: ['회원증', '회원카드', '회원가입', '회원'],
    lines: ['프로그램 접수 때 회원증이 꼭 필요해요.', '발급·재발급은 1층 안내데스크에 문의해 주세요.'],
  },
  {
    id: 'hours',
    title: '🏛️ 이용 시간',
    keywords: ['운영시간', '이용시간', '언제열', '문열', '열어요', '여나요', '닫아요', '닫나요', '문닫', '휴관', '쉬는날', '공휴일', '주말', '토요일', '일요일', '개관'],
    lines: [`⏰ 운영: ${CENTER.hours}`, `🚫 휴관: ${CENTER.closed}`],
  },
];
