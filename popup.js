// Global variables to store the current adBlockEnabled state, premium status, whitelist, blocklist, stats, and dark mode
let adBlockEnabled = true;
let premiumUser = false;  // Premium status
let whitelist = [];
let blocklist = [];
let adsBlockedToday = 0;
let totalAdsBlocked = 0;
let darkModeEnabled = false;  // Dark mode state
let privacyProtectionEnabled = true;  // Privacy protection state
let malwareProtectionEnabled = true;  // Malware protection state

// Load initial state from chrome.storage when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    checkForRuleUpdates();  // Auto-update rules
});

// Function to load settings from chrome.storage and update UI
function loadSettings() {
    chrome.storage.sync.get([
        'adBlockEnabled',
        'premiumUser',
        'whitelist',
        'blocklist',
        'adsBlockedToday',
        'totalAdsBlocked',
        'darkModeEnabled',
        'privacyProtectionEnabled',
        'malwareProtectionEnabled'
    ], (data) => {
        adBlockEnabled = data.adBlockEnabled !== undefined ? data.adBlockEnabled : true;
        premiumUser = data.premiumUser || false;
        whitelist = data.whitelist || [];
        blocklist = data.blocklist || [];
        adsBlockedToday = data.adsBlockedToday || 0;
        totalAdsBlocked = data.totalAdsBlocked || 0;
        darkModeEnabled = data.darkModeEnabled !== undefined ? data.darkModeEnabled : false;
        privacyProtectionEnabled = data.privacyProtectionEnabled !== undefined ? data.privacyProtectionEnabled : true;
        malwareProtectionEnabled = data.malwareProtectionEnabled !== undefined ? data.malwareProtectionEnabled : true;

        updateUI(adBlockEnabled);
        updateAdBlockStats();
        applyDarkMode(darkModeEnabled);  // Apply dark mode on load
        applyPrivacyProtection(privacyProtectionEnabled);  // Apply privacy protection on load
        applyMalwareProtection(malwareProtectionEnabled);  // Apply malware protection on load
        checkPremiumFeatures(premiumUser);  // Check if premium features should be enabled
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
            const currentUrl = new URL(tabs[0].url).hostname;
            updateWhitelistUI(currentUrl);
            updateBlocklistUI(currentUrl);
        }
    });
}

