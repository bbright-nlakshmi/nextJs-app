"use client";
import React from "react";
import { toast } from "react-toastify";
import { API } from "@/app/services/api.service";
import { RazorpayModel } from "@/app/globalProvider";

interface RazorpayButtonProps {
  formData: any,       
  prepareOrderData: (formData: any) => {
    orderData: any;
    orderModel: any;
    deliveryAddress: any;
  } | null; 
  finalTotal: number;     
  onSuccess: () => void;  
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  // orderData,
  // orderModel,
  // deliveryAddress,
  formData,
  prepareOrderData,
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
    const preparedData = prepareOrderData(formData);
    if (!preparedData) return;

    const { orderData, orderModel, deliveryAddress } = preparedData;

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast.error("Razorpay SDK failed to load");
      return;
    }

    const key = await fetchRazorpayKey();
    if (!key) return;
    const amountInPaise = Math.round(finalTotal * 100);

    const options = {
      key: key,
      amount: amountInPaise, // Razorpay accepts amount in paise
      currency: "INR",
      name: "RupeEcom", 
      description:`Order #${orderData.orderId}`,
      image: "",      
      // If you wish to incorporate a backend-generated order id, you can include it here
      order_id:'',
      handler: async function (response: any) {
        // Attach Razorpay response to your orderData

        try {
          orderModel.txnDetails = response;
          await API.saveOrder(orderModel);

          sessionStorage.setItem(
            "order-success-data",
            JSON.stringify({
              orderId: orderData.orderId,
              amount: orderData.amount,
              billingDetails: orderData.billingDetails,
              deliveryAddress: deliveryAddress,
              paymentStatus: "success"
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
        name:`${orderData.billingDetails.firstName} ${orderData.billingDetails.lastName}`,
        email: orderData.billingDetails.email,
        contact: orderData.billingDetails.phone
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
      Pay ₹{finalTotal.toFixed(2)} with Razorpay
    </button>
  );
};

export default RazorpayButton;

