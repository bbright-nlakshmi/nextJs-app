"use client";

import { NextPage } from "next";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Form, FormGroup, Input, Label } from "reactstrap";
import { API } from "@/app/services/api.service";

const UserProfile: NextPage = () => {
  const [openAccount, setOpenAccount] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [user, setUser] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("Login") : null
  );

  const router = useRouter();
  const otpRefs = useRef<HTMLInputElement[]>([]);

  const toggleAccount = () => setOpenAccount(!openAccount);

  const signout = () => {
    setUser(null);
    localStorage.removeItem("Login");
    toggleAccount();
    setTimeout(() => toast.success("Successfully Signed Out"), 200);
  };

  const handleSendOtp = async () => {
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    try {
      await API.sendOtp(phoneNumber);
      toast.success("OTP sent successfully");
      setOtpArray(Array(6).fill(""));
      setOtpSent(true);
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const handleResendOtp = async () => {
    try {
      await API.resendOtp(phoneNumber);
      toast.info("OTP resent successfully");
      setOtpArray(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpArray.join("");
    if (otp.length !== 6 || otpArray.some((d) => d === "")) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    try {
      await API.verifyOtp("User", phoneNumber, otp);
      localStorage.setItem("Login", phoneNumber);
      setUser(phoneNumber);
      toggleAccount();
      toast.success("Login successful");
    } catch {
      toast.error("OTP verification failed");
    }
  };

  const onOtpChange = (val: string, idx: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newArr = [...otpArray];
    newArr[idx] = val;
    setOtpArray(newArr);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  return (
    <>
      <li className="mobile-user onhover-dropdown" onClick={toggleAccount}>
        <a href="#">
          <i className="icon-user"></i>
        </a>
      </li>

      <div id="myAccount" className={`add_to_cart right account-bar ${openAccount ? "open-side" : ""}`}>
        <a href="#" className="overlay" onClick={toggleAccount}></a>
        <div className="cart-inner">
          <div className="cart_top">
            <h3>my account</h3>
            <div className="close-cart">
              <a href="#" onClick={toggleAccount}>
                <i className="fa fa-times" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <Form className="userForm">
            {!user && (
              <>
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
                    <div className="d-flex justify-content-center mb-3 otp-inputs" style={{ gap: "8px" }}>
                      {otpArray.map((val, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            if (el) otpRefs.current[i] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => onOtpChange(e.target.value, i)}
                          className="otp-box text-center"
                        />
                      ))}
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="btn btn-primary w-50 me-2"
                        disabled={otpArray.some((d) => d === "")}
                      >
                        Verify OTP
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="btn btn-outline-secondary w-50"
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
                      className="btn btn-primary w-100 mt-3"
                      disabled={!/^[0-9]{10}$/.test(phoneNumber)}
                    >
                      Send OTP
                    </button>
                  </FormGroup>
                )}
              </>
            )}

            {user && (
              <FormGroup>
                <button type="button" className="btn btn-danger w-100 mt-3" onClick={signout}>
                  Logout
                </button>
              </FormGroup>
            )}

            {!user && (
              <FormGroup>
                <h6 className="forget-class">
                  <a
                    href="#"
                    className="d-block"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/pages/account/register");
                      setOpenAccount(false);
                    }}
                  >
                    
                  </a>
                </h6>
              </FormGroup>
            )}
          </Form>
        </div>
      </div>

      <style jsx>{`
        .otp-box {
          width: 45px;
          height: 50px;
          font-size: 20px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }
      `}</style>
    </>
  );
};

export default UserProfile;