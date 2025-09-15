"use client";
import React from "react";
import { Card, CardBody } from "reactstrap";
import ProfileAvatar from "./ProfileAvatar";

interface SidebarProps {
  userName: string;
  userEmail: string;
  activeTab: "dashboard" | "orders" | "wishlist" | "account";
  setActiveTab: (tab: "dashboard" | "orders" | "wishlist" | "account") => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userName,
  userEmail,
  activeTab,
  setActiveTab,
}) => {
  return (
    <Card className="dashboard-sidebar dashboard-shadow-sm dashboard-h-100">
      <CardBody>
        <div className="dashboard-user-profile-info dashboard-text-center dashboard-mb-4">
          <div className="dashboard-user-avatar dashboard-mb-3 dashboard-flex dashboard-justify-content-center">
            <ProfileAvatar name={userName || "User"} size={80} />
          </div>
          <h5 className="dashboard-mb-1 dashboard-fw-bold">
            {userName || "User"}
          </h5>
          <p className="dashboard-text-muted dashboard-small dashboard-mb-0">
            {userEmail || "No email provided"}
          </p>
        </div>

        <div className="dashboard-menu">
          {[
            { key: "dashboard", icon: "fa-tachometer", label: "Dashboard" },
            { key: "orders", icon: "fa-shopping-bag", label: "My Orders" },
            { key: "wishlist", icon: "fa-heart", label: "My Wishlist" },
            { key: "account", icon: "fa-user", label: "Account Info" },
          ].map((item) => (
            <div
              key={item.key}
              className={`dashboard-menu-item ${
                activeTab === item.key ? "dashboard-active" : ""
              }`}
              onClick={() => setActiveTab(item.key as any)}
            >
              <i className={`fa ${item.icon} dashboard-me-2`} />
              {item.label}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default Sidebar;