const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Mail Transporter configuration
 */
const port = parseInt(process.env.MAIL_PORT, 10) || 1025;
const transportOptions = {
  host: process.env.MAIL_HOST || 'mailpit',
  port: port,
  secure: port === 465,
};

// Include authentication credentials only if provided (e.g. Mailpit does not require auth)
if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
  transportOptions.auth = {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  };
}

const transporter = nodemailer.createTransport(transportOptions);

/**
 * Compile template HTML by replacing {{key}} tokens with data values
 * @param {string} html
 * @param {Object} data
 * @returns {string}
 */
function compileTemplate(html, data = {}) {
  const mergedData = {
    app_name: process.env.MAIL_FROM_NAME || 'My Application',
    year: new Date().getFullYear(),
    support_email: process.env.MAIL_FROM_ADDRESS || 'support@example.com',
    ...data
  };

  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return mergedData[key] !== undefined ? mergedData[key] : match;
  });
}

/**
 * Send an email directly with custom options
 * @param {Object} mailOptions
 * @param {string} mailOptions.to
 * @param {string} mailOptions.subject
 * @param {string} [mailOptions.html]
 * @param {string} [mailOptions.text]
 * @returns {Promise<Object>}
 */
async function sendMail(mailOptions) {
  const fromName = process.env.MAIL_FROM_NAME || 'My Application';
  const fromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@example.com';

  const fullOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    ...mailOptions
  };

  return transporter.sendMail(fullOptions);
}

/**
 * Send an email using an HTML template file
 * @param {string} templatePath - Path relative to project root or resources/views/emails/
 * @param {Object} data - Key-value map for replacing {{key}} tokens
 * @param {Object} mailOptions - Nodemailer mail options (to, subject, etc.)
 * @returns {Promise<Object>}
 */
async function sendTemplateEmail(templatePath, data, mailOptions) {
  let absolutePath = templatePath;
  if (!path.isAbsolute(templatePath)) {
    if (templatePath.startsWith('resources/views/emails')) {
      absolutePath = path.join(process.cwd(), templatePath);
    } else {
      absolutePath = path.join(process.cwd(), 'resources', 'views', 'emails', templatePath);
    }
  }

  const templateContent = await fs.promises.readFile(absolutePath, 'utf8');
  const compiledHtml = compileTemplate(templateContent, data);

  return sendMail({
    ...mailOptions,
    html: compiledHtml
  });
}

module.exports = {
  transporter,
  sendMail,
  sendTemplateEmail,
  compileTemplate
};
