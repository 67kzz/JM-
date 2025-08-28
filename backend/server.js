// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
require('dotenv').config();

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // In development, be more permissive
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        const msg = 'The CORS policy for this site does not allow access from the specified origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
}));

// General rate limiting
const generalLimiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Voting rate limiting
const votingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.VOTE_RATE_LIMIT || 10,
    message: { error: 'Too many votes, please slow down!' },
    skip: (req) => process.env.NODE_ENV === 'test'
});

// Comment rate limiting
const commentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.COMMENT_RATE_LIMIT || 5,
    message: { error: 'Too many comments, please slow down!' },
    skip: (req) => process.env.NODE_ENV === 'test'
});

// Apply general rate limiting
app.use(generalLimiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize user input
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit']
}));

// XSS protection function
const sanitizeHtml = (input) => {
    if (typeof input === 'string') {
        return xss(input);
    }
    return input;
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// MongoDB connection with proper error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jeetmash', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true, sparse: true },
  twitterId: { type: String, unique: true, sparse: true },
  twitterHandle: { type: String, sparse: true },
  displayName: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

// User indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ twitterId: 1 });
userSchema.index({ lastActive: -1 });

// Profile Schema
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
 // marketCap: { type: String }, // Market cap
  change: { type: String },
  
  // Voting stats
  votes: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  battleWins: { type: Number, default: 0 },
  battleLosses: { type: Number, default: 0 },

  // Voting history tracking
  votesHistory: [{
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Chad/Jeet voting
  chadVotes: { type: Number, default: 0 },
  jeetVotes: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Profile indexes for query optimization
profileSchema.index({ username: 1 });
profileSchema.index({ votes: -1 });
profileSchema.index({ score: -1 });
profileSchema.index({ createdAt: -1 });
profileSchema.index({ 'votesHistory.timestamp': -1 });
profileSchema.index({ chadVotes: -1, jeetVotes: -1 });

// Vote Schema
const voteSchema = new mongoose.Schema({
  voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  loserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  timestamp: { type: Date, default: Date.now }
});

// Vote indexes
voteSchema.index({ voterId: 1, timestamp: -1 });
voteSchema.index({ winnerId: 1 });
voteSchema.index({ timestamp: -1 });

// Comment Schema
const commentSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxLength: 500 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Comment indexes
commentSchema.index({ profileId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ likes: -1 });

// Models
const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Vote = mongoose.model('Vote', voteSchema);
const Comment = mongoose.model('Comment', commentSchema);

// ==================== MIDDLEWARE ====================

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ==================== AUTH ROUTES ====================

// Wallet authentication
// Wallet authentication
app.post('/api/auth/wallet', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    // Log the incoming request
    console.log('Auth request for wallet:', walletAddress);
    
    // Validate wallet address
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      user = new User({
        walletAddress,
        displayName: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        avatar: `https://avatars.dicebear.com/api/jdenticon/${walletAddress}.svg`
      });
      await user.save();
      console.log('Created new user:', user._id);
    } else {
      console.log('Found existing user:', user._id);
    }
    
    user.lastActive = new Date();
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, walletAddress },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Auth successful for:', walletAddress);
    
    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
});

