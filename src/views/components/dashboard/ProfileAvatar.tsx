"use client";
import React from "react";

interface ProfileAvatarProps {
  name: string;
  size?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ name, size = 80 }) => {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="dashboard-profile-avatar dashboard-flex-center"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
};

export default ProfileAvatar;
