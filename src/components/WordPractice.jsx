import { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { RefreshCcw, HelpCircle, CheckCircle, XCircle, Eye, EyeOff, Volume2, Layers } from 'lucide-react';
import { playTTS } from '../lib/tts';
import HanziTree from './HanziTree';

const HANZI_DICT = {
  '一': 'Nhất', '丨': 'Cổn', '丶': 'Chủ', '丿': 'Phiệt', '乙': 'Ất', '亅': 'Quyết',
  '二': 'Nhị', '亠': 'Đầu', '人': 'Nhân', '亻': 'Nhân', '儿': 'Nhi', '入': 'Nhập',
  '八': 'Bát', '冂': 'Quynh', '冖': 'Mịch', '冫': 'Băng', '几': 'Kỷ', '凵': 'Khảm',
  '刀': 'Đao', '刂': 'Đao', '力': 'Lực', '勹': 'Bao', '匕': 'Chủy', '匚': 'Phương',
  '匸': 'Hệ', '十': 'Thập', '卜': 'Bốc', '卩': 'Tiết', '厂': 'Hán', '厶': 'Tư',
  '又': 'Hựu', '口': 'Khẩu', '囗': 'Vi', '土': 'Thổ', '士': 'Sĩ', '夂': 'Truy',
  '夊': 'Tuy', '夕': 'Tịch', '大': 'Đại', '女': 'Nữ', '子': 'Tử', '宀': 'Miên',
  '寸': 'Thốn', '小': 'Tiểu', '尢': 'Uông', '尸': 'Thi', '屮': 'Triệt', '山': 'Sơn',
  '巛': 'Xuyên', '工': 'Công', '己': 'Kỷ', '巾': 'Cân', '干': 'Can', '幺': 'Yêu',
  '广': 'Nghiễm', '廴': 'Dẫn', '廾': 'Củng', '弋': 'Dặc', '弓': 'Cung', '彐': 'Kê',
  '彡': 'Tam', '彳': 'Xích', '心': 'Tâm', '忄': 'Tâm', '戈': 'Qua', '户': 'Hộ',
  '手': 'Thủ', '扌': 'Thủ', '支': 'Chi', '攴': 'Phác', '攵': 'Phác', '文': 'Văn',
  '斗': 'Đấu', '斤': 'Cân', '方': 'Phương', '无': 'Vô', '日': 'Nhật', '曰': 'Viết',
  '月': 'Nguyệt', '木': 'Mộc', '欠': 'Khiếm', '止': 'Chỉ', '歹': 'Đãi', '殳': 'Thù',
  '毋': 'Vô', '比': 'Tỷ', '毛': 'Mao', '氏': 'Thị', '气': 'Khí', '水': 'Thủy',
  '氵': 'Thủy', '火': 'Hỏa', '灬': 'Hỏa', '爪': 'Trảo', '父': 'Phục', '爻': 'Hào',
  '爿': 'Tường', '片': 'Phiến', '牙': 'Nha', '牛': 'Ngưu', '牜': 'Ngưu', '犬': 'Khuyển',
  '犭': 'Khuyển', '玄': 'Huyền', '玉': 'Ngọc', '王': 'Vương', '瓜': 'Qua', '瓦': 'Ngõa',
  '甘': 'Cam', '生': 'Sinh', '用': 'Dụng', '田': 'Điền', '疋': 'Sơ', '疒': 'Nạch',
  '癶': 'Bát', '白': 'Bạch', '皮': 'Bì', '皿': 'Mãnh', '目': 'Mục', '矛': 'Mâu',
  '矢': 'Thỉ', '石': 'Thạch', '示': 'Thị', '礻': 'Thị', '禸': 'Nhựu', '禾': 'Hòa',
  '穴': 'Huyệt', '立': 'Lập', '竹': 'Trúc', '米': 'Mễ', '糸': 'Mịch', '纟': 'Mịch',
  '缶': 'Phẫu', '网': 'Võng', '羊': 'Dương', '羽': 'Vũ', '老': 'Lão', '而': 'Nhi',
  '耒': 'Lỗi', '耳': 'Nhĩ', '聿': 'Duật', '肉': 'Nhục', '臣': 'Thần', '自': 'Tự',
  '至': 'Chí', '臼': 'Cữu', '舌': 'Thiệt', '舛': 'Suyễn', '舟': 'Chu', '艮': 'Cấn',
  '色': 'Sắc', '艸': 'Thảo', '艹': 'Thảo', '虍': 'Hổ', '虫': 'Trùng', '血': 'Huyết',
  '行': 'Hành', '衣': 'Y', '衤': 'Y', '襾': 'Á', '見': 'Kiến', '见': 'Kiến',
  '角': 'Giác', '言': 'Ngôn', '讠': 'Ngôn', '谷': 'Cốc', '豆': 'Đậu', '豕': 'Thỉ',
  '豸': 'Trãi', '貝': 'Bối', '贝': 'Bối', '赤': 'Xích', '走': 'Tẩu', '足': 'Túc',
  '身': 'Thân', '車': 'Xa', '车': 'Xa', '辛': 'Tân', '辰': 'Thần', '辵': 'Sước',
  '辶': 'Sước', '邑': 'Ấp', '酉': 'Dậu', '采': 'Thái', '里': 'Lý', '金': 'Kim',
  '钅': 'Kim', '長': 'Trường', '长': 'Trường', '門': 'Môn', '门': 'Môn', '阜': 'Phụ',
  '隶': 'Đãi', '隹': 'Chuy', '雨': 'Vũ', '靑': 'Thanh', '青': 'Thanh', '非': 'Phi',
  '面': 'Diện', '革': 'Cách', '韋': 'Vi', '韦': 'Vi', '韭': 'Cửu', '音': 'Âm',
  '頁': 'Hiệt', '页': 'Hiệt', '風': 'Phong', '风': 'Phong', '飛': 'Phi', '飞': 'Phi',
  '食': 'Thực', '饣': 'Thực', '首': 'Thủ', '香': 'Hương', '馬': 'Mã', '马': 'Mã',
  '骨': 'Cốt', '高': 'Cao', '髟': 'Tiêu', '鬥': 'Đấu', '鬯': 'Sưởng', '鬲': 'Cách',
  '鬼': 'Quỷ', '魚': 'Ngư', '鱼': 'Ngư', '鳥': 'Điểu', '鸟': 'Điểu', '鹵': 'Lỗ',
  '鹿': 'Lộc', '麥': 'Mạch', '麦': 'Mạch', '麻': 'Ma', '黃': 'Hoàng', '黄': 'Hoàng',
  '黍': 'Thử', '黑': 'Hắc', '黹': 'Chỉ', '黽': 'Mãnh', '鼎': 'Đỉnh', '鼓': 'Cổ',
  '鼠': 'Thử', '鼻': 'Tị', '齊': 'Tề', '齐': 'Tề', '齒': 'Sỉ', '齿': 'Sỉ',
  '龍': 'Long', '龙': 'Long', '龜': 'Quy', '龟': 'Quy', '龠': 'Dược',
  '㇒': 'Phiệt', '㇐': 'Nhất', '㇑': 'Cổn', '㇔': 'Chủ', '㇀': 'Hất', '㇆': 'Móc',
  '古': 'Cổ', '故': 'Cố', '也': 'Dã', '𠂉': 'Bao', '乂': 'Nghệ'
};

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

  // Analysis modal states
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzingChar, setAnalyzingChar] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

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

  const handleOpenAnalysis = async (char) => {
    if (!char) return;
    setAnalyzingChar(char);
    setLoadingAnalysis(true);
    setErrorAnalysis(null);
    setShowAnalysisModal(true);
    
    try {
      const response = await fetch(`https://api.hihsk.com/api/character-tooltip/${char}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      const vocalData = data.vocals;
      
      if (vocalData && vocalData.tree) {
        let treeData = JSON.parse(vocalData.tree);
        
        // Enrichment dictionaries
        const components = vocalData.thanh_phan ? JSON.parse(vocalData.thanh_phan) : [];
        
        const enrichTree = (node) => {
          // Priority 1: From current API thanh_phan
          const comp = components.find(c => c.bo === node.name);
          if (comp) {
            node.label = comp.ten_bo.replace(/^Bộ\s+/, '').replace(/\s*\(.*\)$/, '');
          } 
          // Priority 2: From static HANZI_DICT
          else if (HANZI_DICT[node.name]) {
            node.label = HANZI_DICT[node.name];
          }
          
          if (node.children) {
            node.children.forEach(enrichTree);
          }
        };
        
        enrichTree(treeData);
        setAnalysisData(treeData);
      } else {
        setErrorAnalysis('Không có dữ liệu phân tích cây cho chữ này.');
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      setErrorAnalysis('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.');
      setAnalysisData(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleCloseAnalysis = () => {
    setShowAnalysisModal(false);
    setAnalysisData(null);
    setAnalyzingChar('');
    setLoadingAnalysis(false);
    setErrorAnalysis(null);
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
          <div key={`${activeChar.id || activeChar.character}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <button 
              onClick={() => handleOpenAnalysis(char)}
              style={{
                position: 'absolute',
                top: '-1.5rem',
                right: '-0.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              className="analysis-icon-btn"
              title={`Phân tích chữ ${char}`}
            >
              <Layers size={14} />
            </button>
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

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(30,30,40,0.95)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            color: '#f8fafc',
            position: 'relative'
          }}>
            <button
              onClick={handleCloseAnalysis}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              <XCircle size={24} />
            </button>
            <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Layers size={24} color="var(--accent-primary)" />
              Phân tích: <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{analyzingChar}</span>
            </h2>
            
            {loadingAnalysis && (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <RefreshCcw size={40} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: '#94a3b8' }}>Đang phân tích cấu trúc chữ...</p>
              </div>
            )}
            
            {errorAnalysis && <p style={{ textAlign: 'center', color: '#fca5a5', padding: '2rem 0' }}>{errorAnalysis}</p>}
            
            {analysisData && !loadingAnalysis && (
              <div style={{ marginTop: '1rem' }}>
                <HanziTree data={analysisData} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}