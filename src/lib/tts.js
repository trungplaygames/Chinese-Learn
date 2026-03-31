// src/lib/tts.js - Quản lý Giọng nói Toàn Dự án

let selectedVoice = null;
const VOICE_KEY = 'pref_chinese_voice_name';
const ENGINE_KEY = 'pref_tts_engine'; // 'system' or 'google'

/**
 * Kiểm tra cấu hình Engine đang dùng
 */
export const getTTSEngine = () => {
    return localStorage.getItem(ENGINE_KEY) || 'system';
};

export const setTTSEngine = (engine) => {
    localStorage.setItem(ENGINE_KEY, engine);
};
export const getChineseVoices = () => {
    return window.speechSynthesis.getVoices().filter(voice => 
        voice.lang.includes('zh') || 
        voice.lang.includes('zho') || 
        voice.lang.includes('chi')
    );
};

/**
 * Tìm và thiết lập giọng nói ưu tiên (từ localStorage hoặc tự động)
 */
export const loadVoicePreference = () => {
    const voices = getChineseVoices();
    if (voices.length === 0) return null;

    const savedName = localStorage.getItem(VOICE_KEY);
    if (savedName) {
        const found = voices.find(v => v.name === savedName);
        if (found) {
            selectedVoice = found;
            return selectedVoice;
        }
    }

    // Nếu chưa có hoặc không tìm thấy, tự động chọn giọng "Google" hoặc giọng đầu tiên
    const googleVoice = voices.find(v => v.name.includes('Google'));
    selectedVoice = googleVoice || voices[0];
    return selectedVoice;
};

/**
 * Lưu lựa chọn giọng nói mới
 */
export const saveVoicePreference = (voiceName) => {
    const voices = getChineseVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
        selectedVoice = voice;
        localStorage.setItem(VOICE_KEY, voiceName);
    }
};

/**
 * Hàm phát âm dùng chung toàn dự án
 */
export const playTTS = (text, rate = 1.0) => {
    const engine = getTTSEngine();

    // Nếu dùng Google AI Engine (Neural)
    if (engine === 'google') {
        playGoogleTTS(text);
        return;
    }

    // Nếu dùng Hệ thống (SpeechSynthesis)
    if (!('speechSynthesis' in window)) return;

    // Trước khi đọc, đảm bảo đã load giọng
    if (!selectedVoice) {
        loadVoicePreference();
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Áp dụng giọng nói đã chọn
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
    } else {
        utterance.lang = 'zh-CN';
    }

    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
};

/**
 * Phát âm bằng Google Translation Neural API (Chất lượng Cao)
 */
const playGoogleTTS = (text) => {
    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`;
        const audio = new Audio(url);
        audio.play().catch(err => {
            console.error("Google TTS failed, falling back to system...", err);
            // Fallback to system if audio fails (like No Internet)
            forceSystemTTS(text);
        });
    } catch (e) {
        forceSystemTTS(text);
    }
};

/**
 * Hàm ép buộc dùng hệ thống để dự phòng
 */
const forceSystemTTS = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
};
