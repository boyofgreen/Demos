// TODO: change the name of this function to signInAndRegister
function signInWithPassword() {
    // If Windows Hello is supported and there is no existing credential, offer to register Windows Hello
    if (window.webauthn && !(window.sessionStorage && window.sessionStorage.getItem('credentialID'))) {
        window.location = 'fidoregister.html';
    }
    // Otherwise, go to the inbox
    else {
        window.location = 'inbox.html';
    }
}

function sendToServer(msg) {
    // This is where you would send data to the server   
}

function log(message) {
    console.log(message);
}

// Register user with FIDO 2.0
function makeCredential() {
    try {
        // This information would normally come from the server
        var accountInfo = {
            rpDisplayName: 'Contoso', // Name of relying party
            displayName: 'John Doe', // Name of user account in relying partying
            name: 'johndoe@contoso.com', // Detailed name of account
            id: 'joed' // Account identifier
        };

        var cryptoParameters = [{
            type: 'FIDO',
            algorithm: 'RSASSA-PKCS1-v1_5'
        }];

        // We won't use this optional parameters
        var timeout = {};
        var denyList = {};
        var ext = {};

        // The challenge is typically a random quantity generated by the server
        // This ensures that any assertions are freshly generated and not replays
        var attestationChallenge = 'Four score and seven years ago';

        log("Before make credential takes place");

        window.webauthn.makeCredential(accountInfo, cryptoParameters, attestationChallenge, timeout, denyList, ext)
            .then(function(creds) {
                // If promise returns successfully, store credID locally
                if (window.sessionStorage) {

                    log("start to store credID locally");
                    window.sessionStorage.setItem('credentialID', creds.credential.id);
                    window.sessionStorage.setItem('algorithm', creds.algorithm);
                    window.sessionStorage.setItem('publicKey', creds.publicKey.n);

                }

                // Share credential information with server
                sendToServer(creds);

                // Go to Inbox
                window.location = 'inbox.html';
            })
            // TODO: Why do we need two catch cases if they both are about to set up Windows Hello?
            .catch(function(reason) {
                // Windows Hello isn't setup, show dialog explaining how to set it up
                if (reason.message === 'NotSupportedError') {
                    showSetupWindowsHelloDialog(true);
                }
                log('Windows Hello failed (' + reason.message + ').');
            });
    } catch (ex) {
        // Windows Hello isn't setup, show dialog explaining how to set it up
        if (reason.message === 'NotSupportedError') {
            showSetupWindowsHelloDialog(true);
        }
        log('makeCredential() failed: ' + ex);
    }
}

// Authenticate the user
function getAssertion() {
    try {
        // The challenge is typically a random quantity generated by the server 
        // This ensures that any assertions are freshly generated and not replays
        var challenge = 'Our fathers brought forth on this continent, a new nation';
        var allowList = [{
            type: 'FIDO',
            id: window.sessionStorage.getItem('credentialID')
        }];

        var timeout = {};
        var ext = {};

        window.webauthn.getAssertion(challenge, timeout, allowList, ext)
            .then(function(sig) {
                // Assertion calls succeeds
                // Send assertion to the server
                sendToServer(sig);

                // Assuming confirmation, sign in to inbox
                window.location = 'inbox.html';
            })
            .catch(function(reason) {
                // No credential in the store. Fallback to password
                // Show dialog with failed authentication. Fallback to password. 
                log('getAssertion() failed: ' + reason);
            });
    } catch (ex) {
        log('getAssertion() failed: ' + ex);
    }
}