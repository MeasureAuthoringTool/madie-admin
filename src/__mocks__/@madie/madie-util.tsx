const useDocumentTitle = jest.fn();
const useUserRoles = jest
  .fn()
  .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true });

module.exports = { useDocumentTitle, useUserRoles };
