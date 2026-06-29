// api/lookup.js
// Vercel serverless function: proxy lookup murid ke Google Apps Script
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwf0JwNLm2MLzXEu49H63fwEaA_UIzemO0hmQkWdP06v6vzJLYndFM0_rikoADHIA1j/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hp } = req.query;
  if (!hp || !/^\d{7,14}$/.test(hp)) {
    return res.status(400).json({ found: false, error: 'Invalid HP format' });
  }

  try {
    const url      = `${APPS_SCRIPT_URL}?action=lookup&hp=${encodeURIComponent(hp)}`;
    const response = await fetch(url, { redirect: 'follow' });
    const data     = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({ found: false, error: err.message });
  }
}
