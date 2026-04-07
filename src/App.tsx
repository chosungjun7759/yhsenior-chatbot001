import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  setDoc,
  doc,
  addDoc,
  getDocFromServer
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
  Flower, 
  FileText, 
  CircleDollarSign, 
  Info, 
  LogOut, 
  LogIn, 
  AlertCircle,
  Settings,
  Send
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from './firebase';
import { WelfareInfo, OperationType, FirestoreErrorInfo } from './types';

// Error Handler as per instructions
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [infoData, setInfoData] = useState<WelfareInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // AI related state
  const [userQuestion, setUserQuestion] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser?.email === "sj91257759@gmail.com" && currentUser.emailVerified) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = 'welfare_info';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WelfareInfo[];
      setInfoData(data);
    }, (err) => {
      console.error("Firestore error:", err);
    });
    return () => unsubscribe();
  }, []);

  const updateTo2026Data = async () => {
    const newData = [
      { 
        category: 'program', 
        title: '🌸 여가 프로그램 찾기', 
        content: "<b>[2026년 1학기 주요 인기 프로그램]</b><br><br>" +
                 "📱 <b>스마트폰 교실</b><br>- 초급: 금 09:30~10:30 (청춘누리)<br>- 중급: 금 11:00~12:00 (청춘나래)<br><br>" +
                 "🎵 <b>음악 및 댄스</b><br>- 노래교실: 목 10:00~11:30 (청춘마루)<br>- 라인댄스: 월 10:00~11:00 (청춘마루)<br><br>" +
                 "🧘 <b>건강 및 요가</b><br>- 의자요가: 화 10:00~11:00 (청춘마루)" 
      },
      { 
        category: 'register', 
        title: '📝 프로그램 접수 안내', 
        content: "<b>[프로그램 접수 안내]</b><br><br>접수는 <b>매월 25일 오전 9시</b>부터 복지관 1층 안내데스크에서 선착순으로 진행됩니다. (회원증을 꼭 지참해 주세요!)" 
      },
      { 
        category: 'refund', 
        title: '💰 환불/취소 문의', 
        content: "<b>[환불 및 취소 문의]</b><br><br>개강 전에는 <b>전액 환불</b>이 가능합니다. 영수증과 결제하신 카드를 지참하여 2층 통합사무실로 방문해 주세요." 
      },
      { 
        category: 'info', 
        title: '🏛️ 복지관 이용 안내', 
        content: "<b>[연희노인복지관 이용 안내]</b><br><br>- 운영시간: 평일 오전 9시 ~ 오후 6시<br>- 휴관일: 주말 및 공휴일<br>- 점심식사: 낮 12시부터 1층 식당" 
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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("로그인에 실패했습니다.");
    }
  };

  const submitQuestion = async () => {
    if (!userQuestion.trim()) {
      setAiReply("어르신, 궁금하신 내용을 빈칸에 먼저 적어주세요! 😊");
      return;
    }

    setIsAiLoading(true);
    setAiReply("🤖 비서봇: 어르신 잠시만 기다려주세요 답변 준비중입니다... ⏳");

    // Use all available context data as requested
    const allContextData = infoData.map(item => item.content.replace(/<[^>]*>/g, '')).join(" ");

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          당신은 연희노인복지관의 친절하고 예의 바른 안내 챗봇입니다. 
          어르신들이 보기 편하게 아주 쉬운 말로, 존댓말로 3문장 이내로 짧게 대답하세요. 
          다음 [복지관 전체 정보]를 바탕으로 어르신의 [질문]에 답변해 주세요. 
          정보에 없는 내용이면 반드시 '2층 사무실로 문의해주시면 친절히 안내해드리겠습니다.'라고 대답하세요.

          [복지관 전체 정보]: ${allContextData}
          [질문]: ${userQuestion}
        `,
      });

      setAiReply("🤖 비서봇: " + (response.text || "죄송합니다. 답변을 생성하지 못했습니다."));
    } catch (err) {
      console.error("AI Error:", err);
      setAiReply("🤖 비서봇: 앗, 어르신! 통신이 잠시 끊겼습니다. 2층 사무실로 문의해주시면 친절히 안내해드리겠습니다. 😅");
    } finally {
      setIsAiLoading(false);
    }
  };

  const currentInfo = infoData.find(item => item.category === selectedCategory);

  const menuItems = [
    { id: 'program', label: '🌸 여가 프로그램 찾기' },
    { id: 'register', label: '📝 프로그램 접수 안내' },
    { id: 'refund', label: '💰 환불/취소 문의' },
    { id: 'info', label: '🏛️ 복지관 이용 안내' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans p-5">
      <div className="max-w-[600px] mx-auto text-center">
        
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center justify-center mb-5">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3135/3135682.png" 
            alt="연희노인복지관 로고" 
            className="w-[150px] h-auto mb-2"
            referrerPolicy="no-referrer"
          />
          <div className="text-[24px] text-gray-700 font-medium">동방사회복지회</div>
          <h1 className="text-[36px] font-bold mt-[10px] mb-[20px]">
            연희노인복지관 챗봇
          </h1>
        </div>
        
        {/* Menu Buttons */}
        <div className="space-y-[10px]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedCategory(item.id);
                setUserQuestion("");
                setAiReply("");
              }}
              className={`w-full p-[20px] bg-[#87CEEB] text-black text-[28px] font-bold rounded-[15px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:brightness-95 active:scale-95 transition-all ${selectedCategory === item.id ? 'ring-4 ring-sky-300' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Response Area */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-[30px] p-[25px] bg-[#f0f8ff] border-2 border-[#87CEEB] rounded-[15px] text-[26px] leading-[1.5] text-left"
            >
              {currentInfo ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: currentInfo.content }} />
                  
                  {/* AI Question Box */}
                  <div className="mt-[25px] pt-[20px] border-t-2 border-dashed border-[#87CEEB]">
                    <p className="text-[22px] font-bold mb-[15px]">💬 위 내용 중 궁금한 점을 물어보세요!</p>
                    <div className="flex gap-[10px]">
                      <input 
                        type="text" 
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
                        placeholder="예: 요가반은 몇시야?" 
                        className="flex-1 p-[15px] text-[22px] border rounded-[10px] border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                      />
                      <button 
                        onClick={submitQuestion}
                        disabled={isAiLoading}
                        className="px-[25px] py-[15px] text-[22px] bg-[#87CEEB] border-none rounded-[10px] cursor-pointer font-bold text-black hover:brightness-95 disabled:opacity-50"
                      >
                        {isAiLoading ? "..." : "질문"}
                      </button>
                    </div>
                    
                    {/* AI Reply Area */}
                    <AnimatePresence>
                      {aiReply && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-[20px] text-[24px] text-[#0056b3] font-bold"
                        >
                          {aiReply}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400">정보를 불러오는 중...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Login Button */}
        {!user ? (
          <button 
            onClick={handleLogin}
            className="mt-[30px] px-[20px] py-[10px] bg-[#555555] text-white text-[18px] rounded-[10px] cursor-pointer hover:bg-gray-700 transition-colors"
          >
            관리자 로그인
          </button>
        ) : (
          <div className="mt-10 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-sm font-bold text-gray-500 mb-2">관리자 모드 ({user.email})</p>
            <div className="flex justify-center gap-2">
              {isAdmin && (
                <button 
                  onClick={updateTo2026Data}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
                >
                  2026년 데이터 업데이트
                </button>
              )}
              <button 
                onClick={() => signOut(auth)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-6 left-6 right-6 p-4 bg-red-100 border-2 border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-xl">
            <AlertCircle className="shrink-0" />
            <p className="text-lg font-bold">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto font-bold underline"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


