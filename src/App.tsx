import { useState, useEffect, useRef } from 'react';
import {
  answerQuestion,
  directionsAnswer,
  faqAnswer,
  infoAnswer,
  phoneAnswer,
  scheduleAnswer,
  servicesAnswer,
  CALL_ACTION,
  DEFAULT_ANSWER,
  type Answer,
} from './answer';

type Message =
  | { id: number; sender: 'user'; text: string }
  | { id: number; sender: 'bot'; answer: Answer };

const WELCOME: Answer = {
  lines: [
    '안녕하세요 어르신! 😊',
    '연희노인복지관 안내 도우미입니다.',
    '아래 버튼을 누르시거나, 궁금하신 내용을 글자로 입력해 주세요!',
  ],
};

const MENU: { label: string; answer: () => Answer }[] = [
  { label: '📅 프로그램 시간표', answer: scheduleAnswer },
  { label: '📝 접수 안내', answer: () => faqAnswer('register') },
  { label: '💳 수강료', answer: () => faqAnswer('fee') },
  { label: '💰 환불 문의', answer: () => faqAnswer('refund') },
  { label: '🍱 무료 점심', answer: () => faqAnswer('meal') },
  { label: '🏛️ 이용 안내', answer: infoAnswer },
  { label: '📍 오시는 길', answer: directionsAnswer },
  { label: '🌟 복지관 사업', answer: servicesAnswer },
];

let nextId = 1;

function BotBubble({ answer }: { answer: Answer }) {
  return (
    <div className="bubble max-w-[85%] p-[14px_16px] rounded-[16px] rounded-tl-[2px] text-[19px] leading-[1.6] shadow-[0_2px_6px_rgba(0,0,0,0.08)] break-words bg-white text-[#333333]">
      {answer.lines.map((line, i) => (
        line === ''
          ? <div key={i} className="h-3" />
          : <p key={i} className={i === 0 || answer.lines[i - 1] === '' ? 'font-bold' : ''}>{line}</p>
      ))}
      {answer.table && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[17px]">
            <thead>
              <tr>
                {answer.table.head.map(h => (
                  <th key={h} className="bg-[#1E90FF] text-white px-2 py-1.5 border border-[#cfe3f7] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answer.table.rows.map((row, r) => (
                <tr key={r} className={r % 2 ? 'bg-[#f3f9ff]' : 'bg-white'}>
                  {row.map((cell, c) => (
                    <td key={c} className={`px-2 py-1.5 border border-[#cfe3f7] ${c === 0 ? 'text-center font-bold whitespace-nowrap' : ''}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {answer.actions?.map(a => (
        <a
          key={a.href}
          href={a.href}
          target={a.href.startsWith('tel:') ? '_self' : '_blank'}
          rel="noopener noreferrer"
          className="mt-3 block w-full p-[14px] rounded-[12px] text-center text-[20px] font-bold bg-[#e8f5e9] text-[#1b7a2e] border-2 border-[#a5d6a7] active:scale-95 transition-all"
        >
          {a.label}
        </a>
      ))}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([{ id: nextId++, sender: 'bot', answer: WELCOME }]);
  const [userQuestion, setUserQuestion] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const reply = (userText: string, answers: Answer[]) => {
    setMessages(prev => [...prev, { id: nextId++, sender: 'user', text: userText }]);
    setTimeout(() => {
      setMessages(prev => [...prev, ...answers.map(answer => ({ id: nextId++, sender: 'bot' as const, answer }))]);
    }, 400);
  };

  const submitQuestion = () => {
    const question = userQuestion.trim();
    if (!question) return;
    setUserQuestion('');
    const answers = answerQuestion(question);
    reply(question, answers);
    // 답하지 못한 질문은 챗봇 개선용으로 저장 (실패해도 화면에는 영향 없음)
    if (answers[0] === DEFAULT_ANSWER) {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q: question }),
        keepalive: true,
      }).catch(() => {});
    }
  };

  return (
    <div className="flex justify-center min-h-screen h-[100dvh] bg-[#ffffff] font-sans overflow-hidden">
      <div className="chat-container w-full max-w-[600px] h-full flex flex-col bg-white relative shadow-[0_0_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">

        {/* Header */}
        <div className="header bg-[#ffffff] p-[12px_16px] flex items-center justify-between border-b-2 border-[#1E90FF] shrink-0 z-10">
          <h1 className="text-[#1E90FF] text-[26px] font-[900] tracking-[1px]">연희노인복지관 안내</h1>
          <a
            href={CALL_ACTION.href}
            className="shrink-0 bg-[#e8f5e9] text-[#1b7a2e] border-2 border-[#a5d6a7] rounded-[12px] px-3 py-2 text-[17px] font-bold"
            onClick={() => reply('📞 복지관 전화', [phoneAnswer()])}
          >
            📞 전화
          </a>
        </div>

        {/* Chat Box */}
        <div
          ref={chatBoxRef}
          className="chat-box flex-1 overflow-y-auto p-[16px] flex flex-col gap-[16px] scroll-smooth bg-[#daeaf5]"
        >
          {messages.map(msg => (
            <div key={msg.id} className={`msg-row flex w-full items-start ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
              {msg.sender === 'bot' ? (
                <>
                  <div className="bot-profile-text w-[60px] h-[60px] rounded-[16px] bg-white border-2 border-[#1E90FF] text-[#1E90FF] flex items-center justify-center text-[14px] font-[900] text-center leading-[1.2] mr-[10px] shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                    연희<br />노인<br />복지관
                  </div>
                  <BotBubble answer={msg.answer} />
                </>
              ) : (
                <div className="bubble max-w-[75%] p-[14px_16px] rounded-[16px] rounded-tr-[2px] text-[19px] leading-[1.6] shadow-[0_2px_6px_rgba(0,0,0,0.08)] break-words bg-[#fef01b] text-[#1a1a1a]">
                  {msg.text}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid shrink-0 grid grid-cols-2 gap-[8px] p-[10px_12px] bg-white border-t-[1.5px] border-[#dddddd] z-10">
          {MENU.map(m => (
            <button
              key={m.label}
              onClick={() => reply(m.label, [m.answer()])}
              className="menu-btn bg-[#87CEEB] border-none p-[13px_8px] rounded-[12px] text-[19px] cursor-pointer font-bold text-[#1a1a1a] active:bg-[#5bb8e0] transition-all"
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="input-area shrink-0 bg-white p-[10px_12px] flex gap-[8px] border-t-[1.5px] border-[#dddddd] z-10">
          <input
            type="text"
            value={userQuestion}
            onChange={e => setUserQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && submitQuestion()}
            placeholder="예: 요가반은 언제야?"
            className="flex-1 min-w-0 p-[14px_18px] text-[18px] border-[1.5px] border-[#1E90FF] rounded-[24px] outline-none bg-[#f8fcff] focus:border-[#0066cc]"
          />
          <button
            onClick={submitQuestion}
            className="send-btn bg-[#fef01b] border-none p-[14px_20px] text-[19px] font-bold rounded-[24px] cursor-pointer text-[#1a1a1a] active:bg-[#e6d000] transition-all shrink-0"
          >
            전송
          </button>
        </div>
        <p className="shrink-0 bg-white px-4 pb-2 text-center text-[13px] text-[#888]">
          답을 못 드린 질문은 챗봇을 고치는 데 쓰여요. 이름·전화번호는 적지 말아 주세요.
        </p>
      </div>
    </div>
  );
}
