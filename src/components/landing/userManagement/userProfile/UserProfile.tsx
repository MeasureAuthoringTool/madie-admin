import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useUserServiceApi, adminUserStore } from "@madie/madie-util";
import "./UserProfile.scss";

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string };
  return e.name === "AbortError" || e.code === "ERR_CANCELED";
};

const UserProfile = () => {
  const { harpId } = useParams<{ harpId: string }>() as { harpId: string };
  const userServiceApi = useRef(useUserServiceApi()).current;

  useEffect(() => {
    const controller = new AbortController();
    userServiceApi
      .getUser(harpId, controller.signal)
      .then((user) => {
        adminUserStore.updateUser(user);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) {
          adminUserStore.updateUser(null);
        }
      });
    return () => {
      controller.abort();
    };
  }, [harpId, userServiceApi]);

  return (
    <div className="user-profile" data-testid="user-profile">
      <div className="user-profile-header"></div>
    </div>
  );
};

export default UserProfile;
