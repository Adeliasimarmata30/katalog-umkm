// Pemanggilan Gemini API. File ini hanya boleh dipakai di server.
const URL_API = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const BATAS_WAKTU_MS = 60000;

export class GeminiError extends Error {}

export async function tanyaGemini({ instruksi, pesan }) {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) {
    throw new GeminiError("Fitur AI belum aktif karena GEMINI_API_KEY belum diatur.");
  }

  let respons;
  try {
    respons = await fetch(`${URL_API}/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruksi }] },
        contents: [{ role: "user", parts: [{ text: pesan }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
  } catch (err) {
    console.error("Gagal menghubungi Gemini:", err);
    throw new GeminiError(
      err.name === "TimeoutError"
        ? "AI terlalu lama menjawab. Silakan coba lagi."
        : "AI belum bisa dihubungi. Silakan coba lagi."
    );
  }

  if (!respons.ok) {
    console.error("Gemini menolak permintaan:", respons.status, await respons.text());
    throw new GeminiError("AI belum bisa menjawab. Silakan coba lagi.");
  }

  const hasil = await respons.json();
  const teks = hasil.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!teks) {
    throw new GeminiError("AI tidak memberikan jawaban. Silakan coba lagi.");
  }
  return teks;
}
