"use client";
import React from "react";
import { Toast, ToastHeader, ToastBody } from "reactstrap";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="dashboard-toast-container dashboard-position-fixed dashboard-top-0 dashboard-end-0 dashboard-p-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} isOpen={true}>
          <ToastHeader
            icon={toast.type === "success" ? "success" : toast.type === "error" ? "danger" : "info"}
            toggle={() => removeToast(toast.id)}
          >
            {toast.title}
          </ToastHeader>
          <ToastBody>{toast.message}</ToastBody>
        </Toast>
      ))}
    </div>
  );
};

export default ToastContainer;
