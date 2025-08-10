const nodemailer = require('nodemailer');

// Configuration SMTP pour MailDev (local)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  tls: { rejectUnauthorized: false }
});

// Fonction d'envoi d'email
const sendPasswordSetupEmail = async (email, token) => {
  try {
    const setupLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@taskmanager.local',
      to: email,
      subject: 'Activez votre compte Task Manager',
      html: `<p>Cliquez <a href="${setupLink}">ici</a> pour définir votre mot de passe</p>`,
      text: `Lien d'activation : ${setupLink}`
    });

    console.log(`[EMAIL] Envoyé à ${email} : ${setupLink}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERREUR]', error.message);
    throw new Error("Échec d'envoi d'email");
  }
};

module.exports = { sendPasswordSetupEmail };