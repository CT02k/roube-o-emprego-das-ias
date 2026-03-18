export const ADMIN_TOKEN_STORAGE_KEY = "human-chat-admin-token";

export const isAdminShortcut = (event: KeyboardEvent) => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return false;
  }

  return (
    event.code === "Quote" ||
    event.code === "BracketLeft" ||
    event.code === "IntlRo" ||
    event.key === "'" ||
    event.key === '"' ||
    event.key === "Dead" ||
    event.key === "´" ||
    event.key === "`"
  );
};