// Function to set up event listeners for UI interactions
function setupEventListeners() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const whitelistButton = document.getElementById('whitelistButton');
    const blocklistButton = document.getElementById('blocklistButton');
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    const privacyProtectionSwitch = document.getElementById('privacyProtectionSwitch');
    const malwareProtectionSwitch = document.getElementById('malwareProtectionSwitch');
    const stripePaymentButton = document.getElementById('stripePaymentButton');

    // Ensure elements exist before adding event listeners
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', (event) => {
            adBlockEnabled = event.target.checked;
            chrome.storage.sync.set({ adBlockEnabled }, () => {
                updateUI(adBlockEnabled);
                updateBlockingRules(adBlockEnabled);
            });
            alert(adBlockEnabled ? "Ads just got blocked, Dawg! Ain’t no ads messin' with this Blocka." : "Alright, Playa. Ads can roll through for now.");
            playSound('achievement');  // Play achievement.wav sound on toggle
        });
    }

    if (whitelistButton) {
        whitelistButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs[0]) {
                    const currentUrl = new URL(tabs[0].url).hostname;
                    if (!whitelist.includes(currentUrl)) {
                        whitelist.push(currentUrl);  // Add to whitelist
                        chrome.storage.sync.set({ whitelist }, () => {
                            alert(`Aight, ${currentUrl} cool now, Playa.`);
                            updateWhitelistUI(currentUrl);
                            updateWhitelistRules(whitelist);
                        });
                    } else {
                        whitelist = whitelist.filter((site) => site !== currentUrl);
                        chrome.storage.sync.set({ whitelist }, () => {
                            alert(`${currentUrl} says no ads allowed, Dawg!`);
                            updateWhitelistUI(currentUrl);
                            updateWhitelistRules(whitelist);
                        });
                    }
                }
            });
        });
    }

    if (blocklistButton) {
        blocklistButton.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs[0]) {
                    const currentUrl = new URL(tabs[0].url).hostname;
                    if (!blocklist.includes(currentUrl)) {
                        blocklist.push(currentUrl);  // Add to blocklist
                        chrome.storage.sync.set({ blocklist }, () => {
                            alert(`No more disrespect, Playa. ${currentUrl} is now blocked!`);
                            updateBlocklistUI(currentUrl);
                            updateBlocklistRules(blocklist);
                        });
                    } else {
                        blocklist = blocklist.filter((site) => site !== currentUrl);
                        chrome.storage.sync.set({ blocklist }, () => {
                            alert(`${currentUrl} says keep an eye on 'em, Dawg.`);
                            updateBlocklistUI(currentUrl);
                            updateBlocklistRules(blocklist);
                        });
                    }
                }
            });
        });
    }

    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('change', (event) => {
            darkModeEnabled = event.target.checked;
            chrome.storage.sync.set({ darkModeEnabled }, () => {
                applyDarkMode(darkModeEnabled);  // Apply dark mode dynamically when toggled
                alert(darkModeEnabled ? "Dark mode on, Dawg! Smooth vibes only." : "Light mode back, Playa. Shine on!");
            });
        });
    }

    if (privacyProtectionSwitch) {
        privacyProtectionSwitch.addEventListener('change', (event) => {
            privacyProtectionEnabled = event.target.checked;
            chrome.storage.sync.set({ privacyProtectionEnabled }, () => {
                applyPrivacyProtection(privacyProtectionEnabled);  // Apply privacy protection dynamically
                alert(privacyProtectionEnabled ? "Ain’t no trackers stalkin’ you here, Playa!" : "Watch out, Dawg. Trackers are sneakin’ through!");
                playSound('privavy_enabled');  // Play privavy_enabled.wav sound on toggle
            });
        });
    }

    if (malwareProtectionSwitch) {
        malwareProtectionSwitch.addEventListener('change', (event) => {
            malwareProtectionEnabled = event.target.checked;
            chrome.storage.sync.set({ malwareProtectionEnabled }, () => {
                applyMalwareProtection(malwareProtectionEnabled);  // Apply malware protection dynamically
                alert(malwareProtectionEnabled ? "No scams here, Playa! MC Blocka's got your back." : "Stay sharp, Dawg! You’re on your own now.");
                playSound('malware_blocked');  // Play malware_blocked.wav sound on toggle
            });
        });
    }

    if (stripePaymentButton) {
        stripePaymentButton.addEventListener('click', () => {
            window.open('https://buy.stripe.com/28o8zAabR6J9cBG004', '_blank');  // Replace with your actual Stripe link
            alert("Thanks for the love, my Dawg");

            // Simulate unlocking premium (for testing purposes)
            chrome.storage.sync.set({ premiumUser: true }, () => {
                checkPremiumFeatures(true);  // Unlock badges after donation
            });
        });
    }
}

// Play sound function to handle sound effects
function playSound(fileName) {
    const audio = new Audio(chrome.runtime.getURL(`audio/${fileName}.wav`));  // Fetch WAV file from the audio folder
    audio.play().catch((error) => console.error('Error playing sound:', error));
}

// Function to update ad-blocking rules dynamically (communicate with background.js)
function updateBlockingRules(isEnabled) {
    chrome.runtime.sendMessage({ action: 'updateBlockingRules', adBlockEnabled: isEnabled }, (response) => {
        if (response && response.status) {
            console.log(response.status);
        } else {
            console.error('No valid response received from background script.');
        }
    });
}

// Function to update the whitelist rules dynamically (communicate with background.js)
function updateWhitelistRules(whitelist) {
    chrome.runtime.sendMessage({ action: 'updateWhitelist', whitelist: whitelist }, (response) => {
        if (response && response.status) {
            console.log('Whitelist updated:', response.status);
        } else {
            console.error('No valid response received from background script.');
        }
    });
}

// Function to update the blocklist rules dynamically (communicate with background.js)
function updateBlocklistRules(blocklist) {
    chrome.runtime.sendMessage({ action: 'updateBlocklist', blocklist: blocklist }, (response) => {
        if (response && response.status) {
            console.log(response.status);
        } else {
            console.error('No valid response received from background script.');
        }
    });
}

