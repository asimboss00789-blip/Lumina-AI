// middleware.js

// Assigns a unique anonymous ID to users who don't have one
function assignAnonymousID(req, res, next) {
    if (!req.cookies) {
        req.cookies = {}; // initialize cookies object if not present
    }
    if (!req.cookies.userID) {
        req.cookies.userID = 'anon-' + Date.now(); // generate unique anonymous ID
    }
    next();
}

module.exports = { assignAnonymousID };
