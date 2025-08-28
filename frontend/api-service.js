// api-service.js

class APIService {
    constructor() {
this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('jeetmash_token');
        this.currentUser = null;
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Add auth token if available
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('jeetmash_token', token);
    }

    // Clear auth
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('jeetmash_token');
    }

    // ==================== AUTH ====================

async authenticateWallet(walletAddress) {
    try {
        const response = await this.request('/auth/wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                walletAddress,
                signature: 'dummy-signature', // In production, get actual signature
                message: 'Sign in to JEETMASH'
            })
        });

        if (response.token) {
            this.setToken(response.token);
            this.currentUser = response.user;
        }

        return response;
    } catch (error) {
        console.error('Auth error:', error);
        throw error;
    }
}

    // ==================== PROFILES ====================

    async getProfiles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/profiles?${queryString}`);
    }

    async getProfile(id) {
        return this.request(`/profiles/${id}`);
    }

    async getProfileByUsername(username) {
        return this.request(`/profiles/username/${encodeURIComponent(username)}`);
    }

    // ==================== VOTING ====================

    async submitBattleVote(winnerId, loserId) {
        return this.request('/votes/battle', {
            method: 'POST',
            body: JSON.stringify({ winnerId, loserId })
        });
    }

    async submitProfileVote(profileId, voteType) {
        return this.request(`/votes/profile/${profileId}`, {
            method: 'POST',
            body: JSON.stringify({ voteType })
        });
    }

    // ==================== COMMENTS ====================

    async getComments(profileId) {
        return this.request(`/comments/profile/${profileId}`);
    }

    async postComment(profileId, text) {
        return this.request('/comments', {
            method: 'POST',
            body: JSON.stringify({ profileId, text })
        });
    }

    async toggleCommentLike(commentId) {
        return this.request(`/comments/${commentId}/like`, {
            method: 'POST'
        });
    }

    // ==================== LEADERBOARD ====================

    async getLeaderboard(period = 'all', limit = 50) {
        return this.request(`/leaderboard?period=${period}&limit=${limit}`);
    }

    // ==================== PROFILE LOOKUP ====================
    
    // Helper to get or create profile from frontend data
    async ensureProfile(profileData) {
        try {
            // First try to get existing profile
            let profile = await this.getProfileByUsername(profileData.username);
            return profile;
        } catch (error) {
            // Profile doesn't exist, you might want to create it
            console.log('Profile not found:', profileData.username);
            // For now, return null - you could add a create profile endpoint
            return null;
        }
    }
}

// Initialize API service
window.apiService = new APIService();