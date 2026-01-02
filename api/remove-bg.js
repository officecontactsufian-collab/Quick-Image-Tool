import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // Disabling Vercel's default parser to allow formidable to work
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing file upload' });
    }

    // "image_file" matches the name used in script.js formData.append
    const file = files.image_file;
    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Depending on formidable version, file might be an array or object
    const uploadedFile = Array.isArray(file) ? file[0] : file;

    try {
      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', fs.createReadStream(uploadedFile.filepath));

      const apiKey = process.env.REMOVE_BG_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: 'Server API key configuration missing' });
      }

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg Error:', errorText);
        return res.status(response.status).json({ error: 'Failed to process image with provider' });
      }

      const buffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(buffer));

    } catch (apiError) {
      console.error('API Request Error:', apiError);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
