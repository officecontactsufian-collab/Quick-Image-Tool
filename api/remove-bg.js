// api/remove-bg.js
import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    let uploadedFile = files.image_file;
    if (Array.isArray(uploadedFile)) uploadedFile = uploadedFile[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', fs.createReadStream(uploadedFile.filepath));

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(text);
      return res.status(500).json({ error: 'Remove.bg failed' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
