import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const formData = req.body;

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": "gmE4r63VDu3y98NpkNcidxdt" // المفتاح هنا فقط
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json({ error: error.errors || "API error" });
      }

      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(buffer));
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
