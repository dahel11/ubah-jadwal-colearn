export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLBdJio7KcqQlqA8O6YlxHcMRM-Na5oc71Sontwdx994fMHrWmRAqT3pAL3agjW1ETkw/exec';

  try {
    const rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    console.log('Raw body received:', rawBody.substring(0, 200));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawBody,
      redirect: 'follow',
    });

    const text = await response.text();
    console.log('Apps Script response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Submit proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
