"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { API } from "@/app/globalProvider";
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
  formData,
  prepareOrderData,
  finalTotal,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!formData || !prepareOrderData) {
      toast.error("Form data is missing");
      return;
    }

    setIsProcessing(true);

    try {
      const preparedData = prepareOrderData(formData);
      if (!preparedData) {
        setIsProcessing(false);
        return;
      }

      const { orderData, orderModel, deliveryAddress } = preparedData;

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load");
        setIsProcessing(false);
        return;
      }

      // Fetch Razorpay key
      const key = await fetchRazorpayKey();
      if (!key) {
        setIsProcessing(false);
        return;
      }

      const amountInPaise = Math.round(finalTotal * 100);

      const options = {
        key: key,
        amount: amountInPaise, // Razorpay accepts amount in paise
        currency: "INR",
        name: "RupeEcom", 
        description: `Order #${orderData.orderId}`,
        image: "",      
        order_id: '',
        handler: async function (response: any) {
          try {
            // Attach Razorpay response to order model
            orderModel.txnDetails = response;
            
            // Save the order with transaction details
            await API.saveOrder(orderModel);

            // Store order success data in session storage
            sessionStorage.setItem(
              "order-success-data",
              JSON.stringify({
                orderId: orderData.orderId,
                amount: orderData.amount,
                billingDetails: orderData.billingDetails,
                deliveryAddress: deliveryAddress,
                paymentStatus: "success",
                orderModel: orderModel
              })
            );

            toast.success("Payment successful! Order placed successfully!");
            setIsProcessing(false);
            onSuccess(); // Clear cart and redirect
          } catch (error) {
            console.error("Error saving order:", error);
            toast.error("Payment successful but order placement failed");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `${orderData.billingDetails.firstName} ${orderData.billingDetails.lastName}`,
          email: orderData.billingDetails.email,
          contact: orderData.billingDetails.phone
        },
        notes: {
          order_id: orderData.orderId,
          store: "RupeEcom"
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setIsProcessing(false);
          },
        },
        onError: (error: any) => {
          console.error("Razorpay error:", error);
          toast.error("Payment failed. Please try again.");
          setIsProcessing(false);
        }
      };

      // Open the Razorpay checkout modal
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error triggering payment:", error);
      toast.error("Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  return (
    <button 
      type="button" 
      className="btn btn-primary btn-block rzp-btn"
      onClick={triggerPayment}
      disabled={isProcessing}
    >
      {isProcessing ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)} with Razorpay`}
    </button>
  );
};

export default RazorpayButton;

