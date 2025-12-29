const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function(event, context) {
    try {
        const body = JSON.parse(event.body);
        const imageBase64 = body.image;

        const buffer = Buffer.from(imageBase64, 'base64');

        const formData = new FormData();
        formData.append('image_file', buffer, 'image.png');
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
            body: formData
        });

        if (!response.ok) {
            const errMsg = await response.text();
            return { statusCode: 500, body: JSON.stringify({ error: errMsg }) };
        }

        const blob = await response.arrayBuffer();
        const base64 = Buffer.from(blob).toString('base64');

        return {
            statusCode: 200,
            body: JSON.stringify({ image: base64 })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};