"use client";
import React from "react";
import { toast } from "react-toastify";
import { API } from "@/app/services/api.service";
import { RazorpayModel } from "@/app/globalProvider";

interface RazorpayButtonProps {
  orderData: any;         
  orderModel: any;        
  deliveryAddress: any;   
  finalTotal: number;     
  onSuccess: () => void;  
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  orderData,
  orderModel,
  deliveryAddress,
  finalTotal,
  onSuccess,
}) => {
  // Loads Razorpay SDK dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch Razorpay details using your service method, then return the key.
  const fetchRazorpayKey = async (): Promise<string | null> => {
    try {
      // getRazorPayDetails returns an array.
      const details: RazorpayModel[] = await API.getRazorPayDetails();
      if (details.length > 0 && details[0].keyId) {
        return details[0].keyId;
      } else {
        toast.error("No Razorpay key details found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching Razorpay key:", error);
      toast.error("Unable to load payment gateway");
      return null;
    }
  };

  // Main function to trigger the Razorpay payment process
  const triggerPayment = async () => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Razorpay SDK failed to load");
      return;
    }

    const key = await fetchRazorpayKey();
    if (!key) return;

    const options = {
      key: key,
      amount: ((finalTotal * 100).toFixed(2)), // Razorpay accepts amount in paise
      currency: "INR",
      name: "RupeEcom", // You can substitute with dynamic name if required
      description: "Order Payment",
      image: "/logo.png",       // Path to your logo image
      // If you wish to incorporate a backend-generated order id, you can include it here
      order_id:'',
      handler: async function (response: any) {
        // Attach Razorpay response to your orderData

        // orderData.razorpay_payment_id = response.razorpay_payment_id;
        // orderData.razorpay_order_id = response.razorpay_order_id;
        // orderData.razorpay_signature = response.razorpay_signature;

        try {
          await API.saveOrder(orderModel);

          sessionStorage.setItem(
            "order-success-data",
            JSON.stringify({
              ...orderData,
              deliveryAddress,
              apiResponse: { success: true },
            })
          );
          toast.success("Order placed successfully!");
          onSuccess(); // e.g. clear cart and redirect
        } catch (error) {
          console.error("Error saving order:", error);
          toast.error("Order placement failed");
        }
      },
      prefill: {
        name:'',
        email: 'orderData.billingDetails.email',
        contact: 'orderData.billingDetails.phone'
      },
      theme: {
        color: "#3399cc",
      },
      modal: {
        ondismiss: () => {
          toast.info("Payment cancelled");
        },
      },
    };

    // Open the Razorpay checkout modal
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button type="button" className="btn-primary" onClick={triggerPayment}>
      Pay ₹{finalTotal} with Razorpay
    </button>
  );
};

export default RazorpayButton;
