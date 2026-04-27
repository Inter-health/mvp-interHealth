import logging
import os

import resend

logger = logging.getLogger(__name__)


def send_demo_request_notification(
    company_name: str,
    role: str,
    doctor_count: str,
    email: str,
) -> None:
    """Notifica o time comercial sobre nova solicitação de demo.
    Falha silenciosa — não deve bloquear o fluxo principal.
    """
    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    _FROM = os.environ.get("EMAIL_FROM", "InterHealth <noreply@interhealth.com.br>")
    _SALES_EMAIL = os.environ.get("SALES_EMAIL", "")

    if not _SALES_EMAIL:
        logger.warning("SALES_EMAIL não configurado — e-mail de notificação não enviado.")
        return

    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#F4F6F8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0"
                 style="background:#fff;border-radius:12px;overflow:hidden;
                        box-shadow:0 2px 16px rgba(0,0,0,.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#2ECC71,#26A69A);
                         padding:32px 40px;text-align:center;">
                <p style="margin:0;font-size:13px;font-weight:700;
                           letter-spacing:2px;color:rgba(255,255,255,.75);
                           text-transform:uppercase;">InterHealth</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;">
                  Nova Solicitação de Demo
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 24px;">
                <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                  Uma empresa demonstrou interesse na plataforma InterHealth.
                  Segue abaixo os dados preenchidos no formulário:
                </p>

                <table width="100%" cellpadding="0" cellspacing="0"
                       style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
                  <tr style="background:#F9FAFB;">
                    <td style="padding:12px 16px;font-size:11px;font-weight:700;
                               color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;
                               border-bottom:1px solid #E5E7EB;width:40%;">Campo</td>
                    <td style="padding:12px 16px;font-size:11px;font-weight:700;
                               color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;
                               border-bottom:1px solid #E5E7EB;">Valor</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;font-size:13px;color:#6B7280;
                               border-bottom:1px solid #F3F4F6;">Empresa</td>
                    <td style="padding:14px 16px;font-size:14px;font-weight:600;
                               color:#111827;border-bottom:1px solid #F3F4F6;">{company_name}</td>
                  </tr>
                  <tr style="background:#FAFAFA;">
                    <td style="padding:14px 16px;font-size:13px;color:#6B7280;
                               border-bottom:1px solid #F3F4F6;">Cargo</td>
                    <td style="padding:14px 16px;font-size:14px;font-weight:600;
                               color:#111827;border-bottom:1px solid #F3F4F6;">{role}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;font-size:13px;color:#6B7280;
                               border-bottom:1px solid #F3F4F6;">Nº de Médicos</td>
                    <td style="padding:14px 16px;font-size:14px;font-weight:600;
                               color:#111827;border-bottom:1px solid #F3F4F6;">{doctor_count}</td>
                  </tr>
                  <tr style="background:#FAFAFA;">
                    <td style="padding:14px 16px;font-size:13px;color:#6B7280;">E-mail</td>
                    <td style="padding:14px 16px;">
                      <a href="mailto:{email}"
                         style="font-size:14px;font-weight:600;color:#2ECC71;
                                text-decoration:none;">{email}</a>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <div style="margin-top:28px;text-align:center;">
                  <a href="mailto:{email}?subject=Demo InterHealth — {company_name}"
                     style="display:inline-block;background:#2ECC71;color:#fff;
                            font-size:14px;font-weight:700;text-decoration:none;
                            padding:14px 32px;border-radius:8px;
                            box-shadow:0 4px 12px rgba(46,204,113,.35);">
                    Responder ao Lead
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #F3F4F6;
                         text-align:center;">
                <p style="margin:0;font-size:11px;color:#9CA3AF;">
                  InterHealth · Notificação automática · Não responda a este e-mail
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    try:
        resend.Emails.send({
            "from": _FROM,
            "to": [_SALES_EMAIL],
            "reply_to": email,
            "subject": f"[Lead] Nova demo solicitada — {company_name}",
            "html": html,
        })
        logger.info("E-mail de notificação enviado para %s (lead: %s)", _SALES_EMAIL, email)
    except Exception as exc:
        logger.error("Falha ao enviar e-mail de notificação: %s", exc)
