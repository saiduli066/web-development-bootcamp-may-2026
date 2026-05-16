const normalizeUsername = (value) => {
  if (!value) return "";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

const sanitizeUsernameBase = (value) => {
  if (!value) return "";

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";

  return trimmed
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
};

const usernameFromEmail = (email) => {
  const localPart = email?.split("@")[0] || "";
  const base = sanitizeUsernameBase(localPart);
  return base ? `@${base}` : "";
};

export { normalizeUsername, sanitizeUsernameBase, usernameFromEmail };
