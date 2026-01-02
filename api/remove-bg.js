// api/remove-bg.js
import fetch from 'node-fetch';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send('Error parsing file');

    try {
      const file = files.image_file;
      const formData = new FormData();
      formData.append('image_file', fs.createReadStream(file.filepath));
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).send(text);
      }

      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(buffer));

    } catch (e) {
      res.status(500).send('Error removing background');
    }
  });
}
