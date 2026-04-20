const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/crowdfundin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function addTestDonations() {
  try {
    // Find the campaign and user
    const campaign = await Campaign.findOne({ title: 'Education for Every Child' });
    const user = await User.findOne({ name: 'BHARANIDHARAN K' });
    
    if (!campaign) {
      console.log('Campaign not found');
      return;
    }

    if (!user) {
      console.log('User not found');
      return;
    }

    // Add test donations to the campaign
    const testDonations = [
      {
        user: user._id,
        amount: 500,
        donatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isAnonymous: false
      },
      {
        user: user._id,
        amount: 250,
        donatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isAnonymous: false
      },
      {
        user: user._id,
        amount: 1000,
        donatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isAnonymous: true
      },
      {
        user: user._id,
        amount: 750,
        donatedAt: new Date(),
        isAnonymous: false
      }
    ];

    // Update campaign with donations and current amount
    const totalAmount = testDonations.reduce((sum, donation) => sum + donation.amount, 0);
    
    await Campaign.findByIdAndUpdate(campaign._id, {
      $push: { donors: { $each: testDonations } },
      $inc: { currentAmount: totalAmount }
    });

    console.log('Test donations added successfully!');
    console.log(`Added ${testDonations.length} donations totaling $${totalAmount}`);
    
    // Verify the update
    const updatedCampaign = await Campaign.findById(campaign._id).populate('donors.user', 'name');
    console.log(`Campaign now has ${updatedCampaign.donors.length} donors and $${updatedCampaign.currentAmount} raised`);
    
  } catch (error) {
    console.error('Error adding test donations:', error);
  } finally {
    mongoose.connection.close();
  }
}

addTestDonations();