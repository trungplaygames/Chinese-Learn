import { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { RefreshCcw, HelpCircle, CheckCircle, XCircle, Eye, EyeOff, Volume2 } from 'lucide-react';
import { playTTS } from '../lib/tts';

export default function WordPractice({ activeChar, onComplete, initialDelay = 0 }) {
  const writerContainerRefs = useRef([]);
  const writerRefs = useRef([]);
  const [feedback, setFeedback] = useState(null);
  const [showOutline, setShowOutline] = useState(true);
  const [completedChars, setCompletedChars] = useState(new Set());
  const [mistakes, setMistakes] = useState(0);
  const mistakesRef = useRef(0);
  const hasGuidedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Dynamic Size Calculation based on word length
  // 1-2 chars = 180px, 3 chars = 140px, 4+ chars = 110px
  const charLength = activeChar?.character?.length || 1;
  const canvasSize = charLength <= 2 ? 180 : (charLength === 3 ? 140 : 110);

  const initQuiz = () => {
    if (!activeChar || !activeChar.character) return;
    const chars = Array.from(activeChar.character);
    
    // Clear state
    setCompletedChars(new Set());
    setFeedback(null);
    setMistakes(0);
    mistakesRef.current = 0;
    
    // Explicit Cleanup
    writerRefs.current.forEach(writer => {
       try { writer.cancelQuiz(); } catch(e){}
    });
    writerRefs.current = [];
    writerContainerRefs.current.forEach(el => {
      if (el) el.innerHTML = '';
    });

    const setupQuizForIndex = (index) => {
      if (!isMountedRef.current) return;
      const writer = writerRefs.current[index];
      if (!writer) return;
      writer.quiz({
        onMistake: (strokeData) => {
          if (!isMountedRef.current) return;
          mistakesRef.current += 1;
          setMistakes(mistakesRef.current);
          setFeedback({ type: 'mistake', msg: `Chữ ${index + 1}: Lỗi ở nét ${strokeData.strokeNum + 1}` });
        },
        onCorrectStroke: (strokeData) => {
          if (!isMountedRef.current) return;
          setFeedback({ type: 'success', msg: `Chữ ${index + 1}: Giỏi! Nét ${strokeData.strokeNum + 1} đúng.` });
        },
        onComplete: (summaryData) => {
          if (!isMountedRef.current) return;
          setCompletedChars(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            if (newSet.size === chars.length) {
              setFeedback({ type: 'success', msg: `Tuyệt vời! Bạn đã hoàn thành từ vựng.` });
              playTTS(activeChar.character);
              if (onComplete) onComplete();
            }
            return newSet;
          });
        }
      });
    };
    // Run guide logic
    const runInitialGuide = async () => {
        if (!isMountedRef.current) return;
        const isFirstTime = !hasGuidedRef.current || 
                           (hasGuidedRef.current.id !== activeChar.id && 
                            hasGuidedRef.current.char !== activeChar.character);
        
        if (isFirstTime) {
            // Chờ một chút ngắn để người dùng sẵn sàng (200ms thay vì 600ms)
            await new Promise(r => {
                const t = setTimeout(r, 200);
                if (!isMountedRef.current) clearTimeout(t);
            });
            if (!isMountedRef.current) return;
            
            for (let i = 0; i < writerRefs.current.length; i++) {
                const writer = writerRefs.current[i];
                if (writer && isMountedRef.current) {
                    await new Promise(resolve => {
                        writer.animateCharacter({
                            strokeAnimationSpeed: 1.5,
                            onComplete: () => {
                               const t = setTimeout(resolve, 150); // Delay ngắn giữa các chữ
                               if (!isMountedRef.current) clearTimeout(t);
                            }
                        });
                    });
                    if (isMountedRef.current) setupQuizForIndex(i);
                }
            }
            hasGuidedRef.current = { id: activeChar.id, char: activeChar.character };
        } else {
            for (let i = 0; i < writerRefs.current.length; i++) {
                setupQuizForIndex(i);
            }
        }
    };

    // Wait for the requested delay (useful for Modal animations)
    const setupTimer = setTimeout(() => {
      if (!isMountedRef.current) return;

      // Create writers
      chars.forEach((char, index) => {
        const container = writerContainerRefs.current[index];
        if (!container) return;

        writerRefs.current[index] = HanziWriter.create(container, char, {
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
      });

      runInitialGuide();
    }, initialDelay);

    return () => clearTimeout(setupTimer);
  };


  useEffect(() => {
    isMountedRef.current = true;
    const cleanup = initQuiz();
    return () => { 
      isMountedRef.current = false; 
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChar, showOutline, initialDelay]);

  const handleShowHint = async () => {
    // Sequential hints: Draw -> Wait -> Resume Quiz
    for (let i = 0; i < writerRefs.current.length; i++) {
      if (!completedChars.has(i)) {
        const writer = writerRefs.current[i];
        if (writer && isMountedRef.current) {
            await new Promise(resolve => {
                writer.animateCharacter({
                    onComplete: () => {
                       const r = setTimeout(() => {
                           if (isMountedRef.current) writer.quiz();
                           resolve();
                       }, 500);
                    }
                });
            });
        }
      }
    }
  };

  const handleRestart = () => {
    initQuiz();
  };

  const toggleOutline = () => {
    setShowOutline(!showOutline);
  };

  if (!activeChar) return null;

  return (
    <div className="practice-module" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', userSelect: 'none' }}>
      <div className="practice-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>{activeChar.pinyin}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <p style={{ fontSize: '1.2rem', margin: 0 }}>{activeChar.meaning}</p>
          <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={() => playTTS(activeChar.character)}>
            <Volume2 size={18} color="var(--accent-primary)" />
          </button>
        </div>
      </div>

      <div className="writer-wrapper" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', margin: '2rem 0' }}>
        {Array.from(activeChar.character).map((char, index) => (
          <div key={`${activeChar.id || activeChar.character}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
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
              <CheckCircle size={20} color="var(--success)" />
            ) : (
              <div style={{ height: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', userSelect: 'none' }}>{index + 1}</div>
            )}
          </div>
        ))}
      </div>

      <div className="feedback-area" style={{ minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
        {feedback ? (
          <>
            <div className="feedback-badge" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: '20px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedback.type === 'success' ? '#34d399' : '#fca5a5',
              fontWeight: '500'
            }}>
              {feedback.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {feedback.msg}
            </div>

            {/* Hiển thị số lỗi riêng biệt màu đỏ khi hoàn thành */}
            {feedback.type === 'success' && (
              <div style={{
                padding: '0.4rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)',
                color: '#ff6b6b', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                Tổng số lỗi: {mistakes}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>Viết các nét theo thứ tự vào phía trên</p>
            {mistakes > 0 && <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>Số lỗi hiện tại: {mistakes}</span>}
          </div>
        )}
      </div>

      <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={toggleOutline} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          {showOutline ? <><EyeOff size={16} /> Ẩn Mờ</> : <><Eye size={16} /> Hiện Mờ</>}
        </button>
        <button className="btn btn-secondary" onClick={handleRestart} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          <RefreshCcw size={16} /> Làm Lại
        </button>
        <button className="btn btn-primary" onClick={handleShowHint} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          <HelpCircle size={16} /> Gợi Ý Nét
        </button>
      </div>
    </div>
  );
}
