"use client";
import React from "react";
import { toast } from "react-toastify";
import { API } from "@/app/services/api.service";
import { RazorpayModel } from "@/app/globalProvider";

interface RazorpayButtonProps {
  formData: any,       
  prepareOrderData:any,  
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

    const options = {
      key: key,
      amount: ((finalTotal * 100).toFixed(2)), // Razorpay accepts amount in paise
      currency: "INR",
      name: "RupeEcom", 
      description: "Order Payment",
      image: "",      
      // If you wish to incorporate a backend-generated order id, you can include it here
      order_id:'',
      handler: async function (response: any) {
        // Attach Razorpay response to your orderData

        // orderData.razorpay_payment_id = response.razorpay_payment_id;
        // orderData.razorpay_order_id = response.razorpay_order_id;
        // orderData.razorpay_signature = response.razorpay_signature;

        try {
          orderModel.txnDetails = response;
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
        name:'sai',
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

// "use client";
// import React from "react";
// import { toast } from "react-toastify";
// import { useRouter } from "next/navigation";
// import { API } from "@/app/services/api.service";
// import { RazorpayModel } from "@/app/globalProvider";

// interface RazorpayButtonProps {
//   orderData: any;
//   orderModel: any;
//   deliveryAddress: any;
//   finalTotal: number;
//   onSuccess: () => void;
// }

// const RazorpayButton: React.FC<RazorpayButtonProps> = ({
//   orderData,
//   orderModel,
//   deliveryAddress,
//   finalTotal,
//   onSuccess,
// }) => {
//   const router = useRouter();

//   const loadRazorpayScript = (): Promise<boolean> => {
//     return new Promise((resolve) => {
//       if (typeof window !== 'undefined' && (window as any).Razorpay) {
//         return resolve(true);
//       }

//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.async = true;
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const fetchRazorpayKey = async (): Promise<string | null> => {
//     try {
//       const details: RazorpayModel[] = await API.getRazorPayDetails();
//       if (details.length > 0 && details[0].keyId) {
//         return details[0].keyId;
//       }
//       toast.error("No Razorpay key details found");
//       return null;
//     } catch (error) {
//       console.error("Error fetching Razorpay key:", error);
//       toast.error("Unable to load payment gateway");
//       return null;
//     }
//   };

//   const triggerPayment = async () => {
//     try {
//       const [isScriptLoaded, key] = await Promise.all([
//         loadRazorpayScript(),
//         fetchRazorpayKey()
//       ]);

//       if (!isScriptLoaded || !key) return;

//       const options = {
//         key: key,
//         amount: ((finalTotal * 100).toFixed(2)),
//         currency: "INR",
//         name: "RupeEcom",
//         description: `Order #${orderModel.id}`,
//         handler: async function (response: any) {
//           try {
//             const paymentDetails = {
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_signature: response.razorpay_signature,
//               status: "completed",
//               amount: finalTotal,
//               currency: "INR",
//               method: "razorpay",
//               timestamp: new Date().toISOString()
//             };

//             const paidOrder = {
//               ...orderModel,
//               paymentStatus: "PAID",
//               txnDetails: paymentDetails
//             };

//             await API.saveOrder(paidOrder);

//             sessionStorage.setItem(
//               "order-success-data",
//               JSON.stringify({
//                 orderId: orderModel.id,
//                 amount: finalTotal,
//                 paymentId: response.razorpay_payment_id,
//                 deliveryAddress,
//                 date: new Date().toISOString()
//               })
//             );

//             toast.success("Payment successful! Order confirmed.");
//             onSuccess();
//             router.push("/order-success");
//           } catch (error) {
//             console.error("Error saving order:", error);
//             toast.error("Order placement failed. Please contact support.");
//           }
//         },
//         prefill: {
//           name: `${orderData.billingDetails.firstName} ${orderData.billingDetails.lastName}`,
//           email: orderData.billingDetails.email,
//           contact: orderData.billingDetails.phone
//         },
//         theme: {
//           color: "#3399cc"
//         }
//       };

//       const rzp = new (window as any).Razorpay(options);
//       rzp.open();

//       rzp.on('payment.failed', (response: any) => {
//         console.error("Payment failed:", response.error);
//         toast.error(`Payment failed: ${response.error.description}`);
//       });

//     } catch (error) {
//       console.error("Payment initialization error:", error);
//       toast.error("Failed to initialize payment");
//     }
//   };

//   return (
//     <button 
//       type="button" 
//       className="btn-primary" 
//       onClick={triggerPayment}
//       disabled={!orderModel || !orderData}
//     >
//       Pay ₹{finalTotal.toFixed(2)} with Razorpay
//     </button>
//   );
// };

// export default RazorpayButton;