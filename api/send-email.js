const MAILGUN_URL = 'https://api.eu.mailgun.net/v3/mg.fopen.com/messages';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const form = new URLSearchParams();
    form.append('from', `My Music Diary <${process.env.MAILGUN_FROM_EMAIL}>`);
    form.append('to', process.env.MAILGUN_TO_EMAIL);
    form.append('h:Reply-To', `${name} <${email}>`);
    form.append('subject', `My Music Diary: message from ${name}`);
    form.append('text', `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

    const response = await fetch(MAILGUN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Mailgun responded ${response.status}: ${await response.text()}`);
    }

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Error sending email' });
  }
};
