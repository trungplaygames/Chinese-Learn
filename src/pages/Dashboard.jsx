import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import HanziDisplay from '../components/HanziDisplay';
import { generateCharacterData } from '../lib/gemini';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WordPractice from '../components/WordPractice';
import { playTTS, getChineseVoices, saveVoicePreference, loadVoicePreference, getTTSEngine, setTTSEngine } from '../lib/tts';
import { Plus, X, Folder, BookOpen, Wand2, Volume2, Edit2, Trash2, Filter, PenTool, Settings, Sparkles, Cpu, EyeOff, Type, Languages, BookOpen as BookIcon } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [modalTitle, setModalTitle] = useState('Thêm Từ Mới');
  const [isPracticing, setIsPracticing] = useState(false);
  
  const [addingChar, setAddingChar] = useState(false);
  const [loadingAutofill, setLoadingAutofill] = useState(false);
  const [filterWeek, setFilterWeek] = useState('all');
  
  const [showHanzi, setShowHanzi] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentVoiceName, setCurrentVoiceName] = useState('');
  const [currentTTSEngine, setCurrentTTSEngine] = useState('system'); // 'system' or 'google'

  const [newChar, setNewChar] = useState({ 
    character: '', pinyin: '', meaning: '', topic: '',
    week_no: 1, session_no: 'Buổi 1'
  });

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
    
    // Khởi tạo giọng nói
    const initVoices = () => {
      const v = getChineseVoices();
      setAvailableVoices(v);
      const pref = loadVoicePreference();
      if (pref) setCurrentVoiceName(pref.name);
      setCurrentTTSEngine(getTTSEngine());
    };

    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }, []);

  const handleVoiceChange = (name) => {
    saveVoicePreference(name);
    setCurrentVoiceName(name);
    playTTS("你好", 1); 
  };

  const handleEngineChange = (engine) => {
    setTTSEngine(engine);
    setCurrentTTSEngine(engine);
    playTTS("你好");
  };

  const openAppModal = () => {
    setIsQuickAdd(false);
    setNewChar({ character: '', pinyin: '', meaning: '', topic: '', week_no: 1, session_no: 'Buổi 1' });
    setShowAddModal(true);
  };

  const openAddSession = (week_no) => {
    setIsQuickAdd(false);
    setNewChar({ character: '', pinyin: '', meaning: '', topic: '', week_no, session_no: 'Buổi ' });
    setModalTitle(`Thêm Buổi mới cho Tuần ${week_no}`);
    setShowAddModal(true);
  };

  const openQuickAdd = (week_no, session_no) => {
    setIsQuickAdd(true);
    setNewChar({ character: '', pinyin: '', meaning: '', topic: '', week_no, session_no });
    setModalTitle(`Thêm vào ${session_no} (Tuần ${week_no})`);
    setShowAddModal(true);
  };

  const handleAutoFill = async (targetChar) => {
    const char = targetChar || newChar.character;
    if (!char) return;
    setLoadingAutofill(true);
    try {
       // Lấy các chủ đề đã có (Extract existing topics)
       const existingTopics = [...new Set(characters.map(c => c.topic))].filter(Boolean);
       const aiRes = await generateCharacterData(char, existingTopics);
       
       if (selectedWord) {
          setSelectedWord(prev => ({...prev, pinyin: aiRes.pinyin, meaning: aiRes.meaning, topic: aiRes.topic}));
       } else {
          setNewChar(prev => ({...prev, pinyin: aiRes.pinyin, meaning: aiRes.meaning, topic: aiRes.topic}));
       }
    } catch(err) {
       alert(err.message);
    } finally {
       setLoadingAutofill(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newChar.character) return;
    setAddingChar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Xin vui lòng đăng nhập!");

      const insertData = { ...newChar, user_id: user.id };
      delete insertData.id;

      const { error } = await supabase.from('learned_characters').insert([insertData]);
      if (error) throw error;
      
      setShowAddModal(false);
      setNewChar({ ...newChar, character: '', pinyin: '', meaning: '', topic: '' });
      fetchCharacters();
    } catch (err) {
      console.error(err);
      alert('Error adding character: ' + err.message);
    } finally {
      setAddingChar(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWord || !selectedWord.id) return;
    try {
      const { id, user_id, created_at, ...updateFields } = selectedWord;
      const { error } = await supabase
        .from('learned_characters')
        .update(updateFields)
        .eq('id', id);
      
      if (error) throw error;
      setSelectedWord(null);
      fetchCharacters();
    } catch(err) {
      alert('Update Error: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedWord || !selectedWord.id) return;
    if (!window.confirm("Bạn có chắc muốn xoá từ này?")) return;
    try {
      const { error } = await supabase.from('learned_characters').delete().eq('id', selectedWord.id);
      if (error) throw error;
      setSelectedWord(null);
      fetchCharacters();
    } catch(err) {
      alert("Delete error: " + err.message);
    }
  };

  const openEditModal = (item) => {
    setSelectedWord(item);
    setIsPracticing(false);
    playTTS(item.character);
  };

  const closeEditModal = () => {
    setSelectedWord(null);
    setIsPracticing(false);
  };

  const handlePracticeToggle = () => {
    setIsPracticing(true);
  };

  const filteredChars = filterWeek === 'all' ? characters : characters.filter(c => c.week_no == filterWeek);
  
  const groupedCharacters = filteredChars.reduce((acc, char) => {
    const week = char.week_no || 1;
    const session = char.session_no || 'Buổi 1';
    if (!acc[week]) acc[week] = {};
    if (!acc[week][session]) acc[week][session] = [];
    acc[week][session].push(char);
    return acc;
  }, {});

  const allWeeks = [...new Set(characters.map(c => c.week_no || 1))].sort((a,b)=>a-b);

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between'}}>
        <div style={{minWidth: '200px'}}>
          <h2>My Journey</h2>
          <p className="text-secondary">Track your vocabulary by week and session</p>
        </div>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
          {allWeeks.length > 0 && (
             <div className="glass-panel" style={{display: 'flex', alignItems:'center', gap: '0.75rem', padding: '0.5rem 1.1rem'}}>
               <Filter size={18} style={{color: 'var(--text-secondary)'}}/>
               <Select value={filterWeek} onValueChange={(val) => setFilterWeek(val)}>
                 <SelectTrigger className="w-[140px] border-0 bg-transparent text-[#f8fafc] focus:ring-0 focus:ring-offset-0 px-0 h-auto shadow-none text-base font-medium">
                   <SelectValue placeholder="Tất cả tuần" />
                 </SelectTrigger>
                 <SelectContent className="bg-[#131720] border-[#ffffff14] text-[#f8fafc] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                   <SelectItem value="all" className="focus:bg-[#ec4899]/20 focus:text-white cursor-pointer py-2 font-medium">Tất cả tuần</SelectItem>
                   {allWeeks.map(w => <SelectItem key={w} value={w.toString()} className="focus:bg-[#ec4899]/20 focus:text-white cursor-pointer py-2 font-medium">Tuần {w}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
          )}
          <div className="glass-panel" style={{display: 'flex', alignItems:'center', gap: '0.75rem', padding: '0.5rem 0.75rem'}}>
             <button onClick={() => setShowHanzi(!showHanzi)} className={`toggle-btn ${showHanzi ? 'active' : ''}`} title="Ẩn/Hiện Chữ Hán"><Type size={16}/></button>
             <button onClick={() => setShowPinyin(!showPinyin)} className={`toggle-btn ${showPinyin ? 'active' : ''}`} title="Ẩn/Hiện Pinyin"><Languages size={16}/></button>
             <button onClick={() => setShowMeaning(!showMeaning)} className={`toggle-btn ${showMeaning ? 'active' : ''}`} title="Ẩn/Hiện Nghĩa & Topic"><BookIcon size={16}/></button>
          </div>
          <button className="btn btn-primary" onClick={() => { setModalTitle('Thêm Từ Mới'); openAppModal(); }}>
            <Plus size={18} /> Thêm Mới
          </button>
          <button className="btn btn-secondary" style={{padding: '0.6rem'}} onClick={() => setShowVoiceSettings(true)}>
             <Settings size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', marginTop: '3rem'}}>Đang tải...</div>
      ) : characters.length === 0 ? (
        <div className="empty-state glass-panel">
          <p>Bạn chưa thêm từ vựng nào. Hãy bắt đầu học nhé!</p>
        </div>
      ) : (
        <div className="journey-view">
          {Object.keys(groupedCharacters).sort((a,b) => a - b).map(week => (
            <div key={week} className="week-group">
              <h3 className="week-title" style={{display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Folder size={20} className="week-icon"/> Tuần {week}</span>
                <button className="btn btn-secondary" style={{padding: '0.35rem 0.8rem', fontSize: '0.8rem', opacity: 0.8}} onClick={() => openAddSession(week)}>
                   <Plus size={14}/> Thêm Buổi
                </button>
              </h3>
              
              <div className="sessions-container">
                {Object.keys(groupedCharacters[week]).sort().map(session => (
                   <div key={session} className="session-group glass-panel">
                     <h4 className="session-title pb-2 border-b border-white/5">
                       <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><BookOpen size={16} /> {session}</span>
                     </h4>
                     
                     <div className="character-grid mini-grid mt-4">
                      {groupedCharacters[week][session].map(item => (
                        <div key={item.id} className="character-card small-card clickable" onClick={() => openEditModal(item)}>
                          <div className="char-display-wrap">
                            {showHanzi ? (
                              <span style={{fontSize: item.character.length > 2 ? '2rem' : '3.5rem', fontWeight:'500'}}>{item.character}</span>
                            ) : (
                              <div style={{height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <EyeOff size={32} style={{opacity: 0.2}}/>
                              </div>
                            )}
                          </div>
                          <div className="char-info">
                            {showPinyin && <h3 className="char-pinyin">{item.pinyin}</h3>}
                            {showMeaning && (
                              <>
                                <p className="char-meaning">{item.meaning}</p>
                                {item.topic && <span className="topic-badge">{item.topic}</span>}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Thẻ Thêm Từ Nhanh (Dashed Card) */}
                      <div className="character-card small-card add-word-card" onClick={() => openQuickAdd(week, session)}>
                         <Plus size={32} color="var(--accent-primary)" style={{opacity: 0.6}}/>
                         <span style={{fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6, fontWeight: 500}}>Thêm Từ</span>
                      </div>
                     </div>

                   </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAdd} className="add-char-form">
              {!isQuickAdd && (
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Tuần</label>
                    <input type="number" min="1" className="input-field" 
                      value={newChar.week_no} onChange={e => setNewChar({...newChar, week_no: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>Buổi</label>
                    <input type="text" className="input-field" placeholder="VD: Buổi 1"
                      value={newChar.session_no} onChange={e => setNewChar({...newChar, session_no: e.target.value})} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Chữ Hán</label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="text" className="input-field" style={{flex: 1}}
                    value={newChar.character} onChange={e => setNewChar({...newChar, character: e.target.value})} required />
                  <button type="button" className="btn btn-secondary" onClick={() => handleAutoFill()} disabled={loadingAutofill || !newChar.character}>
                    <Wand2 size={16}/> {loadingAutofill ? 'AI...' : 'Auto Fill'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Pinyin</label>
                <input type="text" className="input-field" 
                  value={newChar.pinyin} onChange={e => setNewChar({...newChar, pinyin: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Nghĩa</label>
                <input type="text" className="input-field" 
                  value={newChar.meaning} onChange={e => setNewChar({...newChar, meaning: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Chủ đề (AI)</label>
                <input type="text" className="input-field" 
                  value={newChar.topic} onChange={e => setNewChar({...newChar, topic: e.target.value})} required />
              </div>

              <div style={{marginTop: '1rem'}}>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={addingChar}>
                  {addingChar ? 'Đang lưu...' : 'Lưu Từ Vựng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Detail Modal */}
      {selectedWord && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content glass-panel" style={{maxWidth: isPracticing ? '800px' : '450px', width: '90%', transition: 'all 0.3s ease'}} onClick={e => e.stopPropagation()}>
             <div className="modal-header">
               <h3>{isPracticing ? 'Luyện Tập Ngay' : 'Chi tiết Từ Vựng'}</h3>
               <button className="close-btn" onClick={closeEditModal}><X size={20}/></button>
             </div>

             {isPracticing ? (
               <div style={{marginTop: '1.5rem'}}>
                 <WordPractice key={selectedWord.id + "-practice"} activeChar={selectedWord} initialDelay={500} />
               </div>
             ) : (
               <>
                 <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
                    <div style={{fontSize: selectedWord.character.length > 2 ? '3.5rem' : '5rem', lineHeight: '1.2', color: 'var(--accent-primary)'}}>{selectedWord.character}</div>
                    <div style={{display:'flex', justifyContent:'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                      <button className="btn btn-secondary" onClick={() => playTTS(selectedWord.character)}>
                        <Volume2 size={18}/> Phát âm
                      </button>
                      <button className="btn btn-primary" onClick={handlePracticeToggle}>
                        <PenTool size={18}/> Tập Viết Tại Chỗ
                      </button>
                    </div>
                 </div>

                 <div className="add-char-form">
                   <div style={{display: 'flex', gap: '1rem'}}>
                     <div className="form-group" style={{flex: 1}}>
                       <label>Pinyin</label>
                       <input type="text" className="input-field" 
                         value={selectedWord.pinyin} onChange={e => setSelectedWord({...selectedWord, pinyin: e.target.value})} required />
                     </div>
                     <div className="form-group" style={{flex: 1}}>
                       <label>Chủ đề</label>
                       <input type="text" className="input-field" 
                         value={selectedWord.topic} onChange={e => setSelectedWord({...selectedWord, topic: e.target.value})} />
                     </div>
                   </div>

                   <div className="form-group">
                     <label>Nghĩa Tiếng Việt</label>
                     <input type="text" className="input-field" 
                       value={selectedWord.meaning} onChange={e => setSelectedWord({...selectedWord, meaning: e.target.value})} required />
                   </div>

                   <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                     <button className="btn" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', flex: 1, display:'flex', justifyContent:'center'}} onClick={handleDelete}>
                       <Trash2 size={18}/> Xoá
                     </button>
                     <button className="btn btn-primary" style={{flex: 2, display:'flex', justifyContent:'center'}} onClick={handleUpdate}>
                       <Edit2 size={18}/> Lưu Thay Đổi
                     </button>
                   </div>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="modal-overlay" onClick={() => setShowVoiceSettings(false)}>
           <div className="modal-content glass-panel" style={{maxWidth: '450px'}} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                 <h3>Cài đặt Giọng đọc</h3>
                 <button className="close-btn" onClick={() => setShowVoiceSettings(false)}><X size={20}/></button>
              </div>
              
              <div className="p-4" style={{marginTop: '1rem'}}>
                 <div className="form-group" style={{marginBottom: '2rem'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                       <Sparkles size={16} className="text-pink-400" /> Chế độ giọng đọc
                    </label>
                    <div style={{display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '12px'}}>
                       <button 
                          className={`btn ${currentTTSEngine === 'google' ? 'btn-primary' : 'btn-ghost'}`}
                          style={{flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
                          onClick={() => handleEngineChange('google')}
                       >
                          <Sparkles size={14} /> AI Cao cấp
                       </button>
                       <button 
                          className={`btn ${currentTTSEngine === 'system' ? 'btn-primary' : 'btn-ghost'}`}
                          style={{flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
                          onClick={() => handleEngineChange('system')}
                       >
                          <Cpu size={14} /> Hệ thống
                       </button>
                    </div>
                 </div>

                 {currentTTSEngine === 'system' && (
                    <div className="form-group animate-in fade-in slide-in-from-top-2 duration-300">
                       <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'}}>
                          Danh sách giọng tiếng Trung khả dụng
                       </label>
                       <Select value={currentVoiceName} onValueChange={handleVoiceChange}>
                          <SelectTrigger className="w-full bg-slate-800/40 border-white/10 text-white h-12">
                             <SelectValue placeholder="Chọn một giọng đọc" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#131720] border-white/10 text-white max-h-[300px] z-[2000]">
                             {availableVoices.map(voice => (
                                <SelectItem key={voice.name} value={voice.name} className="focus:bg-white/10 cursor-pointer">
                                   {voice.name} ({voice.lang})
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                 )}

                 {currentTTSEngine === 'google' && (
                    <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                       <p className="text-secondary" style={{fontSize: '0.85rem', margin: 0}}>
                          Chế độ AI sử dụng giọng đọc <strong>Neural (High-Quality)</strong> của Google. 
                          Giọng này vô cùng tự nhiên, chuẩn xác nhưng cần có kết nối mạng để tải âm thanh.
                       </p>
                    </div>
                 )}
                 
                 <div style={{marginTop: '2rem'}}>
                    <button className="btn btn-primary" style={{width: '100%'}} onClick={() => setShowVoiceSettings(false)}>
                        Hoàn tất
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
