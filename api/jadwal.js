export default async function handler(req, res) {
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkjL5zqCQPUotl_vXVupZRGy3RIIScoGa9evcy7Qdl2srmArGeWFqYD3jseOsHKCSqlQ/exec';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const HARI = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' });
    const text = await upstream.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: 'Apps Script tidak mengembalikan JSON',
        upstreamStatus: upstream.status,
        preview: text.slice(0, 300)
      });
    }

    const semua = Array.isArray(parsed) ? parsed : (parsed.jadwal || parsed.data || []);

    // Buang baris kosong, slot penuh, dan slot Not available
    const jadwal = semua.filter(function (s) {
      if (!s.slot_name || String(s.slot_name).trim() === '') return false;
      if (String(s.status).trim() !== 'Available') return false;
      const kursi = parseInt(s.sisa_kursi, 10);
      return !isNaN(kursi) && kursi > 0;
    });

    // Urutkan: hari dulu, lalu jam
    jadwal.sort(function (a, b) {
      const hariA = HARI[String(a.days).split(',')[0].trim()] || 99;
      const hariB = HARI[String(b.days).split(',')[0].trim()] || 99;
      if (hariA !== hariB) return hariA - hariB;
      return String(a.session_time).localeCompare(String(b.session_time));
    });

    return res.status(200).json(jadwal);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