// Function to apply or remove dark mode styling
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        document.querySelector('.popup-container').classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.querySelector('.popup-container').classList.remove('dark-mode');
    }
}

// Function to apply or remove privacy protection logic
function applyPrivacyProtection(enabled) {
    if (enabled) {
        console.log('Privacy protection is ON');
    } else {
        console.log('Privacy protection is OFF');
    }
}

// Function to apply or remove malware protection logic
function applyMalwareProtection(enabled) {
    if (enabled) {
        console.log('Malware protection is ON');
    } else {
        console.log('Malware protection is OFF');
    }
}

// Function to update the Ad Block statistics and show fun messages
function updateAdBlockStats() {
    const statsText = document.getElementById('adBlockStats');
    if (statsText) {
        statsText.textContent = `MC Blocka saved you from ${adsBlockedToday} ads today! You've blocked ${totalAdsBlocked} ads total.`;

        // Fun messages based on the number of blocked ads
        if (totalAdsBlocked >= 100) {
            alert("You’re the King of the Block, Dawg! 100 ads blocked!");
        }
    }
}

// Function to check and enable premium features for users
function checkPremiumFeatures(isPremium) {
    const badgesPreview = document.querySelectorAll('.badges-preview .badge');
    const premiumBadgesSection = document.querySelector('.premium-badges-section');

    if (badgesPreview && premiumBadgesSection) {
        if (isPremium) {
            // Unlock badges
            badgesPreview.forEach(badge => {
                badge.classList.remove('locked');
            });

            // Show activated badges section
            premiumBadgesSection.style.display = 'block';
        } else {
            // Keep badges locked if not premium
            badgesPreview.forEach(badge => {
                badge.classList.add('locked');
            });

            // Hide activated badges section
            premiumBadgesSection.style.display = 'none';
        }
    }
}

// Function to update the UI based on the adBlockEnabled state
function updateUI(isEnabled) {
    const statusText = document.getElementById('status');
    const toggleSwitch = document.getElementById('toggleSwitch');

    if (statusText && toggleSwitch) {
        if (isEnabled) {
            statusText.textContent = 'Ad Blocker is ON';
            toggleSwitch.checked = true;
        } else {
            statusText.textContent = 'Ad Blocker is OFF';
            toggleSwitch.checked = false;
        }
    }
}

// Function to update the whitelist UI based on the current site
function updateWhitelistUI(currentUrl) {
    const whitelistText = document.getElementById('whitelistText');
    const whitelistButton = document.getElementById('whitelistButton');

    if (whitelistText && whitelistButton) {
        if (isInternalPage(currentUrl)) {
            whitelistText.textContent = 'Ads cannot be blocked on internal Chrome pages.';
            whitelistButton.disabled = true;
            whitelistButton.textContent = 'Whitelist not available';
        } else if (whitelist.includes(currentUrl)) {
            whitelistText.textContent = `Ads are allowed on ${currentUrl}`;
            whitelistButton.textContent = 'Remove from Whitelist';
            whitelistButton.disabled = false;
        } else {
            whitelistText.textContent = `Blocking ads on ${currentUrl}`;
            whitelistButton.textContent = 'Whitelist this site';
            whitelistButton.disabled = false;
        }
    }
}

// Function to update the blocklist UI based on the current site
function updateBlocklistUI(currentUrl) {
    const blocklistText = document.getElementById('blocklistText');
    const blocklistButton = document.getElementById('blocklistButton');

    if (blocklistText && blocklistButton) {
        if (blocklist.includes(currentUrl)) {
            blocklistText.textContent = `${currentUrl} is disrespected and blocked.`;
            blocklistButton.textContent = 'Unblock this site';
        } else {
            blocklistText.textContent = `Blocking ads on ${currentUrl}`;
            blocklistButton.textContent = 'Block this site';
        }
    }
}

// Define isInternalPage to check if a URL is a Chrome internal page
function isInternalPage(url) {
    return url.startsWith('chrome://') || url.startsWith('about:');
}

// Function to simulate checking for rule updates (Auto-updating Rules)
function checkForRuleUpdates() {
    console.log('Checking for rule updates...');
    // Simulate auto-updating ad block rules (This could call an external source or background script)
}

