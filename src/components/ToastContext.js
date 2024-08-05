// src/context/ToastContext.js
import { createContext, useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastContext = createContext();

export const useToast = () => {
    return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "info") => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { id, message, type };

        setToasts((currentToasts) => [...currentToasts, newToast]);

        toast(message, {
            type: type,
            toastId: id,
            autoClose: 5000,
            style: {
                background: "#000",
                color: "#fff",
            },
        });

        setTimeout(() => {
            setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
        }, 5000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </ToastContext.Provider>
    );
};