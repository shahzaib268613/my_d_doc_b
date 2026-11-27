export type EmailDetailRow = {
  label: string
  value: string
}

export type EmailTemplateInput = {
  /** Shown in the email header banner */
  title: string
  /** Optional preview text for inbox clients */
  preheader?: string
  /** Main HTML body (already escaped where needed) */
  bodyHtml: string
  /** Optional note under the header (e.g. destination context) */
  introHtml?: string
  /** Extra footer content (e.g. unsubscribe link) */
  footerHtml?: string
  brandName?: string
  brandTagline?: string
}

const DEFAULT_BRAND = 'My Diabetes Doc'
const DEFAULT_TAGLINE = 'Diabetes education and medical media'

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Builds a consistent key/value table for admin notification emails. */
export function buildEmailDetailsTable(rows: EmailDetailRow[]) {
  const cells = rows
    .map(
      (row) => `<tr>
  <td style="padding:10px 14px;border:1px solid #d7e3ee;background:#f4f8fb;font-weight:600;color:#1b2f43;vertical-align:top;width:36%;font-size:14px;">
    ${escapeHtml(row.label)}
  </td>
  <td style="padding:10px 14px;border:1px solid #d7e3ee;color:#24384c;vertical-align:top;font-size:14px;line-height:1.5;white-space:pre-wrap;">
    ${escapeHtml(row.value || '—')}
  </td>
</tr>`,
    )
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0;width:100%;">
  ${cells}
</table>`
}

/**
 * Shared branded HTML shell used for every outbound email.
 */
export function renderEmailTemplate(input: EmailTemplateInput): string {
  const brandName = input.brandName ?? DEFAULT_BRAND
  const brandTagline = input.brandTagline ?? DEFAULT_TAGLINE
  const preheader = input.preheader?.trim() || input.title
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef3f7;font-family:Arial,Helvetica,sans-serif;color:#1b2f43;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#eef3f7;width:100%;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d7e3ee;box-shadow:0 8px 24px rgba(27,47,67,0.08);">
          <tr>
            <td style="padding:22px 28px;background:linear-gradient(135deg,#1b2f43 0%,#24384c 55%,#2f4d66 100%);color:#ffffff;">
              <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;font-weight:700;">
                ${escapeHtml(brandName)}
              </p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">
                ${escapeHtml(input.title)}
              </h1>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.5;opacity:0.85;">
                ${escapeHtml(brandTagline)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${
                input.introHtml
                  ? `<div style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4b6074;">${input.introHtml}</div>`
                  : ''
              }
              <div style="font-size:14px;line-height:1.6;color:#1b2f43;">
                ${input.bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;background:#f7fafc;border-top:1px solid #e5eef5;">
              ${
                input.footerHtml
                  ? `<div style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#6b7c8f;">${input.footerHtml}</div>`
                  : ''
              }
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7c8f;">
                © ${year} ${escapeHtml(brandName)}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
