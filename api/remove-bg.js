import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

// إيقاف الـ Body Parser الافتراضي للسماح برفع الملفات
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
    // إعداد formidable
    const form = new IncomingForm({ 
      keepExtensions: true,
      allowEmptyFiles: false,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    });

    // قراءة الملف من الطلب
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // التعامل مع اختلاف إصدارات formidable (array vs object)
    let uploadedFile = files.image_file;
    if (Array.isArray(uploadedFile)) {
      uploadedFile = uploadedFile[0];
    }

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // تجهيز البيانات لإرسالها إلى Remove.bg
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', fs.createReadStream(uploadedFile.filepath));

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      throw new Error('API Key is missing in Environment Variables');
    }

    // إرسال الطلب إلى Remove.bg
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
      console.error('Remove.bg API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to process image with provider' });
    }

    // تحويل الصورة المستلمة إلى Buffer وإرسالها للمتصفح
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Server Error:', error);
    // إرسال JSON دائماً حتى عند الخطأ لتجنب مشكلة Unexpected token
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
