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

  async sendBlogSubmissionConfirmation(userEmail, userName, blogTopic) {
    try {
      console.log('📧 Sending blog submission confirmation to:', userEmail)

      const mailOptions = {
        from: {
          name: 'Salesso Team',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `✅ Your Blog Request is Being Processed - "${blogTopic}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Salesso</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Blog Engine</p>
            </div>
            
            <div style="padding: 30px; background-color: white; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Thank You for Your Blog Request! 🎉</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hi ${userName || 'there'}! 👋
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 10px 0;">📝 Your Blog Topic:</h3>
                <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0;">"${blogTopic}"</p>
              </div>
              
              <div style="background: linear-gradient(90deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1976d2; margin: 0 0 15px 0;">⏰ What Happens Next?</h3>
                <ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>AI Research:</strong> Our AI is analyzing your topic and competitors</li>
                  <li><strong>SEO Optimization:</strong> We're researching the best keywords</li>
                  <li><strong>Content Creation:</strong> Our team will craft your high-quality blog</li>
                  <li><strong>Quality Review:</strong> Professional editing and optimization</li>
                </ul>
              </div>
              
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #4caf50; margin: 20px 0;">
                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                  📧 <strong>Delivery Timeline:</strong> Your professionally written blog will be delivered to this email within 1 hour.
                </p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Our AI-powered system is working on creating a high-quality, SEO-optimized blog that will help you engage your audience and boost your online presence.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                If you have any questions or need support, feel free to reach out to us.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333; font-size: 16px; font-weight: 600;">Thank you for choosing Salesso! 🙏</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                This email was sent by Salesso AI Blog Engine<br>
                © ${new Date().getFullYear()} Salesso. All rights reserved.
              </p>
            </div>
          </div>
        `
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Blog submission confirmation sent successfully:', result.messageId)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: userEmail
      }
    } catch (error) {
      console.error('❌ Blog submission confirmation failed:', error)
      throw error
    }
  }

  async sendAdminNewRequestNotification(userEmail, userName, blogTopic, blogId, competitors, persona, additionalInfo) {
    try {
      console.log('📧 Sending new request notification to admin')

      const adminEmail = 'navinkumargurnani@gmail.com'
      
      const mailOptions = {
        from: {
          name: 'Salesso System',
          address: process.env.EMAIL_USER
        },
        to: adminEmail,
        subject: `🔔 New Blog Request: "${blogTopic}" from ${userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 New Blog Request Alert</h1>
              <p style="color: #ffe8e6; margin: 10px 0 0 0;">Salesso Admin Notification</p>
            </div>
            
            <div style="padding: 30px; background-color: white; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">📝 New Blog Generation Request</h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #495057; margin: 0 0 15px 0;">👤 User Information:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${userName || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: 600;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Blog ID:</td>
                    <td style="padding: 8px 0; color: #333; font-family: monospace;">${blogId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Requested:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: linear-gradient(90deg, #fff3cd, #ffeaa7); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin: 0 0 15px 0;">📰 Blog Topic:</h3>
                <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0; padding: 10px; background: white; border-radius: 4px;">"${blogTopic}"</p>
              </div>
              
              ${competitors && competitors.length > 0 ? `
              <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0066cc; margin: 0 0 15px 0;">🏢 Competitors Analysis:</h3>
                <div style="color: #333;">
                  ${competitors.map(comp => `<span style="display: inline-block; background: white; padding: 5px 10px; margin: 3px; border-radius: 15px; border: 1px solid #ddd;">${comp}</span>`).join('')}
                </div>
              </div>
              ` : ''}
              
              ${persona ? `
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0284c7; margin: 0 0 10px 0;">🎯 Target Persona:</h3>
                <p style="color: #333; margin: 0; line-height: 1.6;">${persona}</p>
              </div>
              ` : ''}
              
              ${additionalInfo ? `
              <div style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #7c3aed; margin: 0 0 10px 0;">📋 Additional Information:</h3>
                <p style="color: #333; margin: 0; line-height: 1.6;">${additionalInfo}</p>
              </div>
              ` : ''}
              
              <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                <h3 style="color: #166534; margin: 0 0 10px 0;">⚡ Quick Actions:</h3>
                <p style="color: #333; margin: 0;">
                  • Check the admin panel for full blog details<br>
                  • Begin content creation process<br>
                  • User expects delivery within 1 hour
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center;">
                Salesso Admin Notification System<br>
                Generated at: ${new Date().toISOString()}
              </p>
            </div>
          </div>
        `
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Admin notification sent successfully:', result.messageId)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: adminEmail
      }
    } catch (error) {
      console.error('❌ Admin notification failed:', error)
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
