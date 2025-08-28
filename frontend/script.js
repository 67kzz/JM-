// script.js - JEETMASH Application with MongoDB Backend Integration

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// ==================== CONFIGURATION ====================
const CONFIG = {
    ANIMATION_DURATION: 300,
    VOTE_DELAY: 600,
    DEBUG_UPDATE_INTERVAL: 2000,
    SOUND_FREQUENCIES: {
        CLICK: 800,
        ENTER: 600,
        VOTE_NOTES: [523.25, 659.25, 783.99] // C, E, G
    }
};

// ==================== STATE MANAGEMENT ====================
class AppState {
    constructor() {
        this.voting = {
            totalVotes: 0,
            leftVotes: 0,
            rightVotes: 0,
            battleNumber: 1,
            userStreak: 0,
            hasVoted: false,
            currentLeftProfile: null,
            currentRightProfile: null,
            previousPair: []
        };
        
        this.debug = {
            isVisible: false,
            updateInterval: null
        };
    }
}

const appState = new AppState();

// ==================== AUDIO MANAGER ====================
class AudioManager {
    static playSound(type, duration = 0.03) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'click':
                oscillator.frequency.value = CONFIG.SOUND_FREQUENCIES.CLICK;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                break;
            case 'enter':
                oscillator.frequency.value = CONFIG.SOUND_FREQUENCIES.ENTER;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                duration = 0.05;
                break;
            case 'typing':
                oscillator.frequency.value = CONFIG.SOUND_FREQUENCIES.ENTER;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
                duration = 0.01;
                break;
        }
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    static playVoteSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.3;
        
        CONFIG.SOUND_FREQUENCIES.VOTE_NOTES.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + (index * 0.05);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }
}

// ==================== NAVIGATION MODULE ====================
const NavigationModule = {
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show selected section
        const sectionMap = {
            'home': 'home-section',
            'profiles': 'profiles-section',
            'profile-detail': 'profile-detail-section',
            'kol-holdings': 'kol-holdings-section'
        };
        
        const sectionId = sectionMap[sectionName];
        if (!sectionId) return;
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
            
            // Section-specific initialization
            switch(sectionName) {
              case 'profiles':
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
        ProfilesModule.updateProfilesSection();
    }, 100);
    break;
               
            }
            
            window.scrollTo(0, 0);
        }
    },
    
    scrollToElement(elementId) {
        this.showSection('home');
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const headerHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 20;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100);
    }
};

