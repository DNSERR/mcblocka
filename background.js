// Rule IDs for managing dynamic rules
const adBlockRules = [1, 2, 3];  // Default IDs for ad-blocking rules
let blocklistRules = [];  // Dynamic rule IDs for custom blocklist
let whitelistRules = [];  // Rule IDs for sites on the whitelist
let privacyProtectionEnabled = true;
let malwareProtectionEnabled = true;
let customBlocklistEnabled = false;
let adBlockStatisticsEnabled = false;

// Listener for messages from popup.js or options.html
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case 'updateBlockingRules':
                updateBlockingRules(message.adBlockEnabled);
                sendResponse({ status: message.adBlockEnabled ? 'Ad blocker enabled' : 'Ad blocker disabled' });
                break;
            case 'updateBlocklist':
                updateBlocklistRules(message.blocklist);
                sendResponse({ status: 'Blocklist updated' });
                break;
            case 'updatePrivacyProtection':
                privacyProtectionEnabled = message.privacyProtectionEnabled;
                updatePrivacyProtection();
                sendResponse({ status: privacyProtectionEnabled ? 'Privacy protection enabled' : 'Privacy protection disabled' });
                break;
            case 'updateMalwareProtection':
                malwareProtectionEnabled = message.malwareProtectionEnabled;
                updateMalwareProtection();
                sendResponse({ status: malwareProtectionEnabled ? 'Malware protection enabled' : 'Malware protection disabled' });
                break;
            case 'updatePremiumFeatures':
                customBlocklistEnabled = message.customBlocklistEnabled;
                adBlockStatisticsEnabled = message.adBlockStatisticsEnabled;
                handlePremiumFeatures();
                sendResponse({ status: 'Premium features updated' });
                break;
            case 'updateWhitelist':
                updateWhitelistRules(message.whitelist);
                sendResponse({ status: 'Whitelist updated' });
                break;
            default:
                console.warn(`Unrecognized action: ${message.action}`);
                sendResponse({ status: 'Unrecognized action' });
                break;
        }
    } catch (error) {
        console.error('Error handling message in background.js:', error);
        sendResponse({ status: 'Error occurred' });
    }

    if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError.message);
    }

    return true;
});

// Function to update ad-blocking rules based on adBlockEnabled state
function updateBlockingRules(adBlockEnabled) {
    try {
        const rules = adBlockEnabled ? adBlockRules.map((id, index) => ({
            id,
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: ['*://*.doubleclick.net/*', '*://*.googlesyndication.com/*', '*://*.trackerserver.com/*'][index],
                resourceTypes: ['script', 'image', 'sub_frame']
            }
        })) : [];

        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: adBlockRules,
            addRules: rules
        }).catch(error => console.error('Error updating blocking rules:', error));
    } catch (error) {
        console.error('Error in updateBlockingRules:', error);
    }
}

// Function to update blocklist rules dynamically
function updateBlocklistRules(blocklist) {
    try {
        if (blocklistRules.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: blocklistRules
            }).catch(error => console.error('Error removing blocklist rules:', error));
        }

        blocklistRules = blocklist.map((site, index) => index + 10);
        const uniqueBlocklistRules = blocklist.map((site, index) => ({
            id: index + 10,
            priority: 1,
            action: { type: 'block' },
            condition: { domains: [site] }
        }));

        if (uniqueBlocklistRules.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: uniqueBlocklistRules
            }).catch(error => console.error('Error adding blocklist rules:', error));
        }
    } catch (error) {
        console.error('Error in updateBlocklistRules:', error);
    }
}

// Function to update whitelist rules dynamically
function updateWhitelistRules(whitelist) {
    try {
        if (whitelistRules.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: whitelistRules
            }).catch(error => console.error('Error removing whitelist rules:', error));
        }

        whitelistRules = whitelist.map((site, index) => index + 100);
        const uniqueWhitelistRules = whitelist.map((site, index) => ({
            id: index + 100,
            priority: 1,
            action: { type: 'allow' },
            condition: { domains: [site] }
        }));

        if (uniqueWhitelistRules.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
                addRules: uniqueWhitelistRules
            }).catch(error => console.error('Error adding whitelist rules:', error));
        }
    } catch (error) {
        console.error('Error in updateWhitelistRules:', error);
    }
}

// Function to handle privacy protection logic
function updatePrivacyProtection() {
    try {
        console.log(`Privacy protection is ${privacyProtectionEnabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
        console.error('Error in updatePrivacyProtection:', error);
    }
}

// Function to handle malware and phishing protection logic
function updateMalwareProtection() {
    try {
        console.log(`Malware and phishing protection is ${malwareProtectionEnabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
        console.error('Error in updateMalwareProtection:', error);
    }
}

// Function to handle premium features
function handlePremiumFeatures() {
    try {
        if (customBlocklistEnabled) console.log('Custom blocklist is enabled for premium users.');
        if (adBlockStatisticsEnabled) trackAdBlockStats();
    } catch (error) {
        console.error('Error in handlePremiumFeatures:', error);
    }
}

// Function to track ad block statistics (Premium feature)
function trackAdBlockStats() {
    chrome.storage.sync.get(['adsBlockedToday', 'totalAdsBlocked'], (data) => {
        const blockedAdsToday = (data.adsBlockedToday || 0) + 1;
        const totalBlockedAds = (data.totalAdsBlocked || 0) + 1;

        chrome.storage.sync.set({
            adsBlockedToday: blockedAdsToday,
            totalAdsBlocked: totalBlockedAds
        }, () => {
            console.log(`Blocked ${blockedAdsToday} ads today. Total blocked: ${totalBlockedAds}`);
        });
    });
}

// Initialize protections and premium features on start
updatePrivacyProtection();
updateMalwareProtection();
handlePremiumFeatures();
