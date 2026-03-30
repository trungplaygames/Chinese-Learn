import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const keyLine = envFile.split('\n').find(l => l.includes('VITE_GEMINI_API_KEY'));
const key = keyLine ? keyLine.split('=')[1].trim() : '';

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
       console.log("AVAILABLE MODELS:");
       data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => console.log(m.name));
    } else {
       console.log("ERROR:", data);
    }
  })
  .catch(console.error);
