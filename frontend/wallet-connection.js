// wallet-connection.js

// ==================== WALLET CONNECTION MANAGER ====================
class WalletManager {
    constructor() {
        this.isConnected = false;
        this.walletAddress = null;
        this.provider = null;
        this.walletType = null; // 'phantom', 'solflare', 'backpack', 'coinbase', 'trust', 'glow'

        // Wait for wallet to inject before initializing
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
        const savedWalletType = localStorage.getItem('walletType');

        if (savedAddress && savedWalletType) {
            const provider = this.getWalletProvider(savedWalletType);
            if (provider && provider.isConnected) {
                this.walletAddress = savedAddress;
                this.walletType = savedWalletType;
                this.isConnected = true;
                this.provider = provider;
                this.verifyConnection();
            }
        }

        // Always update UI to set up click handlers
        this.updateUI();
    }

    getWalletProvider(type) {
        switch (type) {
            case 'phantom':
                return window.solana?.isPhantom ? window.solana : window.phantom?.solana;
            case 'solflare':
                return window.solflare?.isSolflare ? window.solflare : null;
            case 'backpack':
                return window.backpack || null;
            case 'coinbase':
                return window.coinbaseSolana || null;
            case 'trust':
                return window.trustwallet?.solana || null;
            case 'glow':
                return window.glowSolana || null;
            default:
                return null;
        }
    }

    async verifyConnection() {
        try {
            if (this.provider && this.provider.isConnected) {
                console.log('Wallet still connected');
            } else {
                this.isConnected = false;
                this.updateUI();
            }
        } catch (error) {
            console.error('Connection verification failed:', error);
        }
    }

