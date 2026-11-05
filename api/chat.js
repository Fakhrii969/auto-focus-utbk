// Fungsi serverless Vercel: meneruskan chat ke Gemini tanpa membocorkan API key.
// Atur environment variable GEMINI_API_KEY di Vercel. Model bisa diganti lewat GEMINI_MODEL.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY belum diatur' });
  const { messages = [], ctx = {} } = req.body || {};
  const sys = `Kamu "AI UTBK Assistant", pembimbing UTBK/SNBT yang ramah dan ringkas. Jawab dalam bahasa Indonesia santai. Bantu materi TPS, Literasi Bahasa Indonesia/Inggris, dan Penalaran Matematika dengan langkah singkat dan trik cepat. Untuk prediksi kelulusan PTN, beri estimasi kasar berdasarkan akurasi kuis, jelaskan bahwa ini bukan jaminan, dan sarankan cek passing grade resmi. Data siswa: nama ${ctx.nama || '-'}, status ${ctx.status || '-'}, target ${ctx.target || '-'}, soal diperiksa ${ctx.soal ?? 0}, akurasi ${ctx.akurasi ?? 'belum ada'}%.`;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: messages.slice(-12).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content).slice(0, 2000) }] }))
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: (d.error && d.error.message) || 'Gagal memanggil Gemini' });
    const reply = (d.candidates?.[0]?.content?.parts || []).map(p => p.text).join('') || 'Tidak ada jawaban.';
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'Gagal terhubung ke Gemini' });
  }
};
