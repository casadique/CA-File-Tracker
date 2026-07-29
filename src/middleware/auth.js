const { supabaseAdmin } = require("../config/supabase");
const { profileForAuthUser } = require("../services/userService");

async function requireAuth(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Login required." });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ error: "Invalid or expired login." });
      return;
    }

    const profile = await profileForAuthUser(data.user);
    if (!profile || profile.is_active === false) {
      res.status(403).json({ error: "User access is inactive." });
      return;
    }

    req.authToken = token;
    req.user = data.user;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.profile?.role)) {
      res.status(403).json({ error: "You do not have permission for this action." });
      return;
    }
    next();
  };
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

module.exports = { requireAuth, requireRole };