    // Show wallet selection modal
    showWalletModal() {
        // Remove existing modal
        const existingModal = document.querySelector('.wallet-connect-modal');
        if (existingModal) existingModal.remove();

        // Detect available wallets
        const hasPhantom = !!(window.solana?.isPhantom || window.phantom?.solana);
        const hasSolflare = !!(window.solflare?.isSolflare);
        const hasBackpack = !!(window.backpack);

        const modal = document.createElement('div');
        modal.className = 'wallet-connect-modal';
        modal.innerHTML = `
            <div class="wallet-modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="wallet-modal-content">
                <button class="wallet-modal-close" onclick="this.closest('.wallet-connect-modal').remove()">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
                    </svg>
                </button>

                <div class="wallet-modal-header">
                    <h2>Connect Wallet</h2>
                    <p>Select a wallet to connect to JEETMASH</p>
                </div>

                <div class="wallet-options">
                    <!-- Phantom Wallet -->
                    <button class="wallet-option ${hasPhantom ? '' : ''}"
                            onclick="window.walletManager.connectSpecificWallet('phantom')">
                        <div class="wallet-option-icon">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #AB9FF2 0%, #7C3AED 100%); display: flex; align-items: center; justify-content: center; padding: 6px;">
                                <img src="frontend/assets/phantom-logo.webp"
                                     alt="Phantom"
                                     style="width: 28px; height: 28px; object-fit: contain;"
                                     onerror="this.style.display='none';">
                            </div>
                        </div>
                        <div class="wallet-option-info">
                            <div class="wallet-option-name">Phantom</div>
                            ${hasPhantom ? '<div class="wallet-option-status">Detected</div>' : ''}
                        </div>
                        <div class="wallet-option-arrow">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </button>

                    <!-- Solflare Wallet -->
                    <button class="wallet-option ${hasSolflare ? '' : ''}"
                            onclick="window.walletManager.connectSpecificWallet('solflare')">
                        <div class="wallet-option-icon">
                            <img src="frontend/assets/solflare-logo.png"
                                 alt="Solflare"
                                 style="width: 40px; height: 40px; border-radius: 10px;"
                                 onerror="this.style.display='none';">
                        </div>
                        <div class="wallet-option-info">
                            <div class="wallet-option-name">Solflare</div>
                            ${hasSolflare ? '<div class="wallet-option-status">Detected</div>' : ''}
                        </div>
                        <div class="wallet-option-arrow">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </button>

                    <!-- Backpack Wallet -->
                    <button class="wallet-option ${hasBackpack ? '' : ''}"
                            onclick="window.walletManager.connectSpecificWallet('backpack')">
                        <div class="wallet-option-icon">
                            <img src="frontend/assets/backpack-logo.png"
                                 alt="Backpack"
                                 style="width: 40px; height: 40px; border-radius: 10px;"
                                 onerror="this.style.display='none';">
                        </div>
                        <div class="wallet-option-info">
                            <div class="wallet-option-name">Backpack</div>
                            ${hasBackpack ? '<div class="wallet-option-status">Detected</div>' : ''}
                        </div>
                        <div class="wallet-option-arrow">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </button>
                </div>

                <div class="wallet-modal-footer">
                    <p class="wallet-disclaimer">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 12C7.4 12 7 11.6 7 11C7 10.4 7.4 10 8 10C8.6 10 9 10.4 9 11C9 11.6 8.6 12 8 12ZM9 9H7V4H9V9Z" fill="currentColor"/>
                        </svg>
                        By connecting your wallet, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    async connectSpecificWallet(type) {
        try {
            this.setLoadingState(type, true);

            await new Promise(resolve => setTimeout(resolve, 100));

            const provider = this.getWalletProvider(type);

            if (provider) {
                try {
                    const response = await provider.connect();
                    const address = response.publicKey.toString();

                    console.log(`${type} connected:`, address);

                    this.walletAddress = address;
                    this.isConnected = true;
                    this.provider = provider;
                    this.walletType = type;

                    localStorage.setItem('walletAddress', address);
                    localStorage.setItem('walletType', type);

                    this.authenticateWithBackend(address);

                    // Close modal
                    const modal = document.querySelector('.wallet-connect-modal');
                    if (modal) modal.remove();

                    this.updateUI();
                    this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} connected successfully!`, 'success');

                } catch (error) {
                    console.error(`${type} connection error:`, error);

                    if (error.code === 4001) {
                        this.showNotification('Connection cancelled', 'warning');
                    } else {
                        this.showNotification(`Failed to connect to ${type}. Please try again.`, 'error');
                    }
                }
            } else {
                this.showNotification(`${type} wallet not found`, 'error');
                this.showInstallOptions();
            }

        } catch (error) {
            console.error('Unexpected error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        } finally {
            this.setLoadingState(type, false);
        }
    }

    setLoadingState(walletType, isLoading) {
        const buttons = document.querySelectorAll('.wallet-option');
        buttons.forEach(btn => {
            if (isLoading) {
                btn.disabled = true;
                btn.classList.add('loading');
            } else {
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        });
    }

    showInstallOptions() {
        const modal = document.createElement('div');
        modal.className = 'wallet-install-modal';
        modal.innerHTML = `
            <div class="wallet-modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="wallet-modal-content">
                <button class="wallet-modal-close" onclick="this.closest('.wallet-install-modal').remove()">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
                    </svg>
                </button>

                <div class="wallet-modal-header">
                    <h2>Get a Wallet</h2>
                    <p>Install a Solana wallet to continue</p>
                </div>

                <div class="install-options">
                    <a href="https://phantom.app/download" target="_blank" class="install-option">
                        <div class="install-icon phantom-icon-small">
                            <svg width="32" height="32" viewBox="0 0 128 128" fill="none">
                                <rect width="128" height="128" rx="24" fill="url(#phantom-gradient-small)"/>
                                <path d="M96.262 41.186c-8.54-11.701-23.023-17.033-39.612-14.595-22.157 3.257-37.953 20.623-40.478 42.523-.73 6.329.365 12.168 3.114 17.19 5.84 10.676 17.566 16.118 32.138 14.924 10.165-.833 19.251-4.851 25.755-11.385 1.095-1.1 1.095-2.883 0-3.983a2.806 2.806 0 00-3.982 0c-5.475 5.502-13.205 8.906-21.914 9.644-12.533 1.062-22.375-3.257-27.117-11.847-2.189-3.967-3.065-8.666-2.481-13.903 2.19-19.617 16.471-34.919 36.576-37.808 14.938-2.147 27.471 2.456 34.795 12.754 2.92 4.116 4.745 9.06 5.329 14.595.146 1.556 1.46 2.737 3.065 2.737 1.606 0 2.92-1.181 3.066-2.737.73-6.182-1.241-12.561-5.254-18.109z" fill="white"/>
                                <circle cx="60" cy="62" r="4" fill="white"/>
                                <circle cx="82" cy="62" r="4" fill="white"/>
                                <defs>
                                    <linearGradient id="phantom-gradient-small" x1="0" y1="0" x2="128" y2="128">
                                        <stop stop-color="#534BB1"/>
                                        <stop offset="1" stop-color="#551BF9"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div class="install-info">
                            <div class="install-name">Phantom</div>
                            <div class="install-desc">Most popular Solana wallet</div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="install-arrow">
                            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>

                    <a href="https://solflare.com/download" target="_blank" class="install-option">
                        <div class="install-icon solflare-icon-small">
                            <svg width="32" height="32" viewBox="0 0 128 128" fill="none">
                                <rect width="128" height="128" rx="24" fill="url(#solflare-gradient-small)"/>
                                <path d="M30.5 74.5L50.5 54.5C51.8807 53.1193 53.8431 52.5 55.8284 52.5H97.5C98.6046 52.5 99.5 53.3954 99.5 54.5C99.5 54.8978 99.3675 55.2794 99.1339 55.5858L79.1339 79.5858C77.7532 81.2765 75.7908 82 73.8056 82H32.5C31.3954 82 30.5 81.1046 30.5 80C30.5 79.6022 30.6325 79.2206 30.8661 78.9142L30.5 74.5Z" fill="#FC9965"/>
                                <path d="M30.5 53.5L50.5 73.5C51.8807 74.8807 53.8431 75.5 55.8284 75.5H97.5C98.6046 75.5 99.5 74.6046 99.5 73.5C99.5 73.1022 99.3675 72.7206 99.1339 72.4142L79.1339 48.4142C77.7532 46.7235 75.7908 46 73.8056 46H32.5C31.3954 46 30.5 46.8954 30.5 48C30.5 48.3978 30.6325 48.7794 30.8661 49.0858L30.5 53.5Z" fill="#FFC84B"/>
                                <defs>
                                    <linearGradient id="solflare-gradient-small" x1="0" y1="0" x2="128" y2="128">
                                        <stop stop-color="#FC9965"/>
                                        <stop offset="1" stop-color="#FFC84B"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div class="install-info">
                            <div class="install-name">Solflare</div>
                            <div class="install-desc">Secure & user-friendly</div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="install-arrow">
                            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </a>
                </div>

                <div class="wallet-modal-footer">
                    <p class="refresh-note">After installing, refresh the page to connect</p>
                </div>
            </div>
        `;

        // Remove connection modal if present
        const connectModal = document.querySelector('.wallet-connect-modal');
        if (connectModal) connectModal.remove();

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));
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
        }
    }

    disconnectWallet() {
        this.walletAddress = null;
        this.isConnected = false;
        this.provider = null;
        this.walletType = null;

        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        localStorage.removeItem('userId');

        if (this.provider && this.provider.disconnect) {
            this.provider.disconnect();
        }

        this.updateUI();
        this.showNotification('Wallet disconnected', 'info');
        this.hideWalletMenu();
    }

    canVote() {
        if (!this.isConnected) {
            this.showSubtleWarning('Connect wallet to vote!');
            this.highlightConnectButton();
            return false;
        }
        return true;
    }

    canComment() {
        if (!this.isConnected) {
            this.showSubtleWarning('Connect wallet to comment!');
            this.highlightConnectButton();
            return false;
        }
        return true;
    }

    highlightConnectButton() {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        if (connectBtn) {
            connectBtn.classList.add('pulse');
            setTimeout(() => connectBtn.classList.remove('pulse'), 2000);
        }
    }

    showSubtleWarning(message) {
        const existingWarnings = document.querySelectorAll('.wallet-warning-subtle');
        existingWarnings.forEach(w => w.remove());

        const activeElement = document.activeElement;

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

        if (activeElement && activeElement.getBoundingClientRect) {
            const rect = activeElement.getBoundingClientRect();
            const warningRect = warning.getBoundingClientRect();

            warning.style.left = `${rect.left + (rect.width / 2) - (warningRect.width / 2)}px`;
            warning.style.top = `${rect.top - warningRect.height - 10}px`;

            if (warning.offsetLeft < 10) {
                warning.style.left = '10px';
            }
            if (warning.offsetLeft + warningRect.width > window.innerWidth - 10) {
                warning.style.left = `${window.innerWidth - warningRect.width - 10}px`;
            }
        }

        requestAnimationFrame(() => {
            warning.classList.add('show');
        });

        setTimeout(() => {
            warning.classList.add('fade-out');
            setTimeout(() => warning.remove(), 300);
        }, 3000);

        setTimeout(() => {
            document.addEventListener('click', function removeWarning() {
                warning.remove();
                document.removeEventListener('click', removeWarning);
            });
        }, 100);
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.wallet-notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `wallet-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

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

    getUserIdentifier() {
        if (!this.isConnected || !this.walletAddress) return null;

        return {
            address: this.walletAddress,
            shortAddress: `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`
        };
    }

    getWalletIcon(type) {
        const icons = {
            phantom: '<svg width="20" height="20" viewBox="0 0 128 128" fill="none"><path d="M96.262 41.186c-8.54-11.701-23.023-17.033-39.612-14.595-22.157 3.257-37.953 20.623-40.478 42.523-.73 6.329.365 12.168 3.114 17.19 5.84 10.676 17.566 16.118 32.138 14.924 10.165-.833 19.251-4.851 25.755-11.385 1.095-1.1 1.095-2.883 0-3.983a2.806 2.806 0 00-3.982 0c-5.475 5.502-13.205 8.906-21.914 9.644-12.533 1.062-22.375-3.257-27.117-11.847-2.189-3.967-3.065-8.666-2.481-13.903 2.19-19.617 16.471-34.919 36.576-37.808 14.938-2.147 27.471 2.456 34.795 12.754 2.92 4.116 4.745 9.06 5.329 14.595.146 1.556 1.46 2.737 3.065 2.737 1.606 0 2.92-1.181 3.066-2.737.73-6.182-1.241-12.561-5.254-18.109z" fill="white"/><circle cx="60" cy="62" r="4" fill="white"/><circle cx="82" cy="62" r="4" fill="white"/></svg>',
            solflare: '<svg width="20" height="20" viewBox="0 0 128 128" fill="none"><path d="M30.5 74.5L50.5 54.5C51.8807 53.1193 53.8431 52.5 55.8284 52.5H97.5C98.6046 52.5 99.5 53.3954 99.5 54.5C99.5 54.8978 99.3675 55.2794 99.1339 55.5858L79.1339 79.5858C77.7532 81.2765 75.7908 82 73.8056 82H32.5C31.3954 82 30.5 81.1046 30.5 80C30.5 79.6022 30.6325 79.2206 30.8661 78.9142L30.5 74.5Z" fill="#FC9965"/><path d="M30.5 53.5L50.5 73.5C51.8807 74.8807 53.8431 75.5 55.8284 75.5H97.5C98.6046 75.5 99.5 74.6046 99.5 73.5C99.5 73.1022 99.3675 72.7206 99.1339 72.4142L79.1339 48.4142C77.7532 46.7235 75.7908 46 73.8056 46H32.5C31.3954 46 30.5 46.8954 30.5 48C30.5 48.3978 30.6325 48.7794 30.8661 49.0858L30.5 53.5Z" fill="#FFC84B"/></svg>',
            backpack: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="8" width="14" height="12" rx="2" fill="#e33e3f"/><path d="M8 8V6a4 4 0 018 0v2" stroke="#e33e3f" stroke-width="2"/><circle cx="12" cy="14" r="2" fill="#fff"/></svg>',
            coinbase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#0052FF"/><circle cx="12" cy="12" r="6" fill="#fff"/><rect x="9" y="11" width="6" height="2" fill="#0052FF"/></svg>',
            trust: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#3375BB"/></svg>',
            glow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#F7931A"/><circle cx="12" cy="12" r="6" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#F7931A"/></svg>'
        };
        return icons[type] || icons.phantom;
    }

    updateUI() {
        const connectBtn = document.querySelector('.connect-wallet-btn');
        if (!connectBtn) return;

        connectBtn.classList.remove('connected', 'loading');

        if (this.isConnected) {
            connectBtn.classList.add('connected');

            const walletIcon = this.getWalletIcon(this.walletType);

            connectBtn.innerHTML = `
                <span class="wallet-icon">${walletIcon}</span>
                <span class="wallet-address">${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}</span>
            `;
            connectBtn.onclick = () => this.showWalletMenu();
        } else {
            connectBtn.className = 'connect-wallet-btn';
            connectBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="wallet-icon">
                    <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
                </svg>
                <span>Wallet</span>
            `;
            connectBtn.onclick = () => this.showWalletModal();
        }

        connectBtn.style.cssText = '';
    }

    showWalletMenu() {
        this.hideWalletMenu();

        const backdrop = document.createElement('div');
        backdrop.className = 'wallet-menu-backdrop';
        backdrop.onclick = () => this.hideWalletMenu();

        const walletNames = {
            phantom: 'Phantom',
            solflare: 'Solflare',
            backpack: 'Backpack',
            coinbase: 'Coinbase Wallet',
            trust: 'Trust Wallet',
            glow: 'Glow'
        };
        const walletName = walletNames[this.walletType] || 'Wallet';
        const walletIcon = this.getWalletIcon(this.walletType);

        const menu = document.createElement('div');
        menu.className = 'wallet-menu';
        menu.innerHTML = `
            <div class="wallet-menu-content">
                <button class="wallet-menu-close" onclick="window.walletManager.hideWalletMenu()">×</button>
                <div class="wallet-info">
                    <div class="wallet-info-header">
                        <span class="wallet-icon-display">${walletIcon}</span>
                        <h3>${walletName}</h3>
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

        requestAnimationFrame(() => {
            backdrop.classList.add('active');
            menu.classList.add('active');
        });
    }

    copyAddress() {
        navigator.clipboard.writeText(this.walletAddress).then(() => {
            this.showNotification('Address copied!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy address', 'error');
        });
    }

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
}

// Initialize wallet manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletManager = new WalletManager();
    });
} else {
    window.walletManager = new WalletManager();
}

// Inject premium wallet connection styles
const walletStyles = `
/* ==================== PREMIUM WALLET CONNECTION MODAL ==================== */
.wallet-connect-modal,
.wallet-install-modal {
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
    transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
}

.wallet-connect-modal.active,
.wallet-install-modal.active {
    opacity: 1;
    pointer-events: all;
}

.wallet-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    cursor: pointer;
}