// ==================== PROFILE MODULE ====================
const ProfileModule = {
    createProfileImage(profile) {
        if (profile.image) {
            return `<img src="${profile.image}" alt="${profile.username}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        return profile.emoji || '👤';
    },
    
    async showProfileDetail(username) {
        try {
            // Fetch fresh profile data from backend
            const profile = await window.apiService.getProfileByUsername(username);
            
            if (!profile) {
                console.error('Profile not found');
                return;
            }
            
            // Store profile for voting
            window.currentViewedProfile = profile;
            
            // Update profile information
            document.getElementById('detail-name').textContent = profile.username || 'Username';
            const handleElement = document.getElementById('detail-handle');
            handleElement.textContent = profile.handle || '@handle';
            
            // Make handle clickable
            if (profile.twitterHandle) {
                handleElement.style.cursor = 'pointer';
                handleElement.onclick = () => window.open(`https://x.com/${profile.twitterHandle}`, '_blank');
            }
            
            // Update avatar
            const avatarElement = document.getElementById('detail-avatar');
            if (profile.image) {
                // Create image element and handle load errors
                const img = new Image();
                img.onload = function() {
                    avatarElement.innerHTML = `<img src="${profile.image}" alt="${profile.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                };
                img.onerror = function() {
                    console.warn('Failed to load profile image, using fallback');
                    avatarElement.innerHTML = profile.emoji || '👤';
                };
                img.src = profile.image;
            } else {
                avatarElement.innerHTML = profile.emoji || '👤';
            }
            
            // Update stats
            document.getElementById('detail-followers').textContent = profile.followers || '0';
            document.getElementById('detail-marketcap').textContent = profile.marketCap || '$0';
            document.getElementById('detail-change').textContent = profile.change || '0%';
            document.getElementById('detail-score').textContent = profile.score || '0';
            document.getElementById('detail-votes').textContent = profile.votes || '0';
            
            // Update vote counts for Chad/Jeet
            document.getElementById('chad-count').textContent = formatVoteCount(profile.chadVotes || 0);
            document.getElementById('jeet-count').textContent = formatVoteCount(profile.jeetVotes || 0);
            
            this.updateChangeIndicator(profile.change);
            
            // Calculate and update percentages
            const total = (profile.chadVotes || 0) + (profile.jeetVotes || 0);
            const chadPercent = total > 0 ? Math.round((profile.chadVotes / total) * 100) : 50;
            const jeetPercent = 100 - chadPercent;
            updateVotePercentages(chadPercent, jeetPercent);
            
            // Show the profile detail section FIRST
            NavigationModule.showSection('profile-detail');
            resetProfileVotes();

            // Reset profile votes when viewing a new profile
function resetProfileVotes() {
    const chadBtn = document.querySelector('.chad-vote-btn');
    const jeetBtn = document.querySelector('.jeet-vote-btn');
    
    if (chadBtn) {
        chadBtn.classList.remove('voting', 'voted');
        chadBtn.style.opacity = '1';
        chadBtn.disabled = false;
    }
    
    if (jeetBtn) {
        jeetBtn.classList.remove('voting', 'voted');
        jeetBtn.style.opacity = '1';
        jeetBtn.disabled = false;
    }
}

// Make it globally accessible
window.resetProfileVotes = resetProfileVotes;
            
            // Load comments AFTER showing the profile (non-blocking)
            // This prevents comment loading errors from blocking the profile display
            setTimeout(async () => {
                try {
                    await CommentsModule.loadProfileComments(profile.username);
                } catch (commentError) {
                    console.warn('Failed to load comments:', commentError);
                    // Don't show error to user - comments are non-critical
                }
            }, 100);
            
        } catch (error) {
            console.error('Error loading profile:', error);
            
            // Only show error if it's a critical error (not 404s or network issues)
            if (error.message && 
                !error.message.includes('404') && 
                !error.message.includes('fetch') &&
                !error.message.includes('network')) {
                // For critical errors, still try to show what we can
                NavigationModule.showSection('profile-detail');
            }
            // Don't show any alert - let the profile load with whatever data we have
        }
    },
    
    updateChangeIndicator(change) {
        const changeElement = document.getElementById('detail-change');
        if (!changeElement) return;
        
        changeElement.classList.remove('positive', 'negative');
        
        if (change && change.includes('+')) {
            changeElement.classList.add('positive');
        } else if (change && change.includes('-')) {
            changeElement.classList.add('negative');
        }
    }
};
// ==================== VOTING MODULE ====================
const VotingModule = {
    updateResults() {
        const { totalVotes, leftVotes, rightVotes } = appState.voting;
        const leftPercent = totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 50;
        const rightPercent = 100 - leftPercent;
        
        // Update bars
        const leftBar = document.getElementById('left-bar');
        const rightBar = document.getElementById('right-bar');
        if (leftBar) leftBar.style.width = leftPercent + '%';
        if (rightBar) rightBar.style.width = rightPercent + '%';
        
        // Update percentages
        const leftProfile = document.getElementById('left-profile');
        const rightProfile = document.getElementById('right-profile');
        const leftName = leftProfile?.querySelector('.profile-username')?.textContent || 'Unknown';
        const rightName = rightProfile?.querySelector('.profile-username')?.textContent || 'Unknown';
        
        const leftPercentage = document.getElementById('left-percentage');
        const rightPercentage = document.getElementById('right-percentage');
        if (leftPercentage) leftPercentage.textContent = `${leftPercent}% voted for ${leftName}`;
        if (rightPercentage) rightPercentage.textContent = `${rightPercent}% voted for ${rightName}`;
        
        // Update total votes
        const totalVotesElement = document.getElementById('total-votes');
        if (totalVotesElement) {
            totalVotesElement.textContent = totalVotes.toLocaleString();
        }
    },
    
    async loadNewProfiles() {
        try {
            // Fetch random profiles from backend
            const profiles = await window.apiService.getProfiles({ 
                sort: 'random', 
                limit: 2 
            });
            
            if (!profiles || profiles.length < 2) {
                console.error("Not enough profiles from backend");
                return;
            }
            
            // Update state
            appState.voting.currentLeftProfile = profiles[0];
            appState.voting.currentRightProfile = profiles[1];
            appState.voting.previousPair = [
                appState.voting.currentLeftProfile.username, 
                appState.voting.currentRightProfile.username
            ];
            
            // Update UI
            this.updateProfileCard('left', appState.voting.currentLeftProfile);
            this.updateProfileCard('right', appState.voting.currentRightProfile);
            
            // Reset voting state
            this.resetVotingState();
            
            // Update results with real vote counts
            appState.voting.totalVotes = (profiles[0].votes || 0) + (profiles[1].votes || 0) || 100;
            appState.voting.leftVotes = profiles[0].votes || Math.round(appState.voting.totalVotes * 0.5);
            appState.voting.rightVotes = profiles[1].votes || appState.voting.totalVotes - appState.voting.leftVotes;
            this.updateResults();
            
            appState.voting.battleNumber++;
            
        } catch (error) {
            console.error('Error loading new profiles:', error);
        }
    },
    
    updateProfileCard(side, profile) {
        const profileElement = document.getElementById(`${side}-profile`);
        if (!profileElement) return;
        
        // Update image
        const imageElement = profileElement.querySelector('.profile-image');
        if (imageElement) {
            imageElement.setAttribute('onclick', 
                `event.stopPropagation(); ProfileModule.showProfileDetail('${profile.username}')`
            );
            
            if (profile.image) {
                imageElement.innerHTML = `<img src="${profile.image}" alt="${profile.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                imageElement.innerHTML = profile.emoji || '👤';
            }
        }
        
        // Update text elements
        const elements = {
            '.profile-username': profile.username,
            '.profile-handle': profile.handle,
            '.profile-bio': profile.bio
        };
        
        for (const [selector, value] of Object.entries(elements)) {
            const element = profileElement.querySelector(selector);
            if (element) element.textContent = value;
        }
        
        // Update stats
        const stats = profileElement.querySelectorAll('.profile-stat-number');
        if (stats.length >= 3) {
            stats[0].textContent = profile.followers;
            stats[1].textContent = profile.following;
            stats[2].textContent = profile.posts;
        }
        
        // Make profile clickable
        this.makeProfileClickable(profileElement, profile);
    },
    
    makeProfileClickable(profileElement, profileData) {
        const clickableElements = ['.profile-username', '.profile-handle'];
        
        clickableElements.forEach(selector => {
            const element = profileElement.querySelector(selector);
            if (element) {
                element.style.cursor = 'pointer';
                element.onclick = (e) => {
                    e.stopPropagation();
                    ProfileModule.showProfileDetail(profileData.username);
                };
            }
        });
    },
    
    resetVotingState() {
        appState.voting.hasVoted = false;
        
        const leftProfile = document.getElementById('left-profile');
        const rightProfile = document.getElementById('right-profile');
        
        [leftProfile, rightProfile].forEach(profile => {
            if (profile) {
                profile.classList.remove('voted', 'lost');
                const voteBtn = profile.querySelector('.vote-btn');
                if (voteBtn) {
                    voteBtn.textContent = 'VOTE';
                    voteBtn.disabled = false;
                }
            }
        });
    },
    
    async handleVote(isLeft) {
        // Check wallet connection first
        if (!window.walletManager?.canVote()) {
            return;
        }

        if (appState.voting.hasVoted) return;
        
        const winner = isLeft ? appState.voting.currentLeftProfile : appState.voting.currentRightProfile;
        const loser = isLeft ? appState.voting.currentRightProfile : appState.voting.currentLeftProfile;
        
        if (!winner || !loser || !winner._id || !loser._id) {
            console.error('Invalid profile data');
            return;
        }
        
        try {
            AudioManager.playVoteSound();
            appState.voting.hasVoted = true;
            
            // Update UI immediately
            const leftProfile = document.getElementById('left-profile');
            const rightProfile = document.getElementById('right-profile');
            
            if (isLeft) {
                appState.voting.leftVotes++;
                leftProfile.classList.add('voted');
                rightProfile.classList.add('lost');
                leftProfile.querySelector('.vote-btn').textContent = 'VOTED!';
            } else {
                appState.voting.rightVotes++;
                rightProfile.classList.add('voted');
                leftProfile.classList.add('lost');
                rightProfile.querySelector('.vote-btn').textContent = 'VOTED!';
            }
            
            // Disable vote buttons
            [leftProfile, rightProfile].forEach(profile => {
                const btn = profile.querySelector('.vote-btn');
                if (btn) btn.disabled = true;
            });
            
            // Submit vote to backend
            const result = await window.apiService.submitBattleVote(winner._id, loser._id);
            
            // Update results
            this.updateResults();
            appState.voting.userStreak++;
            
            // Update UI elements
            const streakElement = document.getElementById('user-streak');
            if (streakElement) streakElement.textContent = appState.voting.userStreak;
            
            // Update leaderboard and champions
            LeaderboardModule.updateLeaderboard();
            ChampionsModule.updateJeetChampions();
            
            if (window.walletManager) {
                window.walletManager.showNotification('🗳️ Vote recorded!', 'success');
            }
            
            // Load new profiles after delay
            setTimeout(() => this.loadNewProfiles(), CONFIG.VOTE_DELAY);
            
        } catch (error) {
            console.error('Failed to submit vote:', error);
            this.resetVotingState();
            if (window.walletManager) {
                window.walletManager.showNotification('Vote failed. Please try again.', 'error');
            }
        }
    }
};

