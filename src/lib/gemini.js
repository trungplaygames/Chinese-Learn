const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateCharacterData(character, existingTopics = []) {
  if (!GEMINI_API_KEY) {
    throw new Error('Chưa cấu hình API Key Gemini');
  }
  
  const topicContext = existingTopics.length > 0 
    ? `Danh sách các Chủ đề hiện có: [${existingTopics.join(', ')}]. Hãy CỐ GẮNG ưu tiên chọn 1 chủ đề phù hợp nhất từ danh sách này. CHỈ khi không có chủ đề nào phù hợp mới được tạo chủ đề mới.`
    : '';

  const prompt = `Từ Vựng (Có thể chứa 1 hoặc nhiều chữ Hán): "${character}".
Hãy cung cấp Phiên âm Pinyin (nếu nhiều chữ thì cách nhau bằng khoảng trắng), Nghĩa Tiếng Việt ngắn gọn (của cụm từ này) và Phân loại Chủ đề Tiếng Việt (vài từ ngắn gọn, ví dụ: "Ẩm thực", "Động vật", "Cơ bản").
${topicContext}
Trả về kết quả bằng định dạng JSON thuần tuý (không có bất kỳ markdown hay text nào khác), với chính xác cấu trúc sau:
{"pinyin": "...", "meaning": "...", "topic": "..."}`;

  try {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    if (data.error) {
      console.error("API Error Object:", data.error);
      // Fallback cho mô hình cũ nếu 1.5-pro không chạy
      if (data.error.status === 'NOT_FOUND') {
        return handleFallbackGeminiPro(prompt);
      }
      throw new Error(data.error.message || 'Lỗi từ Gemini API');
    }

    if (data.candidates && data.candidates.length > 0) {
      let rawText = data.candidates[0].content.parts[0].text.trim();
      // Lọc bỏ markdown block ```json ... ```
      if (rawText.startsWith('```')) {
         const match = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```\n([\s\S]*?)\n```/);
         if (match) rawText = match[1];
      }
      return JSON.parse(rawText);
    }
  } catch (err) {
    console.error("Lỗi parse AI Response:", err);
    throw new Error('AI không phản hồi đúng định dạng JSON hoặc có lỗi mạng.');
  }

  throw new Error('Không nhận được dữ liệu từ AI');
}

// Hàm dự phòng cho mô hình cũ hơn
async function handleFallbackGeminiPro(prompt) {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    let rawText = data.candidates[0].content.parts[0].text.trim();
    if (rawText.startsWith('```')) {
        const match = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```\n([\s\S]*?)\n```/);
        if (match) rawText = match[1];
    }
    return JSON.parse(rawText);
}
