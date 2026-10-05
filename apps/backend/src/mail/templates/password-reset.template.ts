export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Лист із кодом скидання пароля. Презентація винесена з транспорту: будь-який
 * провайдер (Gmail/Resend) рендерить лист цією функцією. HTML — email-safe:
 * table-layout + інлайн-стилі, без зовнішнього CSS.
 */
export function passwordResetEmail(
  code: string,
  ttlMinutes: number,
): RenderedEmail {
  const subject = 'Код для скидання пароля — CarCalculator';

  const text =
    `Ваш код для скидання пароля: ${code}\n\n` +
    `Код дійсний ${ttlMinutes} хв. Якщо ви не запитували скидання — ` +
    `просто проігноруйте цей лист.`;

  const html = `<!doctype html>
<html lang="uk">
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;">
                <div style="font-size:18px;font-weight:700;color:#0d9488;">🚗 CarCalculator</div>
                <h1 style="margin:16px 0 8px;font-size:20px;color:#1e293b;">Скидання пароля</h1>
                <p style="margin:0;color:#475569;font-size:14px;">Ваш код для скидання пароля:</p>
                <div style="margin:16px 0;padding:16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:#0f766e;font-family:'Courier New',monospace;">${code}</div>
                <p style="margin:0;color:#64748b;font-size:14px;">Код дійсний <b>${ttlMinutes} хв</b>.</p>
                <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">Якщо ви не запитували скидання пароля — просто проігноруйте цей лист.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
