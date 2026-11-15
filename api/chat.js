export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Mengizinkan upload gambar hingga 10MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, password, verifyOnly, imageBase64, model, history } = req.body;
    const validPassword = process.env.DASHBOARD_PASSWORD;

    if (!validPassword || password !== validPassword) {
      return res.status(401).json({ error: "Password salah atau akses ditolak!" });
    }

    if (verifyOnly) {
      return res.status(200).json({ authenticated: true });
    }

    if (!message && !imageBase64) {
      return res.status(400).json({ error: "Pesan atau gambar tidak boleh kosong" });
    }

    const { Client, handle_file } = await import("@gradio/client");

    const client = await Client.connect("ryuxyro/shiko-gemini", {
      hf_token: process.env.HF_TOKEN,
    });

    // Jika ada gambar base64 dari frontend, ubah menjadi Blob agar bisa diunggah ke Gradio
    let filesArray = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
      const buffer = Buffer.from(base64Data, "base64");
      const blob = new Blob([buffer], { type: mimeType });
      filesArray.push(handle_file(blob));
    }

    const result = await client.predict("/respond", {
      message: { text: message || "", files: filesArray },
      model_choice: model || "gemini-3.5-flash-lite",
      history_json: JSON.stringify(history || []),
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
