// Simple test script to verify email configuration
require('dotenv').config()
const emailService = require('./services/emailService')

async function testEmail() {
  try {
    console.log('🧪 Testing email configuration...')
    console.log('📧 Email user:', process.env.EMAIL_USER)
    console.log('🔑 Email password configured:', process.env.EMAIL_PASSWORD ? 'Yes' : 'No')
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('❌ Please configure EMAIL_USER and EMAIL_PASSWORD in your .env file')
      console.log('📝 Check ENV_VARIABLES_TO_ADD.txt for instructions')
      return
    }

    // Test sending an email
    const testEmail = process.env.EMAIL_USER // Send test email to yourself
    const result = await emailService.sendTestEmail(testEmail)
    
    console.log('✅ Test email sent successfully!')
    console.log('📧 Message ID:', result.messageId)
    console.log('📬 Check your inbox at:', testEmail)
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message)
    console.log('\n📝 Common solutions:')
    console.log('1. Enable 2-Factor Authentication on your Gmail account')
    console.log('2. Generate an App Password (not your regular password)')
    console.log('3. Use the App Password in EMAIL_PASSWORD environment variable')
    console.log('4. Check that EMAIL_USER is your full Gmail address')
  }
}

// Run the test
testEmail()
