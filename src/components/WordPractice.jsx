import { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { RefreshCcw, HelpCircle, CheckCircle, XCircle, Eye, EyeOff, Volume2 } from 'lucide-react';

export default function WordPractice({ activeChar, onComplete }) {
  const writerContainerRefs = useRef([]);
  const writerRefs = useRef([]);
  const [feedback, setFeedback] = useState(null);
  const [showOutline, setShowOutline] = useState(true);
  const [completedChars, setCompletedChars] = useState(new Set());

  // Dynamic Size Calculation based on word length
  // 1-2 chars = 180px, 3 chars = 140px, 4+ chars = 110px
  const charLength = activeChar?.character?.length || 1;
  const canvasSize = charLength <= 2 ? 180 : (charLength === 3 ? 140 : 110);

  const initQuiz = () => {
    if (!activeChar || !activeChar.character) return;
    const chars = Array.from(activeChar.character);
    
    // Cleanup previous
    writerRefs.current.forEach(writer => {
       try { writer.cancelQuiz(); } catch(e){}
    });
    writerContainerRefs.current.forEach(el => {
      if (el) el.innerHTML = '';
    });
    
    writerRefs.current = [];
    setCompletedChars(new Set());
    setFeedback(null);

    chars.forEach((char, index) => {
      const container = writerContainerRefs.current[index];
      if (!container) return;

      const writer = HanziWriter.create(container, char, {
        width: canvasSize,
        height: canvasSize,
        padding: 5,
        strokeColor: '#ec4899', 
        radicalColor: '#8b5cf6', 
        outlineColor: 'rgba(255, 255, 255, 0.1)',
        drawingColor: '#f8fafc',
        showCharacter: false, 
        showOutline: showOutline,
        drawingWidth: charLength > 3 ? 8 : 12,
        showHintAfterMisses: 2,
        leniency: 2.5,
      });

      writerRefs.current.push(writer);

      const setupQuiz = () => {
         writer.quiz({
            onMistake: (strokeData) => {
              setFeedback({ type: 'mistake', msg: `Chữ ${index + 1}: Lỗi ở nét ${strokeData.strokeNum + 1}` });
            },
            onCorrectStroke: (strokeData) => {
              setFeedback({ type: 'success', msg: `Chữ ${index + 1}: Giỏi! Nét ${strokeData.strokeNum + 1} đúng.` });
            },
            onComplete: (summaryData) => {
              setCompletedChars(prev => {
                const newSet = new Set(prev);
                newSet.add(index);
                if (newSet.size === chars.length) {
                  setFeedback({ type: 'success', msg: `Tuyệt vời! Hoàn thành từ vựng.` });
                  playTTS(activeChar.character);
                  if (onComplete) onComplete();
                }
                return newSet;
              });
            }
         });
      };
      setupQuiz();
    });
  };

  useEffect(() => {
    initQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChar, showOutline]);

  const playTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShowHint = () => {
    writerRefs.current.forEach((writer, index) => {
      if (!completedChars.has(index)) {
         writer.animateCharacter({
           onComplete: () => {
             setTimeout(() => writer.quiz(), 500);
           }
         });
      }
    });
  };

  const handleRestart = () => {
    initQuiz();
  };

  const toggleOutline = () => {
    setShowOutline(!showOutline);
  };

  if (!activeChar) return null;

  return (
    <div className="practice-module" style={{background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)'}}>
       <div className="practice-header" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h2 style={{margin: '0 0 0.5rem 0', fontSize: '1.8rem'}}>{activeChar.pinyin}</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center'}}>
            <p style={{fontSize: '1.2rem', margin: 0}}>{activeChar.meaning}</p>
            <button className="btn btn-secondary" style={{padding: '0.4rem', borderRadius: '50%'}} onClick={() => playTTS(activeChar.character)}>
              <Volume2 size={18} color="var(--accent-primary)"/>
            </button>
          </div>
       </div>

       <div className="writer-wrapper" style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', margin: '2rem 0'}}>
          {Array.from(activeChar.character).map((char, index) => (
            <div key={`${activeChar.id || activeChar.character}-${index}`} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
               <div 
                 ref={el => writerContainerRefs.current[index] = el}
                 className="writer-canvas-box"
                 style={{
                    width: canvasSize, 
                    height: canvasSize, 
                    border: completedChars.has(index) ? '2px solid var(--success)' : '1px dashed var(--glass-border)',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)'
                 }}
               />
               {completedChars.has(index) ? (
                 <CheckCircle size={20} color="var(--success)"/>
               ) : (
                 <div style={{height: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{index + 1}</div>
               )}
            </div>
          ))}
       </div>

       <div className="feedback-area" style={{minHeight: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
         {feedback ? (
           <div className="feedback-badge" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedback.type === 'success' ? '#34d399' : '#fca5a5'
           }}>
              {feedback.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {feedback.msg}
           </div>
         ) : (
           <p className="text-secondary" style={{margin: 0, fontSize: '0.9rem'}}>Viết các nét theo thứ tự vào phía trên</p>
         )}
       </div>

       <div className="action-buttons" style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap'}}>
         <button className="btn btn-secondary" onClick={toggleOutline} style={{fontSize: '0.9rem', padding: '0.5rem 1rem'}}>
           {showOutline ? <><EyeOff size={16} /> Ẩn Mờ</> : <><Eye size={16} /> Hiện Mờ</>}
         </button>
         <button className="btn btn-secondary" onClick={handleRestart} style={{fontSize: '0.9rem', padding: '0.5rem 1rem'}}>
           <RefreshCcw size={16} /> Làm Lại
         </button>
         <button className="btn btn-primary" onClick={handleShowHint} style={{fontSize: '0.9rem', padding: '0.5rem 1rem'}}>
           <HelpCircle size={16} /> Gợi Ý Nét
         </button>
       </div>
    </div>
  );
}
