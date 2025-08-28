# 🚀 JEETMASH - Crypto Profile Battle Platform

A full-stack web application where users can vote on crypto profiles in head-to-head battles, with Solana wallet integration for authentication.

## ✨ Features

- **Profile Battles**: Vote on who's the bigger "jeet" in head-to-head battles
- **Solana Wallet Integration**: Connect with Phantom wallet for voting
- **Leaderboards**: Track top performers across different time periods
- **Comments System**: Community discussion on profiles
- **Chad/Jeet Voting**: Vote on individual profiles
- **Real-time Updates**: Live battle results and statistics
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Rate limiting** and security middleware
- **Input validation** and sanitization

### Frontend
- **Vanilla JavaScript** (modular architecture)
- **Solana Web3.js** for wallet integration
- **Phantom Wallet** support
- **Responsive CSS**

## 🚦 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Phantom Wallet** browser extension (for testing)

## 🏁 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Jeetmash-project
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/jeetmash
JWT_SECRET=your-super-secure-jwt-secret-here

# Optional (has defaults)
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Database Setup

**Start MongoDB** (if running locally):
```bash
# macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Seed the database** with sample data:
```bash
cd backend
npm run seed
```

### 5. Start the Application

**Development mode** (with auto-restart):
```bash
cd backend
npm run dev
```

**Production mode**:
```bash
cd backend
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📁 Project Structure

```
Jeetmash-project/
├── backend/
│   ├── scripts/
│   │   └── seedData.js          # Database seeding
│   ├── package.json             # Backend dependencies
│   └── server.js                # Main server file
├── frontend/
│   ├── api-service.js           # API communication
│   ├── script.js                # Main application logic
│   ├── wallet-connection.js     # Solana wallet integration
│   └── package.json             # Frontend dependencies
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── index.html                   # Main HTML file
├── styles.css                   # Application styles
└── README.md                    # This file
```

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-restart)
npm run seed       # Seed database with sample data
npm test           # Run tests
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

**Frontend:**
```bash
npm run build      # Build for production
npm run dev        # Start development server
npm run watch      # Watch for changes
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

### API Endpoints

**Authentication:**
- `POST /api/auth/wallet` - Authenticate with wallet

**Profiles:**
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get profile by ID
- `GET /api/profiles/username/:username` - Get profile by username

**Voting:**
- `POST /api/votes/battle` - Submit battle vote
- `POST /api/votes/profile/:id` - Submit profile vote

**Comments:**
- `GET /api/comments/profile/:profileId` - Get profile comments
- `POST /api/comments` - Post a comment
- `POST /api/comments/:commentId/like` - Like/unlike comment

**Leaderboard:**
- `GET /api/leaderboard` - Get leaderboard data

**System:**
- `GET /health` - Health check endpoint

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** protection with configurable origins
- **Rate limiting** on API endpoints
- **Input sanitization** against XSS and injection
- **JWT** token authentication
- **MongoDB injection** protection
- **Parameter pollution** prevention

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jeetmash
JWT_SECRET=your-production-super-secure-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
PORT=3001
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t jeetmash .
docker run -p 3001:3001 --env-file .env jeetmash
```

## 🧪 Testing

### Manual Testing Checklist

1. **Wallet Connection**:
   - [ ] Connect Phantom wallet
   - [ ] Disconnect wallet
   - [ ] Handle wallet not installed

2. **Voting**:
   - [ ] Battle voting works
   - [ ] Profile voting (Chad/Jeet) works
   - [ ] Rate limiting prevents spam

3. **Comments**:
   - [ ] Post comments
   - [ ] Like/unlike comments
   - [ ] View profile comments

4. **Navigation**:
   - [ ] Home page loads
   - [ ] Profile pages work
   - [ ] Leaderboard displays

### API Testing

Use the health check endpoint to verify the server:
```bash
curl http://localhost:3001/health
```

Test API endpoints:
```bash
# Get profiles
curl http://localhost:3001/api/profiles

# Get leaderboard
curl http://localhost:3001/api/leaderboard
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```
   Error: MongoDB connection error
   ```
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`
   - Verify network connectivity

2. **Phantom Wallet Not Detected**
   - Install Phantom browser extension
   - Refresh the page
   - Check browser console for errors

3. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` in `.env`
   - Check if frontend URL is included

4. **Rate Limiting Issues**
   - Wait for rate limit window to reset
   - Check rate limit settings in `.env`

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

Check logs for detailed error information.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [Issues](https://github.com/yourusername/jeetmash/issues) page
- Create a new issue with detailed description
- Include error logs and environment details

## 🚀 Roadmap

- [ ] Advanced analytics dashboard
- [ ] More wallet integrations
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Social media integration
- [ ] Advanced commenting features

---

**Happy JEETing! 🚀**