const nodemailer = require('nodemailer');

const user = 'sakkurisnigdha@gmail.com';
const pass = 'mgjycelsjfbhymaa'; // Stripped spaces: 'mgjycelsjfbhymaa'

async function testGmailService() {
  console.log('Testing service: "gmail"...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });

  try {
    await transporter.verify();
    console.log('✅ service: "gmail" verified successfully!');
    return true;
  } catch (err) {
    console.error('❌ service: "gmail" failed:', err.message);
    return false;
  }
}

async function testSmtpPort587() {
  console.log('Testing SMTP Port 587 (STARTTLS)...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Port 587 verified successfully!');
    return true;
  } catch (err) {
    console.error('❌ SMTP Port 587 failed:', err.message);
    return false;
  }
}

async function testSmtpPort465() {
  console.log('Testing SMTP Port 465 (SSL)...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Port 465 verified successfully!');
    return true;
  } catch (err) {
    console.error('❌ SMTP Port 465 failed:', err.message);
    return false;
  }
}

async function run() {
  await testGmailService();
  await testSmtpPort587();
  await testSmtpPort465();
}

run();
