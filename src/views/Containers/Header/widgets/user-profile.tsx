"use client";

import { NextPage } from "next";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Form, FormGroup, Input, Label } from "reactstrap";
import { API } from "@/app/services/api.service";

interface MenuItem {
  title: string;
  type: "sub" | "link";
  path?: string;
  children?: MenuItem[];
}

const UserProfile: NextPage = () => {
  const [openAccount, setOpenAccount] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [user, setUser] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("Login") : null
  );
  const [userName, setUserName] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("UserName") : null
  );
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const router = useRouter();
  const otpRefs = useRef<HTMLInputElement[]>([]);

  const menuItems: MenuItem[] = [
    {
      title: "Account",
      type: "sub",
      children: [
        {
          path: "/pages/account/wishlist",
          title: "wishlist",
          type: "link"
        },
        {
          path: "/pages/account/cart",
          title: "cart",
          type: "link"
        },
        {
          path: "/pages/ContactUs",
          title: "contact",
          type: "link"
        },
        {
          path: "/pages/account/dashboard",
          title: "profile",
          type: "link"
        },
        {
          path: "/pages/account/checkout",
          title: "checkout",
          type: "link"
        }
      ]
    },
    {
      path: "/pages/order-history",
      title: "order history",
      type: "link"
    }
  ];

  useEffect(() => {
    // Load user data from localStorage when component mounts
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("Login");
      const storedUserName = localStorage.getItem("UserName");
      setUser(storedUser);
      setUserName(storedUserName);
    }
  }, []);

  const toggleAccount = () => setOpenAccount(!openAccount);

  const signout = () => {
    setUser(null);
    setUserName(null);
    localStorage.removeItem("Login");
    localStorage.removeItem("UserName");
    setExpandedMenu(null);
    toggleAccount();
    setTimeout(() => toast.success("Successfully Signed Out"), 200);
  };

  const handleSendOtp = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    
    try {
      const response = await API.sendOtp(phoneNumber);
      toast.success("OTP sent successfully");
      setOtpArray(Array(6).fill(""));
      setOtpSent(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await API.resendOtp(phoneNumber);
      toast.info("OTP resent successfully");
      setOtpArray(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpArray.join("");
    if (otp.length !== 6 || otpArray.some((d) => d === "")) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    
    try {
      const response = await API.verifyOtp("User", phoneNumber, otp);
      localStorage.setItem("Login", phoneNumber);
      localStorage.setItem("UserName", name);
      setUser(phoneNumber);
      setUserName(name);
      setOtpSent(false);
      setOtpArray(Array(6).fill(""));
      setName("");
      setPhoneNumber("");
      toggleAccount();
      toast.success("Login successful! Welcome " + name);
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
      // Clear OTP inputs on failure
      setOtpArray(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const onOtpChange = (val: string, idx: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    
    const newArr = [...otpArray];
    newArr[idx] = val;
    setOtpArray(newArr);
    
    // Auto focus to next input
    if (val && idx < 5) {
      setTimeout(() => otpRefs.current[idx + 1]?.focus(), 0);
    }
    
    // Auto focus to previous input on backspace
    if (!val && idx > 0) {
      setTimeout(() => otpRefs.current[idx - 1]?.focus(), 0);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otpArray[idx] && idx > 0) {
      setTimeout(() => otpRefs.current[idx - 1]?.focus(), 0);
    }
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.type === "sub") {
      setExpandedMenu(expandedMenu === item.title ? null : item.title);
    } else if (item.path) {
      router.push(item.path);
      setOpenAccount(false);
    }
  };

  const getProfileIcon = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.type === "sub") {
      return (
        <div key={index} className="user-profile-menu-item">
          <div 
            className="user-profile-menu-header d-flex justify-content-between align-items-center"
            onClick={() => handleMenuClick(item)}
          >
            <span className="text-capitalize">{item.title}</span>
            <i className={`fa ${expandedMenu === item.title ? 'fa-angle-up' : 'fa-angle-down'}`}></i>
          </div>
          {expandedMenu === item.title && item.children && (
            <div className="user-profile-submenu">
              {item.children.map((child, childIndex) => (
                <div 
                  key={childIndex}
                  className="user-profile-submenu-item"
                  onClick={() => handleMenuClick(child)}
                >
                  {child.title}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          key={index}
          className="user-profile-menu-item"
          onClick={() => handleMenuClick(item)}
        >
          {item.title}
        </div>
      );
    }
  };

  return (
    <>
      <li className="mobile-user onhover-dropdown" onClick={toggleAccount}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="icon-user"></i>
        </a>
      </li>

      <div id="myAccount" className={`add_to_cart right account-bar ${openAccount ? "open-side" : ""}`}>
        <a href="#" className="overlay" onClick={toggleAccount}></a>
        <div className="cart-inner">
          <div className="cart_top">
            <h3>
              {user && userName ? (
                <div className="d-flex flex-column align-items-center text-center">
                  <div className="user-profile-icon-large mb-2">
                    {getProfileIcon(userName)}
                  </div>
                  <div>
                    <div className="fw-bold">{userName}</div>
                    <small className="text-muted">{user}</small>
                  </div>
                </div>
              ) : (
                "my account"
              )}
            </h3>
            <div className="close-cart">
              <a href="#" onClick={toggleAccount}>
                <i className="fa fa-times" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          {user ? (
            <div className="user-profile-menu">
              <div className="user-profile-menu-section">
                {menuItems.map((item, index) => renderMenuItem(item, index))}
              </div>
              
              <Form className="userForm mt-4">
                <FormGroup>
                  <button type="button" className="btn btn-danger w-100" onClick={signout}>
                    <i className="fa fa-sign-out mr-2"></i>
                    Logout
                  </button>
                </FormGroup>
              </Form>
            </div>
          ) : (
            <Form className="userForm">
              <FormGroup>
                <Label htmlFor="name">Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control d-inherit"
                  placeholder="Enter your name"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-control d-inherit"
                  placeholder="Enter phone number"
                  required
                />
              </FormGroup>

              {otpSent && (
                <>
                  <Label className="form-label">Enter OTP</Label>
                    <div className="d-flex justify-content-center mb-3 user-profile-otp-inputs">
                      {otpArray.map((val, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            if (el) otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={val}
                          onChange={(e) => onOtpChange(e.target.value, i)}
                          onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          className="user-profile-otp-box text-center"
                          autoComplete="off"
                        />
                      ))}
                    </div>
                  <div className="d-flex justify-content-between mt-2">
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="btn user-profile-btn-primary w-50 me-2"
                      disabled={otpArray.some((d) => d === "")}
                    >
                      Verify OTP
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="btn user-profile-btn-outline-secondary w-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </>
              )}

              {!otpSent && (
                <FormGroup>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="btn user-profile-btn-primary w-100 mt-3"
                    disabled={!name.trim() || !/^[0-9]{10}$/.test(phoneNumber)}
                  >
                    Send OTP
                  </button>
                </FormGroup>
              )}
            </Form>
          )}
        </div>
      </div>
    </>
  );
};

export default UserProfile;