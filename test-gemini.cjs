
require("@next/env").loadEnvConfig(process.cwd());

const key = process.env.GEMINI_API_KEY;

async function testGemini() {
  console.log("API key terbaca:", Boolean(key));

  if (!key) {
    console.log("GEMINI_API_KEY tidak ditemukan.");
    return;
  }

  try {
    console.log("Menghubungi Gemini dengan format permintaan aplikasi...");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Kamu asisten toko. Jawab pertanyaan dalam bahasa Indonesia, maksimal 3 kalimat. Jawab hanya berdasarkan data produk."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "DATA PRODUK:\nNama: Produk Uji\nKategori: Pakaian\nHarga: Rp100.000\nStok: tersedia\nDeskripsi: Bahan katun.\nVarian: M, L\n\nPERTANYAAN:\nApakah produk ini nyaman dipakai?"
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024
          }
        }),
        signal: AbortSignal.timeout(90000),
      }
    );

    console.log("HTTP Status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      console.log("Detail error:", JSON.stringify(result, null, 2));
      return;
    }

    const jawaban = result.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();

    console.log("Jawaban Gemini:", jawaban || "Tidak ada jawaban.");
    console.log("Model:", result.modelVersion);
    console.log("Pengujian selesai.");

  } catch (error) {
    console.log("Nama error:", error.name);
    console.log("Pesan error:", error.message);
  }
}

testGemini();