// ==================== PROFILE ROUTES ====================

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const { sort = 'votes', order = 'desc', limit = 50 } = req.query;
        
        // If sort is 'random', return random profiles
        if (sort === 'random') {
            const profiles = await Profile.aggregate([
                { $sample: { size: parseInt(limit) } }
            ]);
            return res.json(profiles);
        }
        
        // Build sort object
        let sortObj = {};
        if (sort === 'votes') {
            sortObj.votes = order === 'desc' ? -1 : 1;
        } else if (sort === 'score') {
            sortObj.score = order === 'desc' ? -1 : 1;
        } else if (sort === 'followers') {
            sortObj.followers = order === 'desc' ? -1 : 1;
        }
        
        // Get profiles with sorting
        const profiles = await Profile.find()
            .sort(sortObj)
            .limit(parseInt(limit));
            
        res.json(profiles);
        
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// Get single profile
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get profile by username
app.get('/api/profiles/username/:username', async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ==================== VOTING ROUTES ====================

// Submit battle vote
app.post('/api/votes/battle', votingLimiter, authMiddleware, async (req, res) => {
  try {
    const { winnerId, loserId } = req.body;
    
    // Check if user already voted for this battle
    const existingVote = await Vote.findOne({
      voterId: req.userId,
      $or: [
        { winnerId, loserId },
        { winnerId: loserId, loserId: winnerId }
      ],
      timestamp: { $gte: new Date(Date.now() - 60000) } // Within last minute
    });
    
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted for this battle' });
    }
    
    // Create vote record
    const vote = new Vote({
      voterId: req.userId,
      winnerId,
      loserId
    });
    await vote.save();
    
    // Update profiles
    const winner = await Profile.findById(winnerId);
    const loser = await Profile.findById(loserId);
    
    if (winner && loser) {
      winner.votes += 1;
      winner.score += 1;
      winner.battleWins += 1;
      winner.votesHistory.push({ voterId: req.userId });
      
      loser.battleLosses += 1;
      
      await winner.save();
      await loser.save();
    }
    
    res.json({
      success: true,
      winner: {
        id: winner._id,
        votes: winner.votes,
        score: winner.score
      },
      loser: {
        id: loser._id,
        votes: loser.votes,
        score: loser.score
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// Chad/Jeet voting
app.post('/api/votes/profile/:id', votingLimiter, async (req, res) => {
  try {
    const { voteType } = req.body;
    const profileId = req.params.id;
    
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Increment the appropriate vote count
    if (voteType === 'chad') {
      profile.chadVotes = (profile.chadVotes || 0) + 1;
    } else if (voteType === 'jeet') {
      profile.jeetVotes = (profile.jeetVotes || 0) + 1;
    }
    
    await profile.save();
    
    // Calculate percentages
    const total = profile.chadVotes + profile.jeetVotes;
    let chadPercentage = 50;
    let jeetPercentage = 50;
    
    if (total > 0) {
      // Calculate raw percentages
      const rawChadPercent = (profile.chadVotes / total) * 100;
      const rawJeetPercent = (profile.jeetVotes / total) * 100;
      
      // Round them
      chadPercentage = Math.round(rawChadPercent);
      jeetPercentage = Math.round(rawJeetPercent);
      
      // Ensure they add up to 100
      if (chadPercentage + jeetPercentage !== 100) {
        // If they don't sum to 100, adjust based on which is larger
        if (profile.chadVotes >= profile.jeetVotes) {
          chadPercentage = 100 - jeetPercentage;
        } else {
          jeetPercentage = 100 - chadPercentage;
        }
      }
    }
    
    console.log('Vote recorded - Chad:', profile.chadVotes, 'Jeet:', profile.jeetVotes);
    console.log('Percentages - Chad:', chadPercentage + '%', 'Jeet:', jeetPercentage + '%');
    
    res.json({
      success: true,
      chadVotes: profile.chadVotes,
      jeetVotes: profile.jeetVotes,
      chadPercentage: chadPercentage,
      jeetPercentage: jeetPercentage
    });
    
  } catch (error) {
    console.error('Profile vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// ==================== COMMENT ROUTES ====================

// Get comments for a profile
app.get('/api/comments/profile/:profileId', async (req, res) => {
  try {
    const comments = await Comment.find({ profileId: req.params.profileId })
      .populate('authorId', 'displayName avatar walletAddress twitterHandle')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Post a comment
app.post('/api/comments', commentLimiter, authMiddleware, [
  body('profileId').isMongoId(),
  body('text').isLength({ min: 1, max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { profileId, text } = req.body;
    
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const comment = new Comment({
      profileId,
      authorId: req.userId,
      text
    });
    
    await comment.save();
    await comment.populate('authorId', 'displayName avatar walletAddress twitterHandle');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Like/unlike a comment
app.post('/api/comments/:commentId/like', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const userIndex = comment.likedBy.indexOf(req.userId);
    if (userIndex > -1) {
      // Unlike
      comment.likedBy.splice(userIndex, 1);
      comment.likes -= 1;
    } else {
      // Like
      comment.likedBy.push(req.userId);
      comment.likes += 1;
    }
    
    await comment.save();
    
    res.json({
      likes: comment.likes,
      liked: userIndex === -1
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// ==================== LEADERBOARD ROUTES ====================

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = { 'votesHistory.timestamp': { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case 'week':
        dateFilter = { 'votesHistory.timestamp': { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { 'votesHistory.timestamp': { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }
    
    const profiles = await Profile.find(dateFilter)
      .sort({ votes: -1, score: -1 })
      .limit(parseInt(limit));
    
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==================== HEALTH CHECK ==================== 
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV,
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    
    res.status(200).json(healthCheck);
});

// ==================== SERVE STATIC FILES ==================== 
// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Apply error handlers BEFORE catch-all route
app.use(notFound);
app.use(errorHandler);

// Handle client-side routing - must be the LAST route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server with graceful shutdown
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server close:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close database connection
    mongoose.connection.close(false, (err) => {
      if (err) {
        console.error('❌ Error during database close:', err);
        process.exit(1);
      }
      
      console.log('✅ Database connection closed');
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;