// In-memory token blacklist for logout invalidation
const tokenBlacklist = new Set();

module.exports = {
  blacklistToken: (token) => {
    if (token) tokenBlacklist.add(token);
  },
  isTokenBlacklisted: (token) => {
    return tokenBlacklist.has(token);
  },
  clearBlacklist: () => {
    tokenBlacklist.clear();
  }
};
