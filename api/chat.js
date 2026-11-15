export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, password, verifyOnly } = req.body;
    const validPassword = process.env.DASHBOARD_PASSWORD;

    // Cek kecocokan password di sisi server
    if (!validPassword || password !== validPassword) {
      return res.status(401).json({ error: "Password salah atau akses ditolak!" });
    }

    // Jika hanya mengecek login awal
    if (verifyOnly) {
      return res.status(200).json({ authenticated: true });
    }

    if (!message) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    const { Client } = await import("@gradio/client");

    const client = await Client.connect("ryuxyro/shiko-gemini", {
      hf_token: process.env.HF_TOKEN,
    });

    const result = await client.predict("/respond", {
      message: { text: message, files: [] },
    });

    return res.status(200).json({ reply: result.data });
  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({
      error: "Gagal terhubung ke Nadeshiko AI. Pastikan Space sedang menyala.",
      details: error.message,
    });
  }
}
