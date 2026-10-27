const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwxitwa0fRjdG54j0fEkf-rX9KfxiSaNuAzo0JNhP2CwUbtRJB4h7TORhGb1Wt44f_oyA/exec';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      status: 'error',
      error: 'Method not allowed'
    });
  }

  const hp = req.query.hp;

  if (typeof hp !== 'string' || !/^\d{7,15}$/.test(hp)) {
    return res.status(400).json({
      status: 'error',
      error: 'Format nomor HP tidak valid'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const url =
      `${APPS_SCRIPT_URL}?action=lookup&hp=${encodeURIComponent(hp)}`;

    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Backend lookup tidak dapat diakses');
    }

    const data = await response.json();

    if (data.status === 'error' || data.success === false) {
      return res.status(502).json({
        status: 'error',
        error: data.error || 'Gagal membaca data murid'
      });
    }

    if (
      data.status !== 'found' &&
      data.status !== 'not_found'
    ) {
      throw new Error('Respons lookup tidak valid');
    }

    if (
      data.status === 'found' &&
      (!data.data || !data.data.user_id)
    ) {
      throw new Error('Data user_id murid belum tersedia');
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(
      error.name === 'AbortError' ? 504 : 502
    ).json({
      status: 'error',
      error: error.name === 'AbortError'
        ? 'Pencarian terlalu lama. Silakan coba lagi.'
        : 'Gagal membaca data murid. Silakan coba lagi.'
    });

  } finally {
    clearTimeout(timeout);
  }
}
