import { useState, useEffect } from 'react';
import { RefreshCw, GraduationCap, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

type Question = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export default function ToeicPart5() {
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  
  // Game states
  const [setupMode, setSetupMode] = useState(true);
  const [numQuestions, setNumQuestions] = useState(10);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch('/api/toeic_part5.json')
      .then(async (res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: Question[]) => {
        setAllQuestions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading TOEIC data:", err);
        setLoading(false);
      });
  }, []);

  const startQuiz = () => {
    if (numQuestions < 1) return alert("Vui lòng chọn số lượng câu hỏi ít nhất là 1.");
    let count = numQuestions;
    if (count > allQuestions.length) count = allQuestions.length;

    // Shuffle array (Fisher-Yates)
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, count);
    
    setActiveQuestions(selected);
    setSetupMode(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === activeQuestions[currentIndex].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(curr => curr + 1);
  };

  const restart = () => {
    setSetupMode(true);
  };

  if (loading) {
    return <div className="app-container"><p>Đang tải dữ liệu bài thi TOEIC...</p></div>;
  }

  if (setupMode) {
    return (
      <div className="game-container" style={{ paddingTop: '40px' }}>
         <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '28px', color: 'var(--primary)' }}>TOEIC Reading Part 5</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Bài tập điền từ vào chỗ trống chuyên sâu. Ngân hàng câu hỏi nâng cao (Incomplete Sentences).
            </p>

            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Số lượng câu hỏi bạn muốn làm (Tối Đa: {allQuestions.length}):</label>
              <input 
                 type="number"
                 className="glass-input"
                 value={numQuestions}
                 min={1}
                 max={allQuestions.length}
                 onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                 style={{ width: '100%', fontSize: '18px', padding: '12px' }}
              />
            </div>

            <button className="btn-primary" onClick={startQuiz} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
               <GraduationCap size={20} /> Bắt đầu làm bài
            </button>
         </div>
      </div>
    );
  }

  const isFinished = currentIndex >= activeQuestions.length;

  if (isFinished) {
    return (
      <div className="game-container">
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Hoàn thành!</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)', margin: '20px 0' }}>
            {score} / {activeQuestions.length}
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
             {score === activeQuestions.length ? 'Xuất sắc! Bạn làm đúng tất cả các câu.' : 'Hãy tiếp tục cố gắng nhé!'}
          </p>
          <button className="btn-secondary" onClick={restart} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} /> Thiết lập lại bài thi
          </button>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];

  return (
    <div className="game-container" style={{ alignItems: 'center', paddingTop: '40px' }}>
      
      <div className="game-card glass-panel" style={{ width: '100%', maxWidth: '700px', textAlign: 'left' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '24px' }}>
            <span>Câu hỏi {currentIndex + 1} / {activeQuestions.length}</span>
            <span>Điểm: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{score}</span></span>
         </div>

         <div style={{ fontSize: '20px', lineHeight: '1.6', marginBottom: '32px', fontWeight: 500 }}>
           {currentQ.question}
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQ.options.map((option, idx) => {
              const isCorrect = idx === currentQ.answer;
              const isSelected = idx === selectedOption;
              
              let bgColor = 'rgba(255, 255, 255, 0.05)';
              let borderColor = 'rgba(255, 255, 255, 0.1)';
              
              if (isAnswered) {
                if (isCorrect) {
                  bgColor = 'rgba(16, 185, 129, 0.2)';
                  borderColor = 'var(--success)';
                } else if (isSelected && !isCorrect) {
                  bgColor = 'rgba(239, 68, 68, 0.2)';
                  borderColor = 'var(--danger)';
                }
              } else if (isSelected) {
                  bgColor = 'rgba(255, 255, 255, 0.1)';
                  borderColor = 'var(--primary)';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: 'var(--text-main)',
                    textAlign: 'left',
                    fontSize: '16px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { if (!isAnswered) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseOut={(e) => { if (!isAnswered) e.currentTarget.style.background = bgColor }}
                >
                  <span><strong>{String.fromCharCode(65 + idx)}.</strong> {option}</span>
                  {isAnswered && isCorrect && <CheckCircle size={20} color="var(--success)" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle size={20} color="var(--danger)" />}
                </button>
              );
            })}
         </div>

         {isAnswered && (
            <div style={{ 
               marginTop: '24px', 
               padding: '20px', 
               background: 'rgba(59, 130, 246, 0.1)', 
               borderLeft: '4px solid var(--primary)', 
               borderRadius: '0 8px 8px 0',
               animation: 'fadeIn 0.3s'
            }}>
               <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                 💡 Giải thích:
               </h4>
               <p style={{ lineHeight: '1.6' }}>{currentQ.explanation}</p>
            </div>
         )}

         {isAnswered && (
            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              <button className="btn-primary" onClick={nextQuestion} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Tiếp theo <ArrowRight size={18} />
              </button>
            </div>
         )}
      </div>

    </div>
  );
}
