import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RotateCcw, Eye, EyeOff, Type, Languages, BookOpen } from 'lucide-react';
import { playTTS } from '../lib/tts';
import WordPractice from '../components/WordPractice';
import './Practice.css';

export default function Practice() {
  const [characters, setCharacters] = useState([]);
  const [activeChar, setActiveChar] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filterWeek, setFilterWeek] = useState('all');
  const [filterSessions, setFilterSessions] = useState([]); // Array for multi-select
  const [filterTopic, setFilterTopic] = useState('all');

  const [showHanzi, setShowHanzi] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('learned_characters')
          .select('*')
          .order('week_no', { ascending: true })
          .order('session_no', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCharacters(data || []);

        if (location.state && location.state.targetChar) {
          const target = data.find(c => c.id === location.state.targetChar.id) || location.state.targetChar;
          setActiveChar(target);
        } else if (data && data.length > 0) {
          setActiveChar(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [location.state]);



  // Lọc dữ liệu theo cả 3 tiêu chí
  const filteredChars = characters.filter(char => {
    let matchWeek = filterWeek === 'all' || (char.week_no || 1).toString() === filterWeek;
    let matchSession = filterSessions.length === 0 || filterSessions.includes(char.session_no || 'Buổi 1');
    let matchTopic = filterTopic === 'all' || (char.topic || 'Chưa phân loại') === filterTopic;
    return matchWeek && matchSession && matchTopic;
  });

  // Gom nhóm hiển thị
  const groupedCharacters = filteredChars.reduce((acc, char) => {
    const key = `Tuần ${char.week_no || 1} - ${char.session_no || 'Buổi 1'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(char);
    return acc;
  }, {});

  const allWeeks = [...new Set(characters.map(c => c.week_no || 1))].sort((a, b) => a - b);
  const allSessionsForWeek = filterWeek === 'all'
    ? [...new Set(characters.map(c => c.session_no || 'Buổi 1'))].sort()
    : [...new Set(characters.filter(c => (c.week_no || 1).toString() === filterWeek).map(c => c.session_no || 'Buổi 1'))].sort();

  const allTopics = [...new Set(characters.map(c => c.topic || 'Chưa phân loại'))].filter(Boolean);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Đang tải...</div>;

  return (
    <div className="practice-container">
      <div className="char-list-sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Lọc Từ</h3>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem', borderRadius: '6px', background: 'transparent' }}
              title="Đặt lại bộ lọc"
              onClick={() => { setFilterWeek('all'); setFilterSessions([]); setFilterTopic('all'); }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '80px' }}>
              <Select value={filterWeek} onValueChange={(val) => { setFilterWeek(val); setFilterSessions([]); }}>
                <SelectTrigger className="w-full bg-[rgba(255,255,255,0.03)] border-[#ffffff14] text-xs h-8 px-2">
                  <SelectValue placeholder="Tuần" />
                </SelectTrigger>
                <SelectContent className="bg-[#131720] border-[#ffffff14] text-[#f8fafc] text-xs">
                  <SelectItem value="all">Tất cả Tuần</SelectItem>
                  {allWeeks.map(w => <SelectItem key={w} value={w.toString()}>Tuần {w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div style={{ flex: '100%', marginTop: '0.25rem' }}>
              <Select value={filterTopic} onValueChange={(val) => setFilterTopic(val)}>
                <SelectTrigger className="w-full bg-[rgba(255,255,255,0.03)] border-[#ffffff14] text-xs h-8 px-2">
                  <SelectValue placeholder="Chủ Đề" />
                </SelectTrigger>
                <SelectContent className="bg-[#131720] border-[#ffffff14] text-[#f8fafc] text-xs">
                  <SelectItem value="all">Tất cả Chủ Đề</SelectItem>
                  {allTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Multi-select Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {allSessionsForWeek.map(s => {
              const isActive = filterSessions.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    setFilterSessions(prev => isActive ? prev.filter(x => x !== s) : [...prev, s]);
                  }}
                  className={`session-pill ${isActive ? 'active' : ''}`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* View Toggles */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem', padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setShowHanzi(!showHanzi)}
              className={`toggle-btn ${showHanzi ? 'active' : ''}`}
              title={showHanzi ? "Ẩn mặt chữ" : "Hiện mặt chữ"}
            >
              {showHanzi ? <Type size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`toggle-btn ${showPinyin ? 'active' : ''}`}
              title={showPinyin ? "Ẩn phiên âm" : "Hiện phiên âm"}
            >
              {showPinyin ? <Languages size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => setShowMeaning(!showMeaning)}
              className={`toggle-btn ${showMeaning ? 'active' : ''}`}
              title={showMeaning ? "Ẩn nghĩa" : "Hiện nghĩa"}
            >
              {showMeaning ? <BookOpen size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>

        {filteredChars.length === 0 ? (
          <p className="text-secondary" style={{ padding: '1rem' }}>Không tìm thấy từ vựng nào.</p>
        ) : (
          <div className="practice-sidebar-groups" style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
            {Object.keys(groupedCharacters).sort().map(group => (
              <div key={`group-${group}`}>
                <div className="sidebar-week-title">{group}</div>
                <ul className="char-list">
                  {groupedCharacters[group].map(char => (
                    <li
                      key={char.id}
                      className={`char-item ${activeChar?.id === char.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveChar(char);
                        playTTS(char.character);
                      }}
                    >
                      {showHanzi ? (
                        <span className="hanzi-small" style={{ fontSize: char.character.length > 2 ? '1.2rem' : '1.8rem' }}>{char.character}</span>
                      ) : (
                        <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EyeOff size={16} color="var(--text-secondary)" />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {showPinyin && <span className="pinyin-small">{char.pinyin}</span>}
                        {showMeaning && (
                          <>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{char.meaning}</span>
                            <span style={{ fontSize: '9px', color: 'var(--accent-primary)', opacity: 0.7 }}>{char.topic || 'Chưa phân loại'}</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="practice-main glass-panel">
        {activeChar ? (
          <WordPractice key={activeChar.id + "-practice"} activeChar={activeChar} initialDelay={0} />
        ) : (
          <p className="empty-state">Chọn một từ vựng bên danh sách để luyện tập.</p>
        )}
      </div>
    </div>
  );
}
