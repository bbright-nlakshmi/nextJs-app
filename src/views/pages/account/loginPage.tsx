"use client";

import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { Col, Input, Label, Row } from "reactstrap";
import Breadcrumb from "../../Containers/Breadcrumb";
import { API } from "@/app/services/api.service";

const Login: NextPage = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const userName = "User";

  // create refs for each OTP input so we can focus next
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    try {
      await API.sendOtp(phoneNumber);
      toast.success("OTP sent successfully");
      setOtpArray(Array(6).fill(""));
      setOtpSent(true);
      // focus first box
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
    if (otp.length !== 6 || otpArray.some(d => d === "")) {
      toast.error("Please enter the complete 6‑digit OTP");
      return;
    }
    try {
      await API.verifyOtp(userName, phoneNumber, otp);
      localStorage.setItem("Login", phoneNumber);
      toast.success("Login successful");
      router.push("/pages/account/checkout");
    } catch {
      toast.error("OTP verification failed");
    }
  };

  // when a digit is entered, move focus
  const onOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const newArr = [...otpArray];
    newArr[idx] = val;
    setOtpArray(newArr);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  return (
    <>
      <Breadcrumb title="Login" parent="Home" />
      <section className="login-page section-big-py-space bg-light">
        <div className="custom-container">
          <Row>
            <Col xl="4" lg="6" md="8" className="offset-xl-4 offset-lg-3 offset-md-2">
              <div className="theme-card p-4 shadow-sm">
                <h3 className="text-center mb-3">Sign In with OTP</h3>

                <div className="form-group mb-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="form-control"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                {otpSent && (
                  <>
                    <Label className="form-label">Enter OTP</Label>
                    <div className="d-flex justify-content-center mb-3 otp-inputs">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Input
                          key={i}
                          innerRef={el => (otpRefs.current[i] = el)}
                          type="text"
                          maxLength={1}
                          value={otpArray[i]}
                          onChange={(e) => onOtpChange(e.target.value, i)}
                          className="otp-box text-center"
                        />
                      ))}
                    </div>

                    <div className="d-flex justify-content-between mt-3">
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="btn btn-primary w-50 me-2"
                        disabled={otpArray.some(d => d === "")}
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
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="btn btn-primary w-100 mt-3"
                    disabled={!/^\d{10}$/.test(phoneNumber)}
                  >
                    Send OTP
                  </button>
                )}
                
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Inline styles to make your 6 boxes appear evenly */}
      <style jsx>{`
        .otp-inputs {
          gap: 8px;
        }
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

export default Login;
