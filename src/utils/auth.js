const USERS_KEY = "csp_users";
const AUTH_KEY = "csp_auth";

const encodePassword = (password) => {
  const text = String(password || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const defaultUsers = [
  {
    id: "USR-ADMIN",
    username: "admin",
    passwordHash: encodePassword("1234"),
    name: "ผู้ดูแลระบบ",
    role: "APPROVER",
    roleLabel: "Admin",
    active: true,
  },
];

export const getUsers = () => {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(users) && users.length) return users;
  } catch {
    // Use the initial administrator account when stored data is invalid.
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const saveUsers = (users) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

export const authenticate = (username, password) =>
  getUsers().find(
    (user) =>
      user.active !== false &&
      user.username.toLowerCase() === String(username).trim().toLowerCase() &&
      user.passwordHash === encodePassword(password),
  );

export const createPasswordHash = encodePassword;

export const getAuthSession = () => {
  try {
    const session = JSON.parse(
      localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY),
    );
    if (!session) return null;
    if (session.userId && session.name && session.role) return session;
    const legacyUsername = session.username || session.user;
    const user = getUsers().find((item) => item.username === legacyUsername);
    if (!user) return null;
    const migrated = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      roleLabel: user.roleLabel,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return null;
  }
};

export const setAuthSession = (user, remember) => {
  const session = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    roleLabel: user.roleLabel,
  };
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  (remember ? localStorage : sessionStorage).setItem(
    AUTH_KEY,
    JSON.stringify(session),
  );
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};