// ==================== LEADERBOARD MODULE ====================
const LeaderboardModule = {
    async updateLeaderboard() {
        const leaderboardTable = document.querySelector('.leaderboard-table');
        if (!leaderboardTable) return;
        
        try {
            // Get current tab period
            const activeTab = document.querySelector('.tab-btn.active');
            const period = activeTab?.textContent.toLowerCase() || 'all';
            
            // Fetch leaderboard from backend
            const profiles = await window.apiService.getLeaderboard(period);
            
            // Clear existing rows
            const existingRows = leaderboardTable.querySelectorAll('.leaderboard-row');
            existingRows.forEach(row => row.remove());
            
            // Create new rows
            profiles.forEach((profile, index) => {
                const row = this.createLeaderboardRow(profile, index);
                leaderboardTable.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    },
    
createLeaderboardRow(profile, index) {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.style.cursor = 'pointer';
    row.onclick = () => ProfileModule.showProfileDetail(profile.username);
    
    const avatarHTML = profile.image 
        ? `<img src="${profile.image}" alt="${profile.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : profile.emoji || '👤';
    
    row.innerHTML = `
        <div class="rank">${index + 1}</div>
        <div class="profile-info">
            <div class="profile-avatar">${avatarHTML}</div>
            <div class="profile-details">
                <div class="profile-name">${profile.username}</div>
                <div class="profile-handle">${profile.handle} • ${profile.followers} followers</div>
            </div>
        </div>
        <div class="votes-score-container">
            <span class="votes-text"></span>
            <span class="score">${profile.votes >= 1000 ? (profile.votes / 1000).toFixed(2) + 'k' : profile.votes}</span>
        </div>
    `;
    
    return row;
}
};

// ==================== CHAMPIONS MODULE ====================
const ChampionsModule = {
    async updateJeetChampions() {
        const championsGrid = document.getElementById('champions-grid');
        if (!championsGrid) return;
        
        try {
            championsGrid.innerHTML = '';
            
            // Fetch top profiles for different periods
            const [dayChampion, weekChampion, monthChampion] = await Promise.all([
                window.apiService.getLeaderboard('day', 1).then(r => r[0]),
                window.apiService.getLeaderboard('week', 1).then(r => r[0]),
                window.apiService.getLeaderboard('month', 1).then(r => r[0])
            ]);
            
            const champions = [
                { profile: dayChampion, period: 'Day', periodClass: 'jeet-day' },
                { profile: weekChampion, period: 'Week', periodClass: 'jeet-week' },
                { profile: monthChampion, period: 'Month', periodClass: 'jeet-month' }
            ];
            
            champions.forEach(({ profile, period, periodClass }) => {
                if (!profile) return;
                
                const championCard = this.createChampionCard(profile, period, periodClass);
                championsGrid.appendChild(championCard);
            });
        } catch (error) {
            console.error('Failed to fetch champions:', error);
            // Fallback to show top 3 from all time
            try {
                const topProfiles = await window.apiService.getLeaderboard('all', 3);
                const periods = ['Day', 'Week', 'Month'];
                const periodClasses = ['jeet-day', 'jeet-week', 'jeet-month'];
                
                topProfiles.forEach((profile, index) => {
                    const championCard = this.createChampionCard(
                        profile, 
                        periods[index], 
                        periodClasses[index]
                    );
                    championsGrid.appendChild(championCard);
                });
            } catch (fallbackError) {
                console.error('Failed to fetch any champions:', fallbackError);
            }
        }
    },
    
    createChampionCard(profile, period, periodClass) {
        const championCard = document.createElement('div');
        championCard.className = `champion-card ${periodClass}`;
        
        const avatarHTML = profile.image 
            ? `<img src="${profile.image}" alt="${profile.username}">` 
            : profile.emoji || '👤';
        
        const tagline = period === 'Day' ? "Today's top performer" 
                      : period === 'Week' ? "This week's champion" 
                      : "Monthly champion";
        
        championCard.innerHTML = `
            <span class="champion-crown">👑</span>
            <div class="champion-period">${period}</div>
            <div class="champion-avatar">${avatarHTML}</div>
            <a href="#" class="champion-username" onclick="event.preventDefault(); ProfileModule.showProfileDetail('${profile.username}'); return false;">${profile.handle}</a>
            <p class="champion-tagline">${tagline}</p>
            <div class="champion-stats">
                <div class="stat-item">
                    <span class="stat-value" data-score="${profile.score}">${profile.score}</span>
                    <span class="stat-label">Score</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" data-votes="${profile.votes}">${profile.votes}</span>
                    <span class="stat-label">Votes</span>
                </div>
            </div>
        `;
        
        return championCard;
    }
};

// ==================== PROFILES MODULE ====================
const ProfilesModule = {
    async updateProfilesSection() {
        const profilesGrid = document.querySelector('.profiles-grid');
        if (!profilesGrid) return;
        
        try {
            profilesGrid.innerHTML = '';
            
            // Fetch all profiles from backend
            const profiles = await window.apiService.getProfiles({ 
                sort: 'votes', 
                order: 'desc', 
                limit: 50 
            });
            
            profiles.forEach((profile, index) => {
                const profileTile = this.createProfileTile(profile, index);
                profilesGrid.appendChild(profileTile);
            });
            
        } catch (error) {
            console.error('Error updating profiles section:', error);
        }
    },
    
createProfileTile(profile, index) {
    const avatarHTML = profile.image 
        ? `<img src="${profile.image}" alt="${profile.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
        : profile.emoji || '👤';
    
    const profileTile = document.createElement('div');
    profileTile.className = 'profile-tile';
    profileTile.style.cursor = 'pointer';
    profileTile.onclick = () => ProfileModule.showProfileDetail(profile.username);
    
    profileTile.innerHTML = `
        <div class="profile-rank">${index + 1}</div>
        <div class="profile-tile-header">
            <div class="profile-tile-avatar">${avatarHTML}</div>
            <div class="profile-tile-info">
                <div class="profile-tile-name">${profile.username}</div>
                <div class="profile-tile-handle">${profile.handle}</div>
            </div>
        </div>
        <div class="profile-tile-stats">
            <div class="profile-tile-stat">
                <div class="stat-title">Battle Votes</div>
                <div class="stat-value">${profile.votes || 0}</div>
            </div>
            <div class="profile-tile-stat">
                <div class="stat-title">Win Rate</div>
                <div class="stat-value">${profile.battleWins && profile.battleLosses ? 
                    Math.round((profile.battleWins / (profile.battleWins + profile.battleLosses)) * 100) : 0}%</div>
            </div>
        </div>
        <div class="profile-tile-footer">
            <div class="followers-count">Followers: ${profile.followers}</div>
            <div class="score-badge">Score: ${profile.score}</div>
        </div>
    `;
    
    return profileTile;
}
};

// ==================== KOL MODULE ====================
const KOLModule = {
    kolData: [],
    
    async loadKOLData(filter = 'all') {
        const kolRowsContainer = document.getElementById('kol-holdings-rows');
        if (!kolRowsContainer) return;
        
        try {
            kolRowsContainer.innerHTML = '';
            
            // Fetch KOL data from backend
            const profiles = await window.apiService.getProfiles({ limit: 50 });
            
            // Transform profiles to KOL format
            this.kolData = profiles.map((profile, index) => ({
                rank: index + 1,
                name: profile.username,
                handle: profile.handle,
                avatar: profile.image,
                holdings: profile.marketCap || '$0',
                bought: `${Math.floor(Math.random() * 200)}K`,
                sold: `${Math.floor(Math.random() * 100)}K`,
                pnl: profile.change || '+0%',
                pnlType: profile.change?.includes('+') ? 'positive' : 'negative',
                activity: Array(5).fill(null).map(() => Math.random() > 0.5)
            }));
            
            let filteredData = [...this.kolData];
            
            switch(filter) {
                case 'whales':
                    filteredData = this.kolData.filter(kol => {
                        const holdings = parseFloat(kol.holdings.replace(/[$,K]/g, '')) * 1000;
                        return holdings > 100000;
                    });
                    break;
                case 'active':
                    filteredData = this.kolData.filter(kol => 
                        kol.activity.filter(a => a).length >= 4
                    );
                    break;
                case 'profitable':
                    filteredData = this.kolData.filter(kol => 
                        kol.pnlType === 'positive'
                    );
                    break;
            }
            
            filteredData.forEach(kol => {
                const row = this.createKOLRow(kol);
                kolRowsContainer.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading KOL data:', error);
        }
    },
    
    createKOLRow(kol) {
        const row = document.createElement('div');
        row.className = 'kol-holdings-row';
        row.onclick = () => this.showKOLProfile(kol);
        
        const activityBars = kol.activity.map(active => 
            `<div class="activity-bar ${active ? 'active' : ''}"></div>`
        ).join('');
        
        row.innerHTML = `
            <div class="kol-rank">${kol.rank}</div>
            <div class="kol-profile">
                <div class="kol-avatar">
                    ${kol.avatar ? `<img src="${kol.avatar}" alt="${kol.name}">` : '👤'}
                </div>
                <div class="kol-info">
                    <div class="kol-name">${kol.name}</div>
                    <div class="kol-handle">${kol.handle}</div>
                </div>
            </div>
            <div class="kol-holdings">${kol.holdings}</div>
            <div class="kol-bought">${kol.bought}</div>
            <div class="kol-sold">${kol.sold}</div>
            <div class="kol-pnl ${kol.pnlType}">${kol.pnl}</div>
            <div class="kol-activity">${activityBars}</div>
        `;
        
        return row;
    },
    
    showKOLProfile(kol) {
        ProfileModule.showProfileDetail(kol.name);
    }
};

// ==================== SEARCH MODULE ====================
const SearchModule = {
    async searchProfile(searchTerm) {
        if (!searchTerm) return;
        
        searchTerm = searchTerm.trim().toLowerCase();
        
        if (searchTerm.startsWith('@')) {
            searchTerm = searchTerm.substring(1);
        }
        
        try {
            // Search through all profiles from backend
            const profiles = await window.apiService.getProfiles({ limit: 100 });
            
            let foundProfile = null;
            
            for (const profile of profiles) {
                const username = profile.username.toLowerCase();
                const handle = profile.handle.toLowerCase().replace('@', '');
                
                if (username === searchTerm || handle === searchTerm || 
                    username.includes(searchTerm) || handle.includes(searchTerm)) {
                    foundProfile = profile;
                    break;
                }
            }
            
            if (foundProfile) {
                ProfileModule.showProfileDetail(foundProfile.username);
                
                const searchInput = document.querySelector('.search-input');
                if (searchInput) searchInput.value = '';
            } else {
                alert(`Profile "${searchTerm}" not found.`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please try again.');
        }
    }
};

// ==================== DEBUG MODULE ====================
const DebugModule = {
    toggle() {
        const debugOverlay = document.getElementById('debug-overlay');
        if (!debugOverlay) return;
        
        if (appState.debug.isVisible) {
            debugOverlay.style.display = 'none';
            appState.debug.isVisible = false;
            
            if (appState.debug.updateInterval) {
                clearInterval(appState.debug.updateInterval);
                appState.debug.updateInterval = null;
            }
        } else {
            debugOverlay.style.display = 'block';
            appState.debug.isVisible = true;
            this.update();
            
            appState.debug.updateInterval = setInterval(() => {
                this.update();
            }, CONFIG.DEBUG_UPDATE_INTERVAL);
        }
    },
    
    update() {
        this.updateBattleInfo();
        this.updateLeaderboardInfo();
        this.updateVisualFeedback();
    },
    
    updateBattleInfo() {
        const leftProfile = document.querySelector('#left-profile .profile-username');
        const rightProfile = document.querySelector('#right-profile .profile-username');
        const debugBattle = document.getElementById('debug-current-battle');
        
        if (leftProfile && rightProfile && debugBattle) {
            debugBattle.innerHTML = `
                <span class="debug-username1">${leftProfile.textContent}</span>
                <span class="debug-vs">🔫 ⚔️ vs</span>
                <span class="debug-username2">${rightProfile.textContent}</span>
            `;
        }
    },
    
    updateLeaderboardInfo() {
        const leaderboardRows = document.querySelectorAll('.leaderboard-row');
        const debugLeaderboard = document.getElementById('debug-leaderboard');
        
        if (leaderboardRows.length > 0 && debugLeaderboard) {
            let debugHTML = '';
            
            Array.from(leaderboardRows).slice(0, 10).forEach((row, index) => {
                const name = row.querySelector('.profile-name')?.textContent || 'Unknown';
                const score = row.querySelector('.score')?.textContent || '0';
                
                const winRate = Math.floor(Math.random() * 100);
                const totalGames = Math.floor(Math.random() * 50) + 10;
                const wins = Math.floor(totalGames * winRate / 100);
                const losses = totalGames - wins;
                
                debugHTML += `
                    <div class="debug-entry">
                        <span class="debug-rank">${index + 1}.</span>
                        <span class="debug-name">${name}:</span>
                        <span class="debug-votes">${score} votes</span>
                        <span class="debug-winrate">(${wins}W/${losses}L)</span>
                    </div>
                `;
            });
            
            debugLeaderboard.innerHTML = debugHTML;
        }
    },
    
    updateVisualFeedback() {
        const debugDot = document.querySelector('.debug-dot');
        if (debugDot) {
            debugDot.style.background = '#00ff00';
            setTimeout(() => {
                debugDot.style.background = '#ff0000';
            }, 500);
        }
    }
};

// ==================== SOCIAL MODULE ====================
const SocialModule = {
    handleFollowButton(profileName) {
        const profile = window.currentViewedProfile;
        
        if (profile && profile.twitterHandle) {
            window.open(`https://x.com/${profile.twitterHandle}`, '_blank');
        } else {
            alert('Twitter handle not available for this profile');
        }
    },
    
    handleShareButton(profileName) {
        const profile = window.currentViewedProfile;
        
        if (profile) {
            const tweetText = `Just voted for ${profileName} The stupid piece of JEETING Dog Shit, @jeetmash`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        } else {
            alert('Profile information not available.');
        }
    }
};

// ==================== COMMENTS MODULE ====================
const CommentsModule = {
    allComments: [],
    currentProfileId: null,
    
    // Load comments for a profile
    async loadProfileComments(profileName) {
        try {
            // First get the profile to get its ID
            const profile = await window.apiService.getProfileByUsername(profileName);
            if (!profile) {
                console.error('Profile not found:', profileName);
                return;
            }
            
            this.currentProfileId = profile._id;
            
            // Now load comments using profile ID
            const comments = await window.apiService.getComments(profile._id);
            this.allComments = comments;
            this.displayAllComments();
            
        } catch (error) {
            console.error('Failed to load comments:', error);
            // Still display any existing comments
            this.displayAllComments();
        }
    },
    
    // Display all comments
    displayAllComments() {
        const commentsList = document.getElementById('profile-comments-list');
        if (!commentsList) return;
        
        commentsList.innerHTML = '';
        
        this.allComments.forEach(comment => {
            this.displayComment(comment);
        });
    },
    
    // Add new comment
    async addNewComment(profileName, commentText) {
        if (!window.walletManager?.canComment()) {
            return false;
        }

        if (!this.currentProfileId) {
            window.walletManager?.showNotification('Profile not found', 'error');
            return false;
        }

        try {
            const comment = await window.apiService.postComment(this.currentProfileId, commentText);
            
            // Add to local array
            this.allComments.unshift(comment);
            
            // Display the new comment
            this.displayComment(comment);
            
            if (window.walletManager) {
                window.walletManager.showNotification('💬 Comment added!', 'success');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to add comment:', error);
            if (window.walletManager) {
                window.walletManager.showNotification('Failed to add comment', 'error');
            }
            return false;
        }
    },

    // Display a single comment
    displayComment(comment) {
        const commentsList = document.getElementById('profile-comments-list');
        if (!commentsList) return;

        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        
        // Check if author has wallet verified
        const isWalletVerified = comment.authorId?.walletAddress ? true : false;
        if (isWalletVerified) {
            commentElement.classList.add('wallet-verified');
        }

        const timeAgo = this.getTimeAgo(new Date(comment.createdAt));
        const verifiedBadge = isWalletVerified ? '<span class="verified-badge">✅</span>' : '';
        
        // Check if current user liked this comment
        const currentUserId = localStorage.getItem('userId');
        const isLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
        
        // Get author info
        const authorName = comment.authorId?.displayName || 'Anonymous';
        const authorAvatar = comment.authorId?.avatar || '👤';

        commentElement.innerHTML = `
            <div class="comment-avatar" style="background: linear-gradient(135deg, #ff0000, #cc0000);">
                ${authorAvatar.startsWith('http') ? `<img src="${authorAvatar}" style="width: 100%; height: 100%; border-radius: 50%;">` : authorAvatar}
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${authorName}</span>
                    ${verifiedBadge}
                    <span class="comment-time">${timeAgo}</span>
                </div>
                <p class="comment-text">${comment.text}</p>
                <div class="comment-reactions" data-comment-id="${comment._id}">
                    <button class="reaction-btn like-btn ${isLiked ? 'liked' : ''}" data-likes="${comment.likes || 0}">
                        <span class="like-icon">❤️</span>
                        <span class="like-count">${comment.likes || 0}</span>
                    </button>
                    <button class="reaction-btn reply-btn">💬 Reply</button>
                    <button class="reaction-btn share-btn">🔄 Share</button>
                </div>
            </div>
        `;

        const firstComment = commentsList.querySelector('.comment-item');
        if (firstComment) {
            commentsList.insertBefore(commentElement, firstComment);
        } else {
            commentsList.appendChild(commentElement);
        }
        
        this.attachCommentEventHandlers(commentElement, comment._id);
    },

    // Attach event handlers to comment buttons
    attachCommentEventHandlers(commentElement, commentId) {
        const likeBtn = commentElement.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCommentLike(likeBtn, commentId);
            });
        }
        
        const replyBtn = commentElement.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCommentReply(commentId);
            });
        }
        
        const shareBtn = commentElement.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCommentShare(commentId);
            });
        }
    },

    // Handle like/unlike
    async handleCommentLike(likeBtn, commentId) {
        if (!window.walletManager?.isConnected) {
            window.walletManager?.showSubtleWarning('Connect wallet to like!');
            return;
        }
        
        try {
            const response = await window.apiService.toggleCommentLike(commentId);
            
            // Update UI
            likeBtn.dataset.likes = response.likes;
            likeBtn.querySelector('.like-count').textContent = response.likes;
            
            if (response.liked) {
                likeBtn.classList.add('liked');
                // Animation
                likeBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    likeBtn.style.transform = 'scale(1)';
                }, 200);
                
                if (window.AudioManager) {
                    AudioManager.playSound('click');
                }
            } else {
                likeBtn.classList.remove('liked');
            }
            
        } catch (error) {
            console.error('Failed to update like:', error);
            window.walletManager?.showNotification('Failed to update like', 'error');
        }
    },

    handleCommentReply(commentId) {
        if (window.walletManager) {
            window.walletManager.showNotification('Reply feature coming soon!', 'info');
        }
    },

    handleCommentShare(commentId) {
        const comment = this.allComments.find(c => c._id === commentId);
        if (comment) {
            const shareText = `Check out this comment on JEETMASH: "${comment.text.substring(0, 100)}..."`;
            const shareUrl = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: 'JEETMASH Comment',
                    text: shareText,
                    url: shareUrl
                }).catch(() => {
                    this.shareToTwitter(shareText, shareUrl);
                });
            } else {
                this.shareToTwitter(shareText, shareUrl);
            }
        }
    },

    shareToTwitter(text, url) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    },

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
};

