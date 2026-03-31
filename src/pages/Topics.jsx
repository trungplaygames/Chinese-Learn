import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Hash, ChevronLeft, Volume2, PenTool, X, EyeOff, Type, Languages, BookOpen as BookIcon } from 'lucide-react';
import { playTTS } from '../lib/tts';
import WordPractice from '../components/WordPractice';
import './Dashboard.css';

export default function Topics() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicWordModal, setTopicWordModal] = useState(null);
  const [isPracticing, setIsPracticing] = useState(false);

  const [showHanzi, setShowHanzi] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('learned_characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const groupedTopics = characters.reduce((acc, char) => {
    const topic = char.topic || 'Chưa phân loại';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(char);
    return acc;
  }, {});

  const handlePracticeToggle = () => {
    setIsPracticing(true);
  };

  const closeTopicModal = () => {
    setTopicWordModal(null);
    setIsPracticing(false);
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '3rem'}}>Đang tải...</div>;

  if (selectedTopic) {
    const topicChars = groupedTopics[selectedTopic] || [];
    return (
      <div className="dashboard">
        <button className="btn btn-secondary" onClick={() => setSelectedTopic(null)} style={{marginBottom: '2rem'}}>
          <ChevronLeft size={18} /> Quay lại thẻ Chủ đề
        </button>
        <div style={{marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Hash size={24} color="var(--accent-primary)"/> {selectedTopic} ({topicChars.length})
          </h2>
          <div className="glass-panel" style={{display: 'flex', alignItems:'center', gap: '0.75rem', padding: '0.5rem 0.75rem'}}>
             <button onClick={() => setShowHanzi(!showHanzi)} className={`toggle-btn ${showHanzi ? 'active' : ''}`} title="Ẩn/Hiện Chữ Hán"><Type size={16}/></button>
             <button onClick={() => setShowPinyin(!showPinyin)} className={`toggle-btn ${showPinyin ? 'active' : ''}`} title="Ẩn/Hiện Pinyin"><Languages size={16}/></button>
             <button onClick={() => setShowMeaning(!showMeaning)} className={`toggle-btn ${showMeaning ? 'active' : ''}`} title="Ẩn/Hiện Nghĩa"><BookIcon size={16}/></button>
          </div>
        </div>
        
        <div className="character-grid">
          {topicChars.map(item => (
            <div className="character-card glass-panel clickable" onClick={() => { setTopicWordModal(item); setIsPracticing(false); playTTS(item.character); }}>
              <div className="char-display-wrap" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80px'}}>
                {showHanzi ? (
                  <span style={{fontSize: item.character.length > 2 ? '2rem' : '3.5rem', fontWeight:'500'}}>{item.character}</span>
                ) : (
                  <EyeOff size={32} style={{opacity: 0.2}}/>
                )}
              </div>
              <div className="char-info">
                {showPinyin && <h3 className="char-pinyin">{item.pinyin}</h3>}
                {showMeaning && (
                  <>
                    <p className="char-meaning">{item.meaning}</p>
                    <span className="topic-badge">Tuần {item.week_no} - {item.session_no}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Detail for Topic View */}
        {topicWordModal && (
          <div className="modal-overlay" onClick={closeTopicModal}>
            <div className="modal-content glass-panel" style={{maxWidth: isPracticing ? '800px' : '400px', width: '90%', textAlign: 'center', transition: 'all 0.3s ease'}} onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                 <h3>{isPracticing ? 'Luyện Viết Tại Chấp' : 'Chi tiết từ vựng'}</h3>
                 <button className="close-btn" onClick={closeTopicModal}><X size={20}/></button>
               </div>
               
               {isPracticing ? (
                  <div style={{marginTop: '1.5rem'}}>
                    <WordPractice key={topicWordModal.id + "-practice"} activeChar={topicWordModal} initialDelay={500} />
                  </div>
               ) : (
                 <>
                   <div style={{marginBottom: '1.5rem', marginTop: '1rem'}}>
                      <div style={{fontSize: topicWordModal.character.length > 2 ? '3.5rem' : '5rem', lineHeight: '1.2', color: 'var(--accent-primary)'}}>
                        {topicWordModal.character}
                      </div>
                      <div style={{fontSize: '1.5rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>{topicWordModal.pinyin}</div>
                      <div style={{fontSize: '1.2rem', marginTop: '0.2rem'}}>{topicWordModal.meaning}</div>
                   </div>

                   <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem'}}>
                     <button className="btn btn-secondary" style={{width: '100%', display:'flex', justifyContent:'center'}} onClick={() => playTTS(topicWordModal.character)}>
                       <Volume2 size={20}/> Nghe Phát Âm
                     </button>
                     <button className="btn btn-primary" style={{width: '100%', display:'flex', justifyContent:'center'}} onClick={handlePracticeToggle}>
                       <PenTool size={20}/> Luyện Viết Ngay Tại Đây
                     </button>
                   </div>
                 </>
               )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Topics Học Tập</h2>
          <p className="text-secondary">AI tự động phân loại từ vựng thành các nhóm quen thuộc</p>
        </div>
      </div>

      {Object.keys(groupedTopics).length === 0 ? (
        <div className="empty-state glass-panel">
          <p>Chưa có chủ đề nào được tạo. Hãy quay lại Dashboard để thêm từ mới!</p>
        </div>
      ) : (
        <div className="character-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'}}>
          {Object.keys(groupedTopics).map(topic => (
            <div 
               key={topic} 
               className="glass-panel" 
               style={{padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1.5rem', transition: 'all 0.2s ease'}}
               onClick={() => setSelectedTopic(topic)}
               onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
               onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '14px', color: 'var(--accent-primary)'}}>
                  <Hash size={28} />
                </div>
                <div>
                  <h3 style={{fontSize: '1.35rem', margin: 0, color: 'var(--text-primary)'}}>{topic}</h3>
                  <p className="text-secondary" style={{margin: '0.2rem 0 0 0', fontSize: '0.9rem'}}>{groupedTopics[topic].length} từ vựng</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
