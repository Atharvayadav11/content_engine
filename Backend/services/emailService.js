const nodemailer = require('nodemailer')

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  initializeTransporter() {
    // Gmail configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASSWORD // Your Gmail App Password
      }
    })

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter configuration error:', error)
      } else {
        console.log('✅ Email server is ready to send messages')
      }
    })
  }

  async sendBlogPDF(recipientEmail, blogTitle, pdfBuffer, fileName) {
    try {
      console.log('📧 Sending blog PDF to:', recipientEmail)

      const mailOptions = {
        from: {
          name: 'Blog Engine Team',
          address: process.env.EMAIL_USER
        },
        to: recipientEmail,
        subject: `Your Blog is Ready: ${blogTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">🎉 Your Blog is Ready!</h2>
            </div>
            
            <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hi there! 👋
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Great news! Your blog on <strong>"${blogTitle}"</strong> has been completed and is ready for you.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                📎 You'll find your professionally written blog attached as a PDF file to this email.
              </p>
              
              <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #0066cc; margin: 0; font-size: 14px;">
                  💡 <strong>Pro Tip:</strong> This blog has been optimized for SEO and includes all the keywords and structure discussed during creation.
                </p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                If you have any questions or need revisions, please don't hesitate to reach out to us.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Thank you for using our Blog Engine! 🚀
              </p>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                This email was sent by Blog Engine Team<br>
                If you didn't request this blog, please ignore this email.
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully:', result.messageId)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: recipientEmail
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      throw error
    }
  }

  async sendTestEmail(recipientEmail) {
    try {
      const mailOptions = {
        from: {
          name: 'Blog Engine Team',
          address: process.env.EMAIL_USER
        },
        to: recipientEmail,
        subject: 'Email Service Test - Blog Engine',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">✅ Email Service Test</h2>
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p>If you receive this email, the configuration is successful!</p>
            <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Test email sent successfully:', result.messageId)
      
      return {
        success: true,
        messageId: result.messageId
      }
    } catch (error) {
      console.error('❌ Test email failed:', error)
      throw error
    }
  }
}

module.exports = new EmailService()
