// api/jadwal.js
// Vercel serverless function: proxy ke Google Apps Script untuk ambil data jadwal
// Menghindari CORS issue di browser

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxLBdJio7KcqQlqA8O6YlxHcMRM-Na5oc71Sontwdx994fMHrWmRAqT3pAL3agjW1ETkw/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Jadwal fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
