const useDocumentTitle = jest.fn();
const useUserRoles = jest
  .fn()
  .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true });
const useOktaTokens = jest.fn().mockReturnValue({
  getAccessToken: () => "test-token",
  getUserName: () => "testUser",
});
const wafIntercept = jest.fn((error) => Promise.reject(error));
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
