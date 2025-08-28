const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jeetmash');

// Define schemas (simplified versions)
const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  handle: { type: String, required: true },
  twitterHandle: { type: String },
  bio: { type: String },
  followers: { type: String },
  following: { type: String },
  posts: { type: String },
  image: { type: String },
  emoji: { type: String },
  change: { type: String },
  votes: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  battleWins: { type: Number, default: 0 },
  battleLosses: { type: Number, default: 0 },
  chadVotes: { type: Number, default: 0 },
  jeetVotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);

// Sample data
const sampleProfiles = [
  {
    username: 'CryptoDegenKing',
    handle: '@cryptodegenking',
    twitterHandle: 'cryptodegenking',
    bio: 'Full-time degen, part-time genius. HODL everything.',
    followers: '12.1K',
    following: '420',
    posts: '1.2K',
    emoji: '👑',
    change: '+15.7%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'PaperHandsPete',
    handle: '@paperhandspete',
    twitterHandle: 'paperhandspete',
    bio: 'I sell at the first sign of trouble. Risk management is my middle name.',
    followers: '8.3K',
    following: '1.1K',
    posts: '892',
    emoji: '📜',
    change: '-8.2%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'DiamondHandsDiva',
    handle: '@diamondhandsdiva',
    twitterHandle: 'diamondhandsdiva',
    bio: '💎🙌 Never selling. Diamond hands since 2009.',
    followers: '25.7K',
    following: '234',
    posts: '3.4K',
    emoji: '💎',
    change: '+42.1%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'FOMOFred',
    handle: '@fomofred',
    twitterHandle: 'fomofred',
    bio: 'Always buying at the top. FOMO is my strategy.',
    followers: '3.2K',
    following: '2.8K',
    posts: '156',
    emoji: '🚀',
    change: '-23.5%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'WhaleMaster',
    handle: '@whalemaster',
    twitterHandle: 'whalemaster',
    bio: 'Moving markets with single trades. 🐋',
    followers: '156K',
    following: '42',
    posts: '847',
    emoji: '🐋',
    change: '+8.9%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'ShrimpStruggle',
    handle: '@shrimpstruggle',
    twitterHandle: 'shrimpstruggle',
    bio: 'Small bag, big dreams. Every satoshi counts.',
    followers: '892',
    following: '4.2K',
    posts: '67',
    emoji: '🦐',
    change: '+2.1%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'TechnicalTina',
    handle: '@technicaltina',
    twitterHandle: 'technicaltina',
    bio: 'Charts, patterns, and hopium. TA is life.',
    followers: '18.9K',
    following: '567',
    posts: '2.1K',
    emoji: '📊',
    change: '+11.3%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  },
  {
    username: 'RugPullRalph',
    handle: '@rugpullralph',
    twitterHandle: 'rugpullralph',
    bio: 'If it exists, I\'ve been rugged by it.',
    followers: '5.4K',
    following: '1.3K',
    posts: '423',
    emoji: '🪣',
    change: '-67.8%',
    votes: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 500),
    chadVotes: Math.floor(Math.random() * 100),
    jeetVotes: Math.floor(Math.random() * 50)
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing profiles
    await Profile.deleteMany({});
    console.log('🧹 Cleared existing profiles');
    
    // Insert sample profiles
    const createdProfiles = await Profile.insertMany(sampleProfiles);
    console.log(`✅ Created ${createdProfiles.length} sample profiles`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Display created profiles
    console.log('\n📝 Created profiles:');
    createdProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.username} (${profile.handle}) - ${profile.votes} votes`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run seeding
seedDatabase();