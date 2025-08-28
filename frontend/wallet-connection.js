// wallet-connection.js

// ==================== WALLET CONNECTION MANAGER ====================
class WalletManager {
    constructor() {
        this.isConnected = false;
        this.walletAddress = null;
        this.provider = null;
        
        // Wait for Phantom to inject before initializing
        if (document.readyState === 'complete') {
            setTimeout(() => this.init(), 100);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.init(), 100);
            });
        }
    }

    init() {
        // Check if already connected (from localStorage)
        const savedAddress = localStorage.getItem('walletAddress');
        if (savedAddress && window.solana?.isPhantom) {
            this.walletAddress = savedAddress;
            this.isConnected = true;
            this.provider = window.solana;
            this.updateUI();
            
            // Verify the connection is still valid
            this.verifyConnection();
        }
    }

    async verifyConnection() {
        try {
            if (window.solana && window.solana.isConnected) {
                console.log('Wallet still connected');
            } else {
                // Connection lost, reset
                this.isConnected = false;
                this.updateUI();
            }
        } catch (error) {
            console.error('Connection verification failed:', error);
        }
    }

    async connectWallet() {
        try {
            // Show loading state
            this.setButtonLoading(true);
            
            // Small delay to ensure Phantom is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Try multiple ways to find Phantom
            let provider = null;
            
            // Method 1: Direct window.solana
            if (window.solana && window.solana.isPhantom) {
                provider = window.solana;
            } 
            // Method 2: Check window.phantom
            else if (window.phantom?.solana?.isPhantom) {
                provider = window.phantom.solana;
            }
            // Method 3: Wait a bit more and try again
            else {
                console.log('Phantom not immediately available, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (window.solana && window.solana.isPhantom) {
                    provider = window.solana;
                } else if (window.phantom?.solana?.isPhantom) {
                    provider = window.phantom.solana;
                }
            }
            
            if (provider) {
                console.log('Phantom provider found:', provider);
                
                try {
                    // This should trigger Phantom popup from the extension
                    const response = await provider.connect();
                    const address = response.publicKey.toString();
                    
                    console.log('Connected successfully:', address);
                    
                    // Save connection
                    this.walletAddress = address;
                    this.isConnected = true;
                    this.provider = provider;
                    
                    // Store in localStorage
                    localStorage.setItem('walletAddress', address);
                    
                    // Try backend auth
                    this.authenticateWithBackend(address);
                    
                    // Update UI
                    this.updateUI();
                    this.showNotification('Wallet connected successfully!', 'success');
                    
                } catch (error) {
                    console.error('Connection error:', error);
                    
                    if (error.code === 4001) {
                        this.showNotification('Connection cancelled', 'warning');
                    } else if (error.message && error.message.includes('locked')) {
                        this.showNotification('Please unlock Phantom and try again', 'warning');
                    } else {
                        this.showNotification('Connection failed. Please try again.', 'error');
                    }
                }
            } else {
                // No provider found - show a more helpful message
                console.error('Phantom wallet extension not found');
                
                // Create a custom modal instead of redirecting
                this.showPhantomNotFoundModal();
            }
            
        } catch (error) {
            console.error('Unexpected error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setButtonLoading(false);
        }
    }

    async authenticateWithBackend(address) {
        try {
            if (window.apiService && window.apiService.authenticateWallet) {
                const authResponse = await window.apiService.authenticateWallet(address);
                
                if (authResponse && authResponse.user) {
                    this.userId = authResponse.user.id;
                    localStorage.setItem('userId', authResponse.user.id);
                }
            }
        } catch (error) {
            console.error('Backend auth failed:', error);
            // Don't show error - wallet still works locally
        }
    }

    disconnectWallet() {
        // Clear connection
        this.walletAddress = null;
        this.isConnected = false;
        this.provider = null;
        
        // Clear from localStorage
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('userId');
        
        // Disconnect from Phantom
        if (window.solana && window.solana.disconnect) {
            window.solana.disconnect();
        }
        
        // Update UI
        this.updateUI();
        this.showNotification('Wallet disconnected', 'info');
        
        // Close wallet menu if open
        this.hideWalletMenu();
    }

    // Check if user can vote
    canVote() {
        if (!this.isConnected) {
            this.showSubtleWarning('Connect wallet to vote!');
            this.highlightConnectButton();
            return false;
        }
        return true;
    }

    // Check if user can comment
    canComment() {
        if (!this.isConnected) {
            this.showSubtleWarning('Connect wallet to comment!');
            this.highlightConnectButton();
            return false;
        }
        return true;
    }

    // Highlight the connect button
    highlightConnectButton() {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        if (connectBtn) {
            connectBtn.classList.add('pulse');
            setTimeout(() => connectBtn.classList.remove('pulse'), 2000);
        }
    }

    // Show subtle warning near the element
    showSubtleWarning(message) {
        // Remove any existing warnings
        const existingWarnings = document.querySelectorAll('.wallet-warning-subtle');
        existingWarnings.forEach(w => w.remove());

        // Find the active element (button that was clicked)
        const activeElement = document.activeElement;
        
        // Create warning element
        const warning = document.createElement('div');
        warning.className = 'wallet-warning-subtle';
        warning.innerHTML = `
            <div class="warning-arrow"></div>
            <div class="warning-content">
                <span class="warning-icon">🔐</span>
                <span class="warning-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Position the warning near the clicked element
        if (activeElement && activeElement.getBoundingClientRect) {
            const rect = activeElement.getBoundingClientRect();
            const warningRect = warning.getBoundingClientRect();
            
            // Position above the button
            warning.style.left = `${rect.left + (rect.width / 2) - (warningRect.width / 2)}px`;
            warning.style.top = `${rect.top - warningRect.height - 10}px`;
            
            // Check if it goes off screen and adjust
            if (warning.offsetLeft < 10) {
                warning.style.left = '10px';
            }
            if (warning.offsetLeft + warningRect.width > window.innerWidth - 10) {
                warning.style.left = `${window.innerWidth - warningRect.width - 10}px`;
            }
        }
        
        // Animate in
        requestAnimationFrame(() => {
            warning.classList.add('show');
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            warning.classList.add('fade-out');
            setTimeout(() => warning.remove(), 300);
        }, 3000);
        
        // Remove on click anywhere
        setTimeout(() => {
            document.addEventListener('click', function removeWarning() {
                warning.remove();
                document.removeEventListener('click', removeWarning);
            });
        }, 100);
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.wallet-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `wallet-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Get user identifier
    getUserIdentifier() {
        if (!this.isConnected || !this.walletAddress) return null;
        
        return {
            address: this.walletAddress,
            shortAddress: `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`
        };
    }

    // Update UI elements
    updateUI() {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        if (!connectBtn) return;

        // Remove all state classes first
        connectBtn.classList.remove('connected', 'loading');
        
        if (this.isConnected) {
            connectBtn.classList.add('connected');
            connectBtn.innerHTML = `
                <span class="wallet-icon">👻</span>
                <span class="wallet-address">${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}</span>
            `;
            connectBtn.onclick = () => this.showWalletMenu();
        } else {
            // Ensure button has correct class and styling when disconnected
            connectBtn.className = 'connect-wallet-btn'; // Reset to base class
            connectBtn.innerHTML = `
                <span class="wallet-icon">🔐</span>
                <span>CONNECT WALLET</span>
            `;
            connectBtn.onclick = () => this.connectWallet();
        }
        
        // Ensure button maintains its style
        connectBtn.style.cssText = ''; // Clear any inline styles
    }

    // Set button loading state
    setButtonLoading(isLoading) {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        if (!connectBtn) return;

        if (isLoading) {
            connectBtn.classList.add('loading');
            connectBtn.disabled = true;
            connectBtn.innerHTML = `
                <span class="wallet-icon rotating">⏳</span>
                <span>Connecting...</span>
            `;
        } else {
            connectBtn.classList.remove('loading');
            connectBtn.disabled = false;
            this.updateUI();
        }
    }

    // Show wallet menu
    showWalletMenu() {
        // Remove existing menus
        this.hideWalletMenu();
        
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'wallet-menu-backdrop';
        backdrop.onclick = () => this.hideWalletMenu();
        
        // Create menu
        const menu = document.createElement('div');
        menu.className = 'wallet-menu';
        menu.innerHTML = `
            <div class="wallet-menu-content">
                <button class="wallet-menu-close" onclick="window.walletManager.hideWalletMenu()">×</button>
                <div class="wallet-info">
                    <div class="wallet-info-header">
                        <span class="phantom-icon">👻</span>
                        <h3>Phantom Wallet</h3>
                    </div>
                    <div class="wallet-address-full">
                        <label>Address</label>
                        <div class="address-display">
                            <span>${this.walletAddress}</span>
                            <button class="copy-btn" onclick="window.walletManager.copyAddress()">📋</button>
                        </div>
                    </div>
                    <div class="wallet-stats">
                        <div class="stat">
                            <label>Total Votes</label>
                            <span>${localStorage.getItem('userVotes') || '0'}</span>
                        </div>
                        <div class="stat">
                            <label>Status</label>
                            <span class="status-connected">Connected</span>
                        </div>
                    </div>
                </div>
                <div class="wallet-actions">
                    <button class="wallet-action-btn disconnect" onclick="window.walletManager.disconnectWallet()">
                        <span>🔌</span> Disconnect Wallet
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(menu);
        
        // Animate in
        requestAnimationFrame(() => {
            backdrop.classList.add('active');
            menu.classList.add('active');
        });
    }

    // Copy address to clipboard
    copyAddress() {
        navigator.clipboard.writeText(this.walletAddress).then(() => {
            this.showNotification('Address copied!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy address', 'error');
        });
    }

    // Hide wallet menu
    hideWalletMenu() {
        const backdrop = document.querySelector('.wallet-menu-backdrop');
        const menu = document.querySelector('.wallet-menu');
        
        if (backdrop) {
            backdrop.classList.remove('active');
            setTimeout(() => backdrop.remove(), 300);
        }
        
        if (menu) {
            menu.classList.remove('active');
            setTimeout(() => menu.remove(), 300);
        }
    }
    
    // Add this new method to show a helpful modal when Phantom is not found
    showPhantomNotFoundModal() {
        // Remove any existing modals
        const existingModal = document.querySelector('.phantom-not-found-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'phantom-not-found-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.phantom-not-found-modal').remove()">×</button>
                <div class="modal-icon">👻</div>
                <h3>Phantom Wallet Not Detected</h3>
                <p>To connect your wallet, you need the Phantom browser extension installed.</p>
                
                <div class="modal-options">
                    <div class="option">
                        <h4>Option 1: Install Phantom Extension</h4>
                        <p>If you don't have Phantom installed, you can get it from your browser's extension store.</p>
                        <button class="install-guide-btn" onclick="window.walletManager.showInstallGuide()">
                            Installation Guide
                        </button>
                    </div>
                    
                    <div class="option">
                        <h4>Option 2: Already Installed?</h4>
                        <p>If you have Phantom installed, try:</p>
                        <ul>
                            <li>Refreshing this page</li>
                            <li>Checking if Phantom is enabled</li>
                            <li>Unlocking your Phantom wallet</li>
                        </ul>
                        <button class="retry-btn" onclick="window.location.reload()">
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    // Add this method to show installation guide
    showInstallGuide() {
        const guideModal = document.createElement('div');
        guideModal.className = 'install-guide-modal';
        guideModal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.install-guide-modal').remove()">×</button>
                <h3>How to Install Phantom</h3>
                <div class="browser-options">
                    <a href="https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa" 
                       target="_blank" class="browser-option">
                        <span class="browser-icon">🌐</span>
                        <span>Chrome / Brave</span>
                    </a>
                    <a href="https://addons.mozilla.org/en-US/firefox/addon/phantom-app/" 
                       target="_blank" class="browser-option">
                        <span class="browser-icon">🦊</span>
                        <span>Firefox</span>
                    </a>
                    <a href="https://microsoftedge.microsoft.com/addons/detail/phantom/ieeglmmkneimhpdbllcdnopmhnadobem" 
                       target="_blank" class="browser-option">
                        <span class="browser-icon">🔷</span>
                        <span>Edge</span>
                    </a>
                </div>
                <p class="guide-note">After installation, refresh this page to connect.</p>
            </div>
        `;
        
        document.body.appendChild(guideModal);
        
        // Close the previous modal
        const previousModal = document.querySelector('.phantom-not-found-modal');
        if (previousModal) previousModal.remove();
        
        // Add animation
        requestAnimationFrame(() => {
            guideModal.classList.add('active');
        });
    }
}

// Initialize wallet manager after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletManager = new WalletManager();
    });
} else {
    window.walletManager = new WalletManager();
}

// Add all the styles
const walletStyles = `
/* ==================== WALLET CONNECTION STYLES ==================== */
.connect-wallet-btn {
    background: linear-gradient(135deg, #ff0000, #cc0000);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.connect-wallet-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 0, 0, 0.4);
}

.connect-wallet-btn.connected {
    background: linear-gradient(135deg, #00ff00, #00cc00);
}

.connect-wallet-btn.loading {
    background: linear-gradient(135deg, #666, #444);
    cursor: not-allowed;
}

.connect-wallet-btn.pulse {
    animation: pulse 2s ease-in-out;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.wallet-icon {
    font-size: 1.2em;
}

.rotating {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    to { transform: rotate(360deg); }
}

/* ==================== NOTIFICATIONS ==================== */
.wallet-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(20, 20, 20, 0.95);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 10001;
    max-width: 300px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.wallet-notification.show {
    transform: translateX(0);
}

.wallet-notification.success {
    border-color: #00ff00;
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);
}

.wallet-notification.error {
    border-color: #ff0000;
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.2);
}

.wallet-notification.warning {
    border-color: #ffaa00;
    box-shadow: 0 4px 20px rgba(255, 170, 0, 0.2);
}

/* ==================== WALLET MENU ==================== */
.wallet-menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.wallet-menu-backdrop.active {
    opacity: 1;
}

.wallet-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 0;
    width: 90%;
    max-width: 400px;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.wallet-menu.active {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.wallet-menu-content {
    padding: 24px;
}

.wallet-menu-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #666;
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.wallet-menu-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.wallet-info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.phantom-icon {
    font-size: 2em;
}

.wallet-info h3 {
    margin: 0;
    color: white;
    font-size: 1.4em;
}

.wallet-address-full {
    margin-bottom: 20px;
}

.wallet-address-full label {
    display: block;
    color: #666;
    font-size: 0.9em;
    margin-bottom: 8px;
}

.address-display {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.address-display span {
    font-family: monospace;
    font-size: 0.9em;
    color: #ccc;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.copy-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.wallet-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
}

.wallet-stats .stat {
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.wallet-stats .stat label {
    display: block;
    color: #666;
    font-size: 0.9em;
    margin-bottom: 4px;
}

.wallet-stats .stat span {
    display: block;
    color: white;
    font-size: 1.2em;
    font-weight: 600;
}

.status-connected {
    color: #00ff00 !important;
}

.wallet-action-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.wallet-action-btn.disconnect {
    background: rgba(255, 0, 0, 0.1);
    color: #ff6666;
    border: 1px solid rgba(255, 0, 0, 0.3);
}

.wallet-action-btn.disconnect:hover {
    background: rgba(255, 0, 0, 0.2);
    transform: translateY(-1px);
}

/* ==================== SUBTLE WARNING ==================== */
.wallet-warning-subtle {
    position: fixed;
    background: rgba(20, 20, 20, 0.95);
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 0, 0, 0.3);
    box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.3),
        0 0 20px rgba(255, 0, 0, 0.1);
    z-index: 10000;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    max-width: 250px;
    font-size: 0.9rem;
}

.wallet-warning-subtle.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.wallet-warning-subtle.fade-out {
    opacity: 0;
    transform: translateY(-10px);
}

.warning-arrow {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: rgba(20, 20, 20, 0.95);
    border-right: 1px solid rgba(255, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 0, 0, 0.3);
    transform: translateX(-50%) rotate(45deg);
}

.warning-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.warning-icon {
    font-size: 1.1rem;
}

.warning-text {
    font-weight: 500;
    line-height: 1.3;
}

/* Animation */
@keyframes subtleShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
}

.wallet-warning-subtle.show {
    animation: subtleShake 0.3s ease-in-out;
}

/* ==================== PHANTOM NOT FOUND MODAL ==================== */
.phantom-not-found-modal,
.install-guide-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.phantom-not-found-modal.active,
.install-guide-modal.active {
    opacity: 1;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    cursor: pointer;
}

.modal-content {
    position: relative;
    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.phantom-not-found-modal.active .modal-content,
.install-guide-modal.active .modal-content {
    transform: scale(1);
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #666;
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.modal-icon {
    font-size: 4em;
    text-align: center;
    margin-bottom: 16px;
}

.modal-content h3 {
    color: white;
    font-size: 1.6em;
    margin: 0 0 16px 0;
    text-align: center;
}

.modal-content p {
    color: #999;
    line-height: 1.6;
    margin-bottom: 24px;
    text-align: center;
}

.modal-options {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-top: 32px;
}

.option {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
}

.option h4 {
    color: white;
    margin: 0 0 12px 0;
    font-size: 1.1em;
}

.option p {
    color: #aaa;
    margin: 0 0 16px 0;
    text-align: left;
    font-size: 0.95em;
}

.option ul {
    margin: 0;
    padding-left: 20px;
    color: #aaa;
    font-size: 0.95em;
}

.option ul li {
    margin-bottom: 8px;
}

.install-guide-btn,
.retry-btn {
    width: 100%;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.install-guide-btn {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
}

.install-guide-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(139, 92, 246, 0.4);
}

.retry-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.retry-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

/* Browser Options */
.browser-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin: 24px 0;
}

.browser-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    text-decoration: none;
    color: white;
    transition: all 0.2s ease;
}

.browser-option:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 255, 255, 0.1);
}

.browser-icon {
    font-size: 2em;
}

.guide-note {
    text-align: center;
    color: #666;
    font-size: 0.9em;
    margin-top: 24px;
    margin-bottom: 0;
}

/* Mobile adjustments */
@media (max-width: 480px) {
    .wallet-warning-subtle {
        max-width: 200px;
        font-size: 0.85rem;
        padding: 10px 14px;
    }
    
    .wallet-notification {
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .modal-content {
        padding: 24px;
    }
    
    .modal-options {
        gap: 16px;
    }
    
    .browser-options {
        grid-template-columns: 1fr;
    }
}
`;

// Inject the styles
const styleElement = document.createElement('style');
styleElement.textContent = walletStyles;
document.head.appendChild(styleElement);