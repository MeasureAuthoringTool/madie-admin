import React from "react";

const UserTable = () => {
  return (
    <table
      data-testid="user-management-table"
      className="user-management-table"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Harp ID</th>
          <th>Email Address</th>
          <th>Status</th>
          <th>Last Login</th>
        </tr>
      </thead>
      <tbody>{/* Intentionally empty for now */}</tbody>
    </table>
  );
};

export default UserTable;
