"use client";
import { FC } from "react";

interface PopupProps {
  message: string;
  onClose: () => void;
}

const Popup: FC<PopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-80">
        <p>{message}</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition duration-300"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default Popup;
