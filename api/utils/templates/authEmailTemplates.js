// api/utils/templates/authEmailTemplates.js

const getBaseEmailHtml = ({
  subject = "Darmax Notificación",
  mainTitle = "Hola",
  mainMessage = "",
  ctaText = "Ver Detalles",
  ctaUrl = "#",
  footerMessage = "",
}) => {
  const year = new Date().getFullYear();
  const logoUrl = "https://res.cloudinary.com/defkuaytw/image/upload/v1765489832/logo_darmax_vzpony.png";
  const bannerUrl = "https://res.cloudinary.com/defkuaytw/image/upload/v1765489833/banner_klsini.png";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0;padding:40px 0;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
    <tr>
      <td align="center">

        <!-- Contenedor principal más angosto -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:520px;background-color:#ffffff;border-radius:18px;overflow:hidden;">

          <!-- HEADER con banner reducido -->
          <tr>
            <td align="center"
              background="${bannerUrl}"
              style="
                padding:0px 16px 0px 16px;
                background-image:url('${bannerUrl}');
                background-size:cover;
                background-position:center;
                background-repeat:no-repeat;
              ">
              <img src="${logoUrl}" alt="Darmax Agua"
                style="
                  display:block;
                  max-width:100px;
                  height:auto;
                  border-radius:999px;
                  padding:8px;
                  box-shadow:0 6px 18px rgba(0,0,0,0.35);
                " />
            </td>
          </tr>

          <!-- CONTENIDO PRINCIPAL REDUCIDO -->
          <tr>
            <td align="center" style="padding:0 28px 44px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;">
                <tr>
                  <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;">

                    <h1 style="margin:24px 0 10px 0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;">
                      ${mainTitle}
                    </h1>

                    <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#4b5563;">
                      ${mainMessage}
                    </p>

                    <!-- Botón degradado -->
                    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin-bottom:8px;">
                      <tr>
                        <td align="center" style="border-radius:999px;overflow:hidden;">
                          <a href="${ctaUrl}"
                            style="
                              display:inline-block;
                              padding:12px 36px;
                              font-size:14px;
                              font-weight:600;
                              color:#ffffff;
                              text-decoration:none;
                              border-radius:8px;
                              background-color:#004aad;
                              background-image:linear-gradient(90deg,#5de0e6 0%,#004aad 100%);
                              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                            ">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:22px 0 4px 0;font-size:11px;color:#9ca3af;">
                      ${footerMessage}
                      <a href="mailto:${process.env.GMAIL_USER || "soporte@darmax.mx"}"
                        style="color:#004aad;text-decoration:none;">
                        contacta con nosotros
                      </a>.
                    </p>

                    <p style="margin:0;font-size:11px;color:#9ca3af;">
                      © ${year} Darmax, Todos los derechos reservados.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const getVerificationEmailTemplate = ({ name, verificationLink }) => {
  const safeName = name || "cliente";
  return getBaseEmailHtml({
    subject: "Verifica tu correo electrónico en Darmax",
    mainTitle: `¡Bienvenido a Darmax, ${safeName}!`,
    mainMessage: `Gracias por registrarte. Por favor, haz clic en el siguiente botón para verificar tu correo electrónico y activar tu cuenta.`,
    ctaText: "Verificar Correo",
    ctaUrl: verificationLink,
    footerMessage: `Si no te registraste, por favor ignora este correo. Para cualquier pregunta, `,
  });
};

const getResetPasswordEmailTemplate = ({ name, resetLink }) => {
  const safeName = name || "cliente";
  return getBaseEmailHtml({
    subject: "Recuperación de contraseña de Darmax",
    mainTitle: `Hola ${safeName},`,
    mainMessage: `Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para establecer una nueva contraseña.`,
    ctaText: "Restablecer Contraseña",
    ctaUrl: resetLink,
    footerMessage: `El enlace expirará en 1 hora. Si no solicitaste esto, por favor ignora este correo. Para cualquier pregunta, `,
  });
};

module.exports = {
    getVerificationEmailTemplate,
    getResetPasswordEmailTemplate
};
