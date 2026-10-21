export const config = {
  api: {
    bodyParser: false
  }
};

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz9vU6mgrKHnZprDyFF4LrMUbu7wv_DKaJOdFC0hgq_ZjAc9HMqNNA1RWEU0oz6u_Jk/exec';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  let payload;

  try {
    const chunks = [];
    let size = 0;

    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      size += buffer.length;

      if (size > 32768) {
        return res.status(413).json({
          success: false,
          error: 'Data pengajuan terlalu besar.'
        });
      }

      chunks.push(buffer);
    }

    payload = JSON.parse(
      Buffer.concat(chunks).toString('utf8')
    );

    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      payload.action !== 'submit' ||
      typeof payload.user_id !== 'string' ||
      !payload.user_id.trim() ||
      typeof payload.submission_key !== 'string' ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(payload.submission_key) ||
      typeof payload.alasan !== 'string' ||
      !payload.alasan.trim() ||
      !payload.jadwalBaru ||
      typeof payload.jadwalBaru !== 'object' ||
      Array.isArray(payload.jadwalBaru)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Data pengajuan belum lengkap.'
      });
    }

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Data pengajuan tidak valid.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Backend tidak dapat diakses');
    }

    const data = await response.json();

    if (data.success !== true) {
      return res.status(502).json({
        success: false,
        error: data.error || 'Pengajuan belum berhasil disimpan.'
      });
    }

    if (
      typeof data.request_id !== 'string' ||
      !data.request_id
    ) {
      throw new Error('Respons pengajuan tidak valid');
    }

    return res.status(200).json(data);

  } catch (error) {
    const isTimeout = error.name === 'AbortError';

    return res.status(isTimeout ? 504 : 502).json({
      success: false,
      error: isTimeout
        ? 'Belum ada konfirmasi penyimpanan. Silakan perbarui riwayat sebelum mencoba lagi.'
        : 'Penyimpanan belum dapat dikonfirmasi. Silakan perbarui riwayat sebelum mencoba lagi.'
    });

  } finally {
    clearTimeout(timeout);
  }
}
