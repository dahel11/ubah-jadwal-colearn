const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz9vU6mgrKHnZprDyFF4LrMUbu7wv_DKaJOdFC0hgq_ZjAc9HMqNNA1RWEU0oz6u_Jk/exec';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const userId = req.query.user_id;

  if (
    typeof userId !== 'string' ||
    !userId.trim() ||
    userId.length > 100
  ) {
    return res.status(400).json({
      success: false,
      error: 'User ID tidak valid.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const url =
      `${APPS_SCRIPT_URL}?action=history&user_id=` +
      encodeURIComponent(userId.trim());

    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Backend riwayat tidak dapat diakses');
    }

    const data = await response.json();

    if (data.success !== true) {
      return res.status(502).json({
        success: false,
        error: data.error || 'Riwayat belum dapat dimuat.'
      });
    }

    if (!Array.isArray(data.requests)) {
      throw new Error('Respons riwayat tidak valid');
    }

    return res.status(200).json({
      success: true,
      requests: data.requests,
      hours_message: data.hours_message || ''
    });

  } catch (error) {
    const isTimeout = error.name === 'AbortError';

    return res.status(isTimeout ? 504 : 502).json({
      success: false,
      error: isTimeout
        ? 'Memuat riwayat terlalu lama. Silakan coba lagi.'
        : 'Riwayat belum dapat dimuat. Silakan coba lagi.'
    });

  } finally {
    clearTimeout(timeout);
  }
}