.wallet-modal-content {
    position: relative;
    background: #0f0f0f;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    padding: 32px;
    max-width: 460px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow:
        0 24px 48px rgba(0, 0, 0, 0.8),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    transform: scale(0.95) translateY(20px);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.wallet-connect-modal.active .wallet-modal-content,
.wallet-install-modal.active .wallet-modal-content {
    transform: scale(1) translateY(0);
}

.wallet-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.04);
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1;
}

.wallet-modal-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
}

.wallet-modal-header {
    margin-bottom: 32px;
    text-align: center;
}

.wallet-modal-header h2 {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
}

.wallet-modal-header p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 15px;
    margin: 0;
    font-weight: 400;
}

.wallet-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
}

.wallet-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    background: rgba(255, 255, 255, 0.02);
    border: 1.5px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    text-align: left;
}

.wallet-option:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.wallet-option:active:not(.disabled) {
    transform: translateY(0);
}

.wallet-option.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.wallet-option.loading {
    opacity: 0.6;
    cursor: wait;
}

.wallet-option-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
}

.wallet-option-icon svg {
    width: 100%;
    height: 100%;
}

.wallet-option-info {
    flex: 1;
}

.wallet-option-name {
    color: #ffffff;
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 2px;
}

.wallet-option-status {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 500;
}

