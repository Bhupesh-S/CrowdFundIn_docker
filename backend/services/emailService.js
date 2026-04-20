const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development, use Gmail with app password
  // For production, use your preferred email service
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Email templates
const emailTemplates = {
  donationConfirmation: (donorName, campaignTitle, amount, campaignUrl) => ({
    subject: `Thank you for supporting ${campaignTitle}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Donation!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px; color: #333;">Hi ${donorName},</p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Thank you for your generous donation of <strong style="color: #28a745;">$${amount}</strong> to support <strong>${campaignTitle}</strong>. 
            Your contribution makes a real difference and brings us one step closer to our goal.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin: 0 0 10px 0;">What happens next?</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>You'll receive updates on the campaign's progress</li>
              <li>The campaign creator will use your donation responsibly</li>
              <li>You can track the campaign's success on our platform</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${campaignUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Campaign
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            This donation was made on ${new Date().toLocaleDateString()} through CrowdFundIn platform.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          <p>© 2024 CrowdFundIn. Making dreams come true through community support.</p>
        </div>
      </div>
    `
  }),

  campaignUpdate: (donorName, campaignTitle, updateMessage, campaignUrl, newAmount, goalAmount) => ({
    subject: `Update on ${campaignTitle} - Campaign You Supported`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Campaign Update</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px; color: #333;">Hi ${donorName},</p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Great news! The campaign <strong>${campaignTitle}</strong> that you supported has an update.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Latest Update:</h3>
            <p style="color: #666; line-height: 1.6; margin: 0;">${updateMessage}</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0;">Progress Update</h3>
            <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; margin: 10px 0;">
              <div style="background: #28a745; height: 100%; width: ${Math.min((newAmount / goalAmount) * 100, 100)}%; border-radius: 4px;"></div>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 14px;">
              <strong>$${newAmount.toLocaleString()}</strong> raised of <strong>$${goalAmount.toLocaleString()}</strong> goal
              (${Math.round((newAmount / goalAmount) * 100)}%)
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${campaignUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Full Campaign
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Thank you for being part of this journey! Your support continues to make a difference.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          <p>© 2024 CrowdFundIn. Making dreams come true through community support.</p>
        </div>
      </div>
    `
  }),

  campaignMilestone: (donorName, campaignTitle, milestone, campaignUrl, currentAmount, goalAmount) => ({
    subject: `🎉 ${campaignTitle} reached ${milestone}% funding!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Milestone Reached!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px; color: #333;">Hi ${donorName},</p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            Exciting news! <strong>${campaignTitle}</strong> has reached <strong>${milestone}%</strong> of its funding goal, 
            thanks to supporters like you!
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <h2 style="margin: 0 0 15px 0; font-size: 36px;">${milestone}%</h2>
            <p style="margin: 0; font-size: 18px;">of goal reached!</p>
            <div style="background: rgba(255,255,255,0.2); height: 10px; border-radius: 5px; margin: 20px 0;">
              <div style="background: #28a745; height: 100%; width: ${milestone}%; border-radius: 5px;"></div>
            </div>
            <p style="margin: 0; font-size: 16px;">
              <strong>$${currentAmount.toLocaleString()}</strong> of <strong>$${goalAmount.toLocaleString()}</strong>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <p style="color: #666; margin: 0; line-height: 1.6;">
              Your contribution was instrumental in reaching this milestone. Every donation, no matter the size, 
              brings us closer to making this campaign a success!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${campaignUrl}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;">
              Celebrate with Us
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          <p>© 2024 CrowdFundIn. Making dreams come true through community support.</p>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send donation confirmation email
  sendDonationConfirmation: async (donorEmail, donorName, campaignTitle, amount, campaignId) => {
    try {
      const transporter = createTransporter();
      const campaignUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/campaigns/${campaignId}`;
      
      const { subject, html } = emailTemplates.donationConfirmation(
        donorName, 
        campaignTitle, 
        amount, 
        campaignUrl
      );

      const mailOptions = {
        from: `"CrowdFundIn" <${process.env.EMAIL_USER || 'noreply@crowdfundin.com'}>`,
        to: donorEmail,
        subject,
        html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Donation confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending donation confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send campaign update to all donors
  sendCampaignUpdate: async (campaignId, updateMessage) => {
    try {
      const Campaign = require('../models/Campaign');
      const Donation = require('../models/Donation');
      
      const campaign = await Campaign.findById(campaignId).populate('owner');
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get unique donors for this campaign
      const donations = await Donation.find({ campaign: campaignId })
        .populate('donor', 'email name')
        .sort({ createdAt: -1 });

      const uniqueDonors = new Map();
      donations.forEach(donation => {
        if (donation.donor && donation.donor.email) {
          uniqueDonors.set(donation.donor.email, donation.donor);
        }
      });

      const transporter = createTransporter();
      const campaignUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/campaigns/${campaignId}`;
      
      const emailPromises = Array.from(uniqueDonors.values()).map(async (donor) => {
        try {
          const { subject, html } = emailTemplates.campaignUpdate(
            donor.name || 'Supporter',
            campaign.title,
            updateMessage,
            campaignUrl,
            campaign.currentAmount || 0,
            campaign.goalAmount
          );

          const mailOptions = {
            from: `"CrowdFundIn" <${process.env.EMAIL_USER || 'noreply@crowdfundin.com'}>`,
            to: donor.email,
            subject,
            html
          };

          return await transporter.sendMail(mailOptions);
        } catch (error) {
          console.error(`Error sending update email to ${donor.email}:`, error);
          return { error: error.message, email: donor.email };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Campaign update emails sent: ${successful} successful, ${failed} failed`);
      return { success: true, sent: successful, failed };
    } catch (error) {
      console.error('Error sending campaign update emails:', error);
      return { success: false, error: error.message };
    }
  },

  // Send milestone notification
  sendMilestoneNotification: async (campaignId, milestone) => {
    try {
      const Campaign = require('../models/Campaign');
      const Donation = require('../models/Donation');
      
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get unique donors for this campaign
      const donations = await Donation.find({ campaign: campaignId })
        .populate('donor', 'email name')
        .sort({ createdAt: -1 });

      const uniqueDonors = new Map();
      donations.forEach(donation => {
        if (donation.donor && donation.donor.email) {
          uniqueDonors.set(donation.donor.email, donation.donor);
        }
      });

      if (uniqueDonors.size === 0) {
        console.log('No donors to notify for milestone');
        return { success: true, sent: 0 };
      }

      const transporter = createTransporter();
      const campaignUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/campaigns/${campaignId}`;
      
      const emailPromises = Array.from(uniqueDonors.values()).map(async (donor) => {
        try {
          const { subject, html } = emailTemplates.campaignMilestone(
            donor.name || 'Supporter',
            campaign.title,
            milestone,
            campaignUrl,
            campaign.currentAmount || 0,
            campaign.goalAmount
          );

          const mailOptions = {
            from: `"CrowdFundIn" <${process.env.EMAIL_USER || 'noreply@crowdfundin.com'}>`,
            to: donor.email,
            subject,
            html
          };

          return await transporter.sendMail(mailOptions);
        } catch (error) {
          console.error(`Error sending milestone email to ${donor.email}:`, error);
          return { error: error.message, email: donor.email };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Milestone notification emails sent: ${successful} successful, ${failed} failed`);
      return { success: true, sent: successful, failed };
    } catch (error) {
      console.error('Error sending milestone notification emails:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email configuration
  testEmailConfig: async () => {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('Email configuration is valid');
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      console.error('Email configuration error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;