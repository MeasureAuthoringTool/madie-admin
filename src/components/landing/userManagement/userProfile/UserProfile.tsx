import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserServiceApi, adminUserStore } from "@madie/madie-util";
import "./UserProfile.scss";

const UserProfile = () => {
  const [searchParams] = useSearchParams();
  const harpId = searchParams.get("harpId");
  const userServiceApi = useRef(useUserServiceApi()).current;

  useEffect(() => {
    if (!harpId) {
      adminUserStore.updateUser(null);
      return;
    }
    const controller = new AbortController();
    userServiceApi
      .getUser(harpId, controller.signal)
      .then((user) => adminUserStore.updateUser(user))
      .catch((err) => {
        if (err?.name !== "AbortError" && err?.code !== "ERR_CANCELED") {
          adminUserStore.updateUser(null);
        }
      });
    return () => controller.abort();
  }, [harpId, userServiceApi]);

  return (
    <div className="user-profile" data-testid="user-profile">
      <div className="user-profile-header"></div>
    </div>
  );
};

export default UserProfile;