.wallet-option-arrow {
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;
}

.wallet-option:hover:not(.disabled) .wallet-option-arrow {
    color: rgba(255, 255, 255, 0.6);
    transform: translateX(4px);
}

.wallet-modal-footer {
    text-align: center;
}

.wallet-disclaimer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    margin: 0;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    line-height: 1.5;
}

.wallet-disclaimer svg {
    flex-shrink: 0;
    opacity: 0.6;
}

.get-wallet-btn {
    width: 100%;
    padding: 14px 24px;
    margin-top: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.get-wallet-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

/* Install Options */
.install-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
}

.install-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    background: rgba(255, 255, 255, 0.02);
    border: 1.5px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.install-option:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.install-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
}

.install-info {
    flex: 1;
}

.install-name {
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 2px;
}

.install-desc {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
}

.install-arrow {
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;
}

.install-option:hover .install-arrow {
    color: rgba(255, 255, 255, 0.6);
    transform: translateX(4px);
}

.refresh-note {
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
    text-align: center;
    margin: 0;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
}

/* ==================== CONNECT WALLET BUTTON ==================== */
.connect-wallet-btn {
    background: linear-gradient(135deg, #ff0844, #ff0000);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(255, 8, 68, 0.3);
}

.connect-wallet-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 8, 68, 0.4);
}

