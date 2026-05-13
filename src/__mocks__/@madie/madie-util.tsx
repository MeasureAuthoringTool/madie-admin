const useDocumentTitle = jest.fn();
const useUserRoles = jest
  .fn()
  .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true });
const useOktaTokens = jest.fn().mockReturnValue({
  getAccessToken: () => "test-token",
  getUserName: () => "testUser",
});
const wafIntercept = jest.fn((error) => {
  // Ensure we always reject with an Error object
  if (error instanceof Error) {
    return Promise.reject(error);
  }
  // If it's not an Error, wrap it in an Error for consistent behavior
  return Promise.reject(
    error && error.message ? new Error(error.message) : new Error(String(error))
  );
});
const useUserServiceApi = jest.fn().mockReturnValue({
  fetchUsers: jest.fn().mockResolvedValue([]),
});

module.exports = {
  useDocumentTitle,
  useUserRoles,
  useOktaTokens,
  wafIntercept,
  useUserServiceApi,
};
