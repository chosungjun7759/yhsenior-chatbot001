import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  setDoc,
  doc,
  addDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { db, auth } from './firebase';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      sender: 'bot',
      text: "안녕하세요 어르신! 😊<br>연희노인복지관 인공지능 비서봇입니다.<br><br>아래 버튼을 누르시거나, 궁금하신 내용을 글자로 입력해 주세요!"
    }
  ]);
  const [userQuestion, setUserQuestion] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Admin data update logic (kept from previous versions)
  const updateTo2026Data = async () => {
    const newData = [
      { 
        category: 'program', 
        title: '🌸 여가 프로그램 찾기', 
        content: "<b>[2026년 1학기 인기 프로그램]</b><br><br>📱 <b>스마트폰 교실</b><br>- 초급: 금 09:30 (청춘누리)<br>- 중급: 금 11:00 (청춘나래)<br><br>🎵 <b>음악/댄스</b><br>- 노래교실: 목 10:00 (청춘마루)<br>- 라인댄스: 월 10:00 (청춘마루)<br><br>🧘 <b>건강/요가</b><br>- 의자요가: 화 10:00 (청춘마루)" 
      },
      { 
        category: 'register', 
        title: '📝 프로그램 접수 안내', 
        content: "<b>[프로그램 접수 안내]</b><br><br>📅 <b>접수일:</b> 매월 25일 오전 9시<br>📍 <b>장소:</b> 1층 안내데스크<br>🪪 <b>필수:</b> 회원증 지참 (선착순 접수)" 
      },
      { 
        category: 'refund', 
        title: '💰 환불/취소 문의', 
        content: "<b>[환불 및 취소 문의]</b><br><br>개강 전에는 <b>전액 환불</b>이 가능합니다.<br>영수증과 결제하신 카드를 지참하여 <b>2층 통합사무실</b>로 방문해 주세요." 
      },
      { 
        category: 'info', 
        title: '🏛️ 복지관 이용 안내', 
        content: "<b>[연희노인복지관 이용 안내]</b><br><br>⏰ <b>운영시간:</b> 평일 오전 9시~오후 6시<br>🚫 <b>휴관일:</b> 주말 및 공휴일<br>🍱 <b>점심식사:</b> 낮 12시부터 1층 식당" 
      }
    ];

    for (const item of newData) {
      try {
        const q = query(collection(db, 'welfare_info'), where('category', '==', item.category));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await setDoc(doc(db, 'welfare_info', snap.docs[0].id), item);
        } else {
          await addDoc(collection(db, 'welfare_info'), item);
        }
      } catch (err) {
        console.error("Error updating data:", err);
      }
    }
    alert("2026년 데이터로 업데이트되었습니다!");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email === "sj91257759@gmail.com" && currentUser.emailVerified) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const firebaseData: Record<string, string> = {
    'program': "<b>[2026년 1학기 인기 프로그램]</b><br><br>📱 <b>스마트폰 교실</b><br>- 초급: 금 09:30 (청춘누리)<br>- 중급: 금 11:00 (청춘나래)<br><br>🎵 <b>음악/댄스</b><br>- 노래교실: 목 10:00 (청춘마루)<br>- 라인댄스: 월 10:00 (청춘마루)<br><br>🧘 <b>건강/요가</b><br>- 의자요가: 화 10:00 (청춘마루)",
    'register': "<b>[프로그램 접수 안내]</b><br><br>📅 <b>접수일:</b> 매월 25일 오전 9시<br>📍 <b>장소:</b> 1층 안내데스크<br>🪪 <b>필수:</b> 회원증 지참 (선착순 접수)",
    'refund': "<b>[환불 및 취소 문의]</b><br><br>개강 전에는 <b>전액 환불</b>이 가능합니다.<br>영수증과 결제하신 카드를 지참하여 <b>2층 통합사무실</b>로 방문해 주세요.",
    'info': "<b>[연희노인복지관 이용 안내]</b><br><br>⏰ <b>운영시간:</b> 평일 오전 9시~오후 6시<br>🚫 <b>휴관일:</b> 주말 및 공휴일<br>🍱 <b>점심식사:</b> 낮 12시부터 1층 식당"
  };

  const knowledgeBase = [
    { keywords: ['스마트폰', '핸드폰', '휴대폰', '폰', '스마트', '디지털'], answer: "스마트폰 교실 안내입니다! 😊<br><br>📱 <b>초급반</b>: 금요일 09:30~10:30 (청춘누리)<br>📱 <b>중급반</b>: 금요일 11:00~12:00 (청춘나래)" },
    { keywords: ['요가', '의자요가', '스트레칭', '체조'], answer: "의자요가 안내드립니다! 🧘<br><br>⏰ <b>화요일 오전 10시~11시</b><br>📍 <b>장소</b>: 청춘마루" },
    { keywords: ['노래', '노래교실', '음악', '가요', '합창'], answer: "노래교실 안내드립니다! 🎵<br><br>⏰ <b>목요일 오전 10시~11시 30분</b><br>📍 <b>장소</b>: 청춘마루" },
    { keywords: ['댄스', '라인댄스', '춤', '무용', '라인'], answer: "라인댄스 안내드립니다! 💃<br><br>⏰ <b>월요일 오전 10시~11시</b><br>📍 <b>장소</b>: 청춘마루" },
    { keywords: ['접수', '등록', '신청', '어떻게', '가입', '등록방법', '접수방법'], answer: "프로그램 접수 안내드립니다! 📝<br><br>📅 <b>접수일</b>: 매월 25일 오전 9시부터<br>📍 <b>장소</b>: 복지관 1층 안내데스크<br>⚠️ <b>선착순</b>이므로 일찍 오시는 게 좋습니다.<br>🪪 회원증을 꼭 지참해 주세요!" },
    { keywords: ['환불', '취소', '돌려', '반환', '반납', '못가', '못 가'], answer: "환불 및 취소 안내드립니다! 💰<br><br>✅ <b>개강 전</b>: 전액 환불 가능합니다.<br><br>📍 <b>방문 장소</b>: 2층 통합사무실<br>📋 <b>준비물</b>: 영수증 + 결제하신 카드" },
    { keywords: ['운영', '시간', '몇시', '몇 시', '열', '문', '영업', '오픈', '개관'], answer: "복지관 운영 시간 안내드립니다! 🏛️<br><br>⏰ <b>평일 오전 9시 ~ 오후 6시</b><br>🚫 <b>휴관</b>: 주말 및 공휴일" },
    { keywords: ['점심', '식사', '밥', '식당', '급식', '먹'], answer: "점심 식사 안내드립니다! 🍱<br><br>🕛 <b>낮 12시부터</b> 1층 식당에서 운영합니다. 맛있는 점심 드세요!" },
    { keywords: ['휴관', '쉬는날', '공휴일', '주말', '토요일', '일요일', '문닫'], answer: "휴관일 안내드립니다! 📅<br><br>🚫 <b>주말(토·일)</b> 및 <b>공휴일</b>은 문을 닫습니다.<br>✅ <b>평일(월~금)</b>만 운영합니다." },
    { keywords: ['회원증', '회원', '회원카드'], answer: "회원증 관련 안내드립니다! 🪪<br><br>프로그램 접수 시 <b>회원증을 반드시 지참</b>해 주셔야 합니다.<br>발급·재발급은 <b>1층 안내데스크</b>로 문의해 주세요." },
    { keywords: ['어디', '위치', '장소', '주소', '청춘마루', '청춘누리', '청춘나래'], answer: "프로그램 장소 안내드립니다! 📍<br><br>- <b>청춘마루</b>: 노래교실, 라인댄스, 의자요가<br>- <b>청춘누리</b>: 스마트폰 초급반<br>- <b>청춘나래</b>: 스마트폰 중급반<br><br>자세한 위치는 1층 안내데스크에서 확인하실 수 있습니다." },
    { keywords: ['월요일', '화요일', '수요일', '목요일', '금요일', '월', '화', '수', '목', '금'], answer: "요일별 프로그램 안내드립니다! 📅<br><br>📌 <b>월요일</b>: 라인댄스 (10:00~11:00)<br>📌 <b>화요일</b>: 의자요가 (10:00~11:00)<br>📌 <b>목요일</b>: 노래교실 (10:00~11:30)<br>📌 <b>금요일</b>: 스마트폰 초급(09:30), 중급(11:00)" }
  ];

  const defaultAnswer = "어르신, 죄송합니다. 해당 내용은 제가 바로 안내드리기 어렵습니다. 😊<br><br>📞 <b>2층 사무실</b>로 문의해주시면 친절히 안내해 드리겠습니다!";

  const appendMessage = (sender: 'bot' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), sender, text }]);
  };

  const clickMenu = (categoryId: string, btnText: string) => {
    appendMessage('user', btnText);
    setTimeout(() => {
      appendMessage('bot', firebaseData[categoryId]);
    }, 400);
  };

  const submitQuestion = () => {
    const question = userQuestion.trim();
    if (question === "") return;

    appendMessage('user', question);
    setUserQuestion("");

    const q = question.replace(/\s/g, ''); 
    let answer = defaultAnswer;

    for (const item of knowledgeBase) {
      let found = false;
      for (const keyword of item.keywords) {
        if (q.includes(keyword)) {
          answer = item.answer;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    setTimeout(() => {
      appendMessage('bot', answer);
    }, 400);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("로그인에 실패했습니다.");
    }
  };

  const logoBase64 = "data:image/png;base64,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";

  const fallbackImg = "https://cdn-icons-png.flaticon.com/512/3135/3135682.png";

  return (
    <div className="flex justify-center min-h-screen h-[100dvh] bg-[#ffffff] font-sans overflow-hidden">
      <div className="chat-container w-full max-w-[600px] h-full flex flex-col bg-white relative shadow-[0_0_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
        
        {/* Header */}
        <div className="header bg-[#000000] p-[15px_20px] flex items-center justify-center border-b-2 border-[#87CEEB] shrink-0 z-10 relative">
          <h1 className="text-[#ffffff] text-[28px] font-bold tracking-[1px]">연희노인복지관 안내</h1>
          
          {/* Admin Trigger (Absolute positioned to not interfere with centering) */}
          <div className="absolute right-4 flex gap-2">
            {!user ? (
              <button onClick={handleLogin} className="p-1 text-gray-500 hover:text-gray-300">
                <Settings size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={updateTo2026Data} className="text-[10px] bg-gray-700 text-white px-2 py-1 rounded">데이터 갱신</button>
                )}
                <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-gray-300">
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Box */}
        <div 
          ref={chatBoxRef}
          className="chat-box flex-1 overflow-y-auto p-[16px] flex flex-col gap-[16px] scroll-smooth bg-[#daeaf5]"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`msg-row flex w-full items-start ${msg.sender === 'bot' ? 'bot justify-start' : 'user justify-end'}`}>
              {msg.sender === 'bot' && (
                <div className="bot-profile-text w-[68px] h-[68px] rounded-[18px] bg-white border-2 border-[#87CEEB] text-[#1a1a1a] flex items-center justify-center text-[16px] font-[900] text-center leading-[1.2] mr-[12px] shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                  연희<br/>노인<br/>복지관
                </div>
              )}
              <div 
                className={`bubble max-w-[75%] p-[14px_16px] rounded-[16px] text-[18px] leading-[1.6] shadow-[0_2px_6px_rgba(0,0,0,0.08)] break-words ${
                  msg.sender === 'bot' 
                    ? 'bg-white text-[#333333] rounded-tl-[2px]' 
                    : 'bg-[#fef01b] text-[#1a1a1a] rounded-tr-[2px]'
                }`}
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            </div>
          ))}
          <div className="chat-bottom-anchor h-[1px] shrink-0" />
        </div>

        {/* Menu Grid */}
        <div className="menu-grid shrink-0 flex flex-col gap-[8px] p-[10px_12px] bg-white border-t-[1.5px] border-[#dddddd] z-10">
          <button onClick={() => clickMenu('program', '🌸 여가 프로그램 찾기')} className="menu-btn bg-[#87CEEB] border-none p-[16px_20px] rounded-[12px] text-[20px] cursor-pointer text-center font-bold text-[#1a1a1a] active:bg-[#5bb8e0] transition-all">🌸 여가 프로그램</button>
          <button onClick={() => clickMenu('register', '📝 프로그램 접수 안내')} className="menu-btn bg-[#87CEEB] border-none p-[16px_20px] rounded-[12px] text-[20px] cursor-pointer text-center font-bold text-[#1a1a1a] active:bg-[#5bb8e0] transition-all">📝 접수 안내</button>
          <button onClick={() => clickMenu('refund', '💰 환불/취소 문의')} className="menu-btn bg-[#87CEEB] border-none p-[16px_20px] rounded-[12px] text-[20px] cursor-pointer text-center font-bold text-[#1a1a1a] active:bg-[#5bb8e0] transition-all">💰 환불 문의</button>
          <button onClick={() => clickMenu('info', '🏛️ 복지관 이용 안내')} className="menu-btn bg-[#87CEEB] border-none p-[16px_20px] rounded-[12px] text-[20px] cursor-pointer text-center font-bold text-[#1a1a1a] active:bg-[#5bb8e0] transition-all">🏛️ 이용 안내</button>
        </div>

        {/* Input Area */}
        <div className="input-area shrink-0 bg-white p-[10px_12px] flex gap-[8px] border-t-[1.5px] border-[#dddddd] z-10">
          <input 
            type="text" 
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
            placeholder="예: 요가반은 언제야?" 
            className="flex-1 p-[14px_18px] text-[16px] border-[1.5px] border-[#87CEEB] rounded-[24px] outline-none bg-[#f8fcff] focus:border-[#3399cc]"
          />
          <button 
            onClick={submitQuestion}
            className="send-btn bg-[#fef01b] border-none p-[14px_20px] text-[18px] font-bold rounded-[24px] cursor-pointer text-[#1a1a1a] active:bg-[#e6d000] transition-all shrink-0"
          >
            전송
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute top-20 left-6 right-6 p-4 bg-red-100 border-2 border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-xl z-50">
            <AlertCircle className="shrink-0" />
            <p className="text-lg font-bold">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto font-bold underline">닫기</button>
          </div>
        )}
      </div>
    </div>
  );
}