// ==================== INITIALIZATION MODULE ====================
const InitializationModule = {
    async initializeApp() {
        // Generate a unique user ID if not exists
        if (!localStorage.getItem('userId')) {
            localStorage.setItem('userId', 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        }
        
        this.initializeEventListeners();
        await this.initializeMainApp();
    },
    
    initializeEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMenu();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                DebugModule.toggle();
            }
        });
        
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-button');
        
        if (searchButton) {
            searchButton.addEventListener('click', async (e) => {
                e.preventDefault();
                if (searchInput) {
                    await SearchModule.searchProfile(searchInput.value);
                }
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await SearchModule.searchProfile(searchInput.value);
                }
            });
            searchInput.placeholder = "Search profiles... (e.g. @0xfrenship)";
        }
        
        // Vote buttons
        const leftVoteBtn = document.querySelector('#left-profile .vote-btn');
        const rightVoteBtn = document.querySelector('#right-profile .vote-btn');
        
        if (leftVoteBtn) {
            leftVoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                VotingModule.handleVote(true);
            });
        }
        
        if (rightVoteBtn) {
            rightVoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                VotingModule.handleVote(false);
            });
        }

        // VS Coin Flip Animation
        const vsElement = document.querySelector('.vs-divider');
        if (vsElement) {
            vsElement.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (!this.classList.contains('flipping')) {
                    AudioManager.playSound('click');
                    this.classList.add('flipping');
                    
                    setTimeout(() => {
                        this.classList.remove('flipping');
                    }, 600);
                }
            });
        }
        
        // Leaderboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
                this.classList.add('active');
                LeaderboardModule.updateLeaderboard();
            });
        });
        
        // Profile comments
        const profileSubmitBtn = document.getElementById('profile-submit-comment');
        const profileTextarea = document.getElementById('profile-comment-textarea');
        
        if (profileSubmitBtn && profileTextarea) {
            profileSubmitBtn.addEventListener('click', async () => {
                if (!window.walletManager?.canComment()) {
                    return;
                }

                const commentText = profileTextarea.value.trim();
                if (commentText && window.currentViewedProfile) {
                    const success = await CommentsModule.addNewComment(
                        window.currentViewedProfile.username, 
                        commentText
                    );
                    
                    if (success) {
                        profileTextarea.value = '';
                    }
                }
            });
        }
        
        // Social buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('follow-btn')) {
                const profileName = document.getElementById('detail-name').textContent;
                SocialModule.handleFollowButton(profileName);
            }
            
            if (e.target.classList.contains('share-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const profileName = document.getElementById('detail-name').textContent;
                SocialModule.handleShareButton(profileName);
            }
        });
    },
    
    async initializeMainApp() {
        try {
            // Load first battle profiles from backend
            await VotingModule.loadNewProfiles();
            
            // Initialize leaderboard from backend
            await LeaderboardModule.updateLeaderboard();
            
            // Initialize profiles section
            await ProfilesModule.updateProfilesSection();
            
            // Initialize champions
            await ChampionsModule.updateJeetChampions();
            
            // Initialize KOL data if section exists
            if (document.getElementById('kol-holdings-section')) {
                KOLModule.loadKOLData('all');
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            alert('Failed to connect to server. Please make sure the backend is running.');
        }
    },
    
    closeMenu() {
        const dropdown = document.getElementById('unifiedDropdown');
        const menuToggle = document.querySelector('.menu-toggle');
        const backdrop = document.getElementById('dropdownBackdrop');
        
        if (dropdown) dropdown.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    }
};