.connect-wallet-btn:active {
    transform: translateY(0);
}

.connect-wallet-btn.connected {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.connect-wallet-btn.connected:hover {
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

.connect-wallet-btn.pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(255, 8, 68, 0.3);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(255, 8, 68, 0.5);
    }
}

.wallet-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.wallet-address {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
}

/* ==================== WALLET MENU ==================== */
.wallet-menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
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
    transform: translate(-50%, -50%) scale(0.95);
    background: #0f0f0f;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    padding: 0;
    width: 90%;
    max-width: 420px;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.8);
}

.wallet-menu.active {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.wallet-menu-content {
    padding: 32px;
}

.wallet-menu-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.04);
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 24px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.wallet-menu-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
}

.wallet-info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.wallet-icon-display {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.wallet-icon-display svg {
    width: 36px;
    height: 36px;
}

.wallet-info h3 {
    margin: 0;
    color: white;
    font-size: 24px;
    font-weight: 700;
}

.wallet-address-full {
    margin-bottom: 20px;
}

.wallet-address-full label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.address-display {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.04);
    padding: 14px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.address-display span {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.copy-btn {
    background: rgba(255, 255, 255, 0.04);
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.copy-btn:hover {
    background: rgba(255, 255, 255, 0.08);
}

.wallet-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
}

.wallet-stats .stat {
    background: rgba(255, 255, 255, 0.04);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.wallet-stats .stat label {
    display: block;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.wallet-stats .stat span {
    display: block;
    color: white;
    font-size: 20px;
    font-weight: 700;
}

.status-connected {
    color: #10b981 !important;
}

.wallet-action-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.wallet-action-btn.disconnect {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1.5px solid rgba(239, 68, 68, 0.2);
}

.wallet-action-btn.disconnect:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    transform: translateY(-1px);
}

/* ==================== NOTIFICATIONS ==================== */
.wallet-notification {
    position: fixed;
    top: 24px;
    right: 24px;
    background: #0f0f0f;
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10001;
    max-width: 320px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
    font-weight: 500;
}

.wallet-notification.show {
    transform: translateX(0);
}

.wallet-notification.success {
    border-color: rgba(16, 185, 129, 0.3);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
}

.wallet-notification.error {
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
}

.wallet-notification.warning {
    border-color: rgba(245, 158, 11, 0.3);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
}

/* ==================== SUBTLE WARNING ==================== */
.wallet-warning-subtle {
    position: fixed;
    background: #0f0f0f;
    color: #fff;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
    z-index: 10000;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    max-width: 250px;
    font-size: 14px;
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
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #0f0f0f;
    border-right: 1px solid rgba(239, 68, 68, 0.3);
    border-bottom: 1px solid rgba(239, 68, 68, 0.3);
}

.warning-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.warning-icon {
    font-size: 18px;
}

.warning-text {
    font-weight: 500;
    line-height: 1.4;
}

/* Mobile Responsive */
@media (max-width: 480px) {
    .wallet-modal-content {
        padding: 24px;
        border-radius: 20px;
    }

    .wallet-modal-header h2 {
        font-size: 24px;
    }

    .wallet-option {
        padding: 16px;
    }

    .wallet-option-icon {
        width: 40px;
        height: 40px;
    }

    .wallet-notification {
        right: 16px;
        left: 16px;
        max-width: none;
    }

    .wallet-menu {
        max-width: 90%;
    }
}
`;

const styleElement = document.createElement('style');
styleElement.textContent = walletStyles;
document.head.appendChild(styleElement);
