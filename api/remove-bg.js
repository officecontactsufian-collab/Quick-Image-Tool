import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
    // إعدادات السماح (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // جلب المفتاح من إعدادات Vercel
    const API_KEY = process.env.REMOVE_BG_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Server Config Error: API Key missing' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const formData = new FormData();
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        formData.append('image_file', buffer, 'input.png');
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const resultBuffer = await response.buffer();
        const base64Result = `data:image/png;base64,${resultBuffer.toString('base64')}`;

        res.status(200).json({ result: base64Result });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
