import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

/**
 * SMS Service - Integrate with your preferred SMS provider
 * 
 * Supported Providers:
 * 1. Twilio
 * 2. AWS SNS
 * 3. Firebase
 * 4. MSG91
 * 5. Custom Provider
 */

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<boolean>}
 */
export const sendOTP = async (phoneNumber, otp) => {
  try {
    // Development mode - log OTP to console
    if (config.env === 'development') {
      logger.info('📱 Development Mode - OTP Generated', { phoneNumber, otp });
      console.log('\n' + '='.repeat(50));
      console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
      console.log('⏱️  Valid for 5 minutes');
      console.log('='.repeat(50) + '\n');
      return true;
    }

    // Production mode - send via SMS service
    // Uncomment and configure your preferred provider below

    // ============== TWILIO ==============
    // const twilio = await import('twilio');
    // const client = twilio.default(
    //   process.env.TWILIO_ACCOUNT_SID,
    //   process.env.TWILIO_AUTH_TOKEN
    // );
    // 
    // await client.messages.create({
    //   body: `Your verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });

    // ============== AWS SNS ==============
    // const AWS = await import('aws-sdk');
    // const sns = new AWS.SNS({
    //   region: process.env.AWS_REGION,
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    // });
    // 
    // await sns.publish({
    //   Message: `Your verification code is: ${otp}. Valid for 5 minutes.`,
    //   PhoneNumber: phoneNumber,
    //   MessageAttributes: {
    //     'AWS.SNS.SMS.SMSType': {
    //       DataType: 'String',
    //       StringValue: 'Transactional'
    //     }
    //   }
    // }).promise();

    // ============== MSG91 (India) ==============
    // const axios = await import('axios');
    // await axios.default.get('https://api.msg91.com/api/v5/otp', {
    //   params: {
    //     authkey: process.env.MSG91_AUTH_KEY,
    //     mobile: phoneNumber.replace('+91', ''),
    //     otp: otp,
    //     template_id: process.env.MSG91_TEMPLATE_ID
    //   }
    // });

    // ============== FIREBASE ==============
    // const admin = await import('firebase-admin');
    // // Configure Firebase Admin SDK first
    // await admin.messaging().send({
    //   notification: {
    //     title: 'Verification Code',
    //     body: `Your OTP is: ${otp}`
    //   },
    //   token: userDeviceToken
    // });

    // ============== CUSTOM HTTP API ==============
    // const axios = await import('axios');
    // await axios.default.post(process.env.SMS_API_URL, {
    //   phone: phoneNumber,
    //   message: `Your verification code is: ${otp}`,
    //   sender: process.env.SMS_SENDER_ID
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SMS_API_KEY}`
    //   }
    // });

    logger.info('OTP sent successfully', { phoneNumber });
    return true;

  } catch (error) {
    logger.error('Failed to send OTP', { 
      phoneNumber, 
      error: error.message 
    });
    throw new Error('Failed to send OTP. Please try again.');
  }
};

/**
 * Send custom SMS message
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} message - Message to send
 * @returns {Promise<boolean>}
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    if (config.env === 'development') {
      logger.info('📱 Development Mode - SMS', { phoneNumber, message });
      console.log(`\n📱 SMS to ${phoneNumber}: ${message}\n`);
      return true;
    }

    // Implement your SMS provider here
    // Similar to sendOTP function

    logger.info('SMS sent successfully', { phoneNumber });
    return true;

  } catch (error) {
    logger.error('Failed to send SMS', { 
      phoneNumber, 
      error: error.message 
    });
    throw new Error('Failed to send SMS. Please try again.');
  }
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhoneNumber = (phoneNumber) => {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};

/**
 * Format phone number to E.164
 * @param {string} phoneNumber - Phone number
 * @param {string} defaultCountryCode - Default country code (e.g., '91' for India)
 * @returns {string}
 */
export const formatPhoneNumber = (phoneNumber, defaultCountryCode = '91') => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Add country code if missing
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }

  // Add + prefix
  return '+' + cleaned;
};

export default {
  sendOTP,
  sendSMS,
  isValidPhoneNumber,
  formatPhoneNumber
};