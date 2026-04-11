export const isAuthenticated = () => {
  const session = JSON.parse(localStorage.getItem("erpnext_session"));
  return session && session.sessionActive;
};
