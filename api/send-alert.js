function sendJson(res, statusCode, body) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json(body);
}

function isValidAlertPayload(payload) {
  return payload
    && typeof payload.case_id === 'string'
    && payload.case_id.trim().length > 0
    && typeof payload.knelpunt_stap === 'string'
    && payload.knelpunt_stap.trim().length > 0
    && Number.isFinite(payload.risico_percentage)
    && Number.isFinite(payload.huidige_duur_uren)
    && typeof payload.timestamp_alert === 'string'
    && !Number.isNaN(Date.parse(payload.timestamp_alert));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed. Gebruik POST.'
    });
  }

  if (!process.env.MAKE_WEBHOOK_URL) {
    return sendJson(res, 503, {
      success: false,
      configured: false,
      error: 'MAKE_WEBHOOK_URL is niet geconfigureerd.'
    });
  }

  const payload = req.body;
  if (!isValidAlertPayload(payload)) {
    return sendJson(res, 400, {
      success: false,
      error: 'Ongeldige alertpayload.'
    });
  }

  const alertPayload = {
    case_id: payload.case_id.trim(),
    knelpunt_stap: payload.knelpunt_stap.trim(),
    risico_percentage: payload.risico_percentage,
    huidige_duur_uren: payload.huidige_duur_uren,
    timestamp_alert: payload.timestamp_alert
  };

  try {
    const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload)
    });

    if (!response.ok) {
      return sendJson(res, 502, {
        success: false,
        error: `Make webhook reageerde met HTTP ${response.status}.`
      });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('Make webhook request mislukt:', error);
    return sendJson(res, 502, {
      success: false,
      error: 'De Make webhook kon niet worden bereikt.'
    });
  }
};
