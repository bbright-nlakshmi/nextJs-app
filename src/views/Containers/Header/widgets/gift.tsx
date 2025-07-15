import React, { useState } from "react";
import { NextPage } from "next";

import { CouponModel , API} from "@/app/globalProvider"; // ✅ Adjust if needed
import dayjs from "dayjs"; // For formatting expiry date

interface giftProps {
  coupon: CouponModel;
}

const GiftList: React.FC<giftProps> = ({ coupon }) => {
  const discountLabel = coupon.isCouponPercentage
    ? `${coupon.couponAmount}% off`
    : `$${coupon.couponAmount} off`;

  return (
    <div className="media border-bottom py-2 px-3">
      <div className="media-body">
        <h6 className="mt-0 mb-1">
          <strong>Code:</strong> {coupon.couponCode}
        </h6>
        <p className="mb-1">
          <strong>Offer:</strong> {discountLabel}{" "}
          {coupon.maxCouponAmount > 0 ? `(Max $${coupon.maxCouponAmount})` : ""}
        </p>
        <p className="mb-1">
          <strong>Min Cart Value:</strong> ${coupon.minimumCartValue}
        </p>
        <p className="mb-0">
          <strong>Expires:</strong>{" "}
          {dayjs(coupon.expireDate).format("DD MMM YYYY")}
        </p>
      </div>
    </div>
  );
};

const Gift: NextPage = () => {
  const [showState, setShowState] = useState(false);
  const [coupons, setCoupons] = useState<CouponModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const phoneNumber = "8185015406"; // TODO: Replace with real logged-in phone number

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const result = await API.getCoupons(phoneNumber);

      // Filter only active (non-expired) coupons
      const activeCoupons = result.filter((coupon: CouponModel) =>
        dayjs(coupon.expireDate).isAfter(dayjs())
      );

      setCoupons(activeCoupons);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = () => {
    const newState = !showState;
    setShowState(newState);
    if (newState && coupons.length === 0) {
      fetchCoupons();
    }
  };

  return (
    <div className={`d-lg-inline-block d-none btn-group ${showState ? "show" : ""}`}>
      <div className="gift-block" data-toggle="dropdown" onClick={toggleDropdown}>
        <div className="grif-icon">
          <i className="icon-gift"></i>
        </div>
        <div className="gift-offer">
          <p>Gift Box</p>
          <span className="d-xl-inline-block d-none">Festival Offer</span>
        </div>
      </div>
      <div className={`dropdown-menu gift-dropdown ${showState ? "show" : ""}`}>
        {isLoading ? (
          <div className="p-3">Loading coupons...</div>
        ) : coupons.length > 0 ? (
          coupons.map((coupon, i) => <GiftList coupon={coupon} key={i} />)
        ) : (
          <div className="p-3">No coupons available.</div>
        )}
      </div>
    </div>
  );
};

export default Gift;