// ==================== PROFILE VOTING (CHAD/JEET) ====================
// Store current profile being viewed
window.currentViewedProfile = null;

// Updated profile voting function
window.handleProfileVote = async function(voteType) {
    // Check wallet connection first
    if (!window.walletManager?.canVote()) {
        return;
    }

    const profileName = document.getElementById('detail-name')?.textContent || 'Unknown';
    
    // Get vote buttons
    const chadBtn = document.querySelector('.chad-vote-btn');
    const jeetBtn = document.querySelector('.jeet-vote-btn');
    
    // Check if already voted
    if (chadBtn.classList.contains('voted') || jeetBtn.classList.contains('voted')) {
        return;
    }
    
    try {
        // Get profile from backend first if we don't have the ID
        if (!window.currentViewedProfile || !window.currentViewedProfile._id) {
            const profile = await window.apiService.getProfileByUsername(profileName);
            if (!profile) {
                throw new Error('Profile not found');
            }
            window.currentViewedProfile = profile;
        }
        
        // Play vote sound
        if (window.AudioManager) {
            AudioManager.playVoteSound();
        }
        
        // Add voting animation
        if (voteType === 'chad') {
            chadBtn.classList.add('voting', 'voted');
            jeetBtn.style.opacity = '0.5';
        } else {
            jeetBtn.classList.add('voting', 'voted');
            chadBtn.style.opacity = '0.5';
        }
        
        // Submit vote to backend
        const result = await window.apiService.submitProfileVote(
            window.currentViewedProfile._id, 
            voteType
        );
        
        // Update vote counts with backend response
        const chadCount = document.getElementById('chad-count');
        const jeetCount = document.getElementById('jeet-count');
        
        if (result.chadVotes !== undefined) {
            chadCount.textContent = formatVoteCount(result.chadVotes);
        }
        if (result.jeetVotes !== undefined) {
            jeetCount.textContent = formatVoteCount(result.jeetVotes);
        }
        
        // Force update percentages based on new counts
        updateVotePercentages();
        
        // Show success message
        if (window.walletManager) {
            window.walletManager.showNotification(
                `🗳️ Voted ${voteType.toUpperCase()} for ${profileName}!`, 
                'success'
            );
        }
        
    } catch (error) {
        console.error('Profile vote failed:', error);
        // Reset vote state on error
        chadBtn.classList.remove('voting', 'voted');
        jeetBtn.classList.remove('voting', 'voted');
        chadBtn.style.opacity = '1';
        jeetBtn.style.opacity = '1';
        
        if (window.walletManager) {
            window.walletManager.showNotification('Vote failed. Please try again.', 'error');
        }
    }
};

// Format vote count (1234 -> 1.2K)
function formatVoteCount(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

// Update vote percentages
// Replace your updateVotePercentages function with this fixed version:

function updateVotePercentages(chadPercent, jeetPercent) {
    console.log('updateVotePercentages called with:', chadPercent, jeetPercent);
    
    // Get the actual vote counts from the display
    const chadCountElement = document.getElementById('chad-count');
    const jeetCountElement = document.getElementById('jeet-count');
    
    if (!chadCountElement || !jeetCountElement) {
        console.error('Vote count elements not found!');
        return;
    }
    
    const chadCountText = chadCountElement.textContent;
    const jeetCountText = jeetCountElement.textContent;
    
    // Parse the counts (handle K format)
    const parseCount = (text) => {
        text = text.toString().trim();
        if (text.includes('K') || text.includes('k')) {
            return parseFloat(text.replace(/[Kk]/g, '')) * 1000;
        }
        return parseInt(text) || 0;
    };
    
    const chadCount = parseCount(chadCountText);
    const jeetCount = parseCount(jeetCountText);
    
    console.log('Parsed counts - Chad:', chadCount, 'Jeet:', jeetCount);
    
    // If percentages aren't provided, calculate them from counts
    if (chadPercent === undefined || jeetPercent === undefined) {
        const total = chadCount + jeetCount;
        if (total > 0) {
            chadPercent = Math.round((chadCount / total) * 100);
            jeetPercent = Math.round((jeetCount / total) * 100);
            
            // Ensure they add up to 100
            if (chadPercent + jeetPercent !== 100) {
                if (chadPercent > jeetPercent) {
                    chadPercent = 100 - jeetPercent;
                } else {
                    jeetPercent = 100 - chadPercent;
                }
            }
        } else {
            chadPercent = 50;
            jeetPercent = 50;
        }
    }
    
    console.log('Final percentages - Chad:', chadPercent, 'Jeet:', jeetPercent);
    
    // Update percentage bars
    const chadBar = document.getElementById('chad-percentage');
    const jeetBar = document.getElementById('jeet-percentage');
    
    if (chadBar && jeetBar) {
        // Since we're using absolute positioning, we need to set left/right positions
        chadBar.style.width = `${chadPercent}%`;
        chadBar.style.left = '0';
        chadBar.style.right = 'auto';
        
        jeetBar.style.width = `${jeetPercent}%`;
        jeetBar.style.left = 'auto';
        jeetBar.style.right = '0';
        
        console.log('Updated bar widths - Chad:', chadBar.style.width, 'Jeet:', jeetBar.style.width);
    } else {
        console.error('Percentage bar elements not found!');
    }
    
    // Update percentage text
    const chadStat = document.querySelector('.chad-stat');
    const jeetStat = document.querySelector('.jeet-stat');
    
    if (chadStat) chadStat.textContent = chadPercent + '% Chad';
    if (jeetStat) jeetStat.textContent = jeetPercent + '% Jeet';
}

// Also update the handleProfileVote to ensure percentages are recalculated
window.handleProfileVote = async function(voteType) {
    // Check wallet connection first
    if (!window.walletManager?.canVote()) {
        return;
    }

    const profileName = document.getElementById('detail-name')?.textContent || 'Unknown';
    
    // Get vote buttons
    const chadBtn = document.querySelector('.chad-vote-btn');
    const jeetBtn = document.querySelector('.jeet-vote-btn');
    
    // Check if already voted
    if (chadBtn.classList.contains('voted') || jeetBtn.classList.contains('voted')) {
        return;
    }
    
    try {
        // Get profile from backend first if we don't have the ID
        if (!window.currentViewedProfile || !window.currentViewedProfile._id) {
            const profile = await window.apiService.getProfileByUsername(profileName);
            if (!profile) {
                throw new Error('Profile not found');
            }
            window.currentViewedProfile = profile;
        }
        
        // Play vote sound
        if (window.AudioManager) {
            AudioManager.playVoteSound();
        }
        
        // Add voting animation
        if (voteType === 'chad') {
            chadBtn.classList.add('voting', 'voted');
            jeetBtn.style.opacity = '0.5';
        } else {
            jeetBtn.classList.add('voting', 'voted');
            chadBtn.style.opacity = '0.5';
        }
        
        // Submit vote to backend
        const result = await window.apiService.submitProfileVote(
            window.currentViewedProfile._id, 
            voteType
        );
        
        // Update vote counts with backend response
        const chadCount = document.getElementById('chad-count');
        const jeetCount = document.getElementById('jeet-count');
        
        if (result.chadVotes !== undefined) {
            chadCount.textContent = formatVoteCount(result.chadVotes);
        }
        if (result.jeetVotes !== undefined) {
            jeetCount.textContent = formatVoteCount(result.jeetVotes);
        }
        
        // Force update percentages based on new counts
        updateVotePercentages();
        
        // Show success message
        if (window.walletManager) {
            window.walletManager.showNotification(
                `🗳️ Voted ${voteType.toUpperCase()} for ${profileName}!`, 
                'success'
            );
        }
        
    } catch (error) {
        console.error('Profile vote failed:', error);
        // Reset vote state on error
        chadBtn.classList.remove('voting', 'voted');
        jeetBtn.classList.remove('voting', 'voted');
        chadBtn.style.opacity = '1';
        jeetBtn.style.opacity = '1';
        
        if (window.walletManager) {
            window.walletManager.showNotification('Vote failed. Please try again.', 'error');
        }
    }
};


// ==================== GLOBAL FUNCTION EXPORTS ====================
// Export functions that are called from HTML onclick attributes
window.showSection = (section) => NavigationModule.showSection(section);
window.scrollToElement = (elementId) => NavigationModule.scrollToElement(elementId);
window.showProfileDetail = (username) => ProfileModule.showProfileDetail(username);
window.ProfileModule = ProfileModule;
window.filterKOLs = (filter) => {
    document.querySelectorAll('.kol-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    KOLModule.loadKOLData(filter);
};
window.toggleDebug = () => DebugModule.toggle();
window.openInfoPage = () => {
    toggleInfoDropdown(event);
};

// Connect wallet function
window.connectWallet = () => {
    if (window.walletManager) {
        if (window.walletManager.isConnected) {
            window.walletManager.showWalletMenu();
        } else {
            window.walletManager.connectWallet();
        }
    } else {
        alert('Wallet manager not loaded. Please refresh the page.');
    }
};

// Leaderboard view handler
window.showLeaderboardView = async function(period) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Fetch and display leaderboard for selected period
    await LeaderboardModule.updateLeaderboard(period);
};

// Info dropdown toggle
window.toggleInfoDropdown = function(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('info-dropdown');
    const isActive = dropdown.classList.contains('active');
    
    // Close any other open dropdowns
    document.querySelectorAll('.info-dropdown').forEach(d => d.classList.remove('active'));
    
    if (!isActive) {
        dropdown.classList.add('active');
        
        // Add backdrop to close on outside click
        const backdrop = document.createElement('div');
        backdrop.className = 'info-dropdown-backdrop active';
        backdrop.onclick = function() {
            dropdown.classList.remove('active');
            backdrop.remove();
        };
        document.body.appendChild(backdrop);
        
        // Play sound effect
        if (window.AudioManager) {
            AudioManager.playSound('click');
        }
    } else {
        dropdown.classList.remove('active');
        document.querySelector('.info-dropdown-backdrop')?.remove();
    }
};

// Close dropdown on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('info-dropdown')?.classList.remove('active');
        document.querySelector('.info-dropdown-backdrop')?.remove();
    }
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    await InitializationModule.initializeApp();
});

// Export modules for debugging
window.VotingModule = VotingModule;
window.CommentsModule = CommentsModule;
window.InitializationModule = InitializationModule;
window.LeaderboardModule = LeaderboardModule;
window.ChampionsModule = ChampionsModule;
window.ProfilesModule = ProfilesModule;
window.SearchModule = SearchModule;