import { setOtp, getOtp, delOtp } from '../services/otp-store.service.js';
import logger from '../utils/logger.js';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/otp/send  { mobile }
export const sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
  }

  const otp = generateOtp();
  const key = `otp:${mobile.trim()}`;

  try {
    // Store OTP with 60s TTL (Redis, or in-memory fallback if Redis is down).
    await setOtp(key, otp, 60);

    // In production, integrate an SMS gateway here (Twilio, MSG91, etc.)
    // For development we log the OTP to the console
    logger.info(`📱 OTP for ${mobile}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${mobile.trim()}.`,
      // Only expose OTP in development for testing purposes
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (err) {
    logger.error('sendOtp failed', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/otp/verify  { mobile, otp }
export const verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: 'Mobile and OTP are required.' });
  }

  const key = `otp:${mobile.trim()}`;

  try {
    const storedOtp = await getOtp(key);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not sent. Please request a new OTP.' });
    }

    if (storedOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP verified – delete it so it cannot be reused
    await delOtp(key);

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    logger.error('verifyOtp failed', err);
    return res.status(500).json({ success: false, message: 'OTP verification failed. Please try again.' });
  }
};
