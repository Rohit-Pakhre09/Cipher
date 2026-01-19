import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { acceptCall, rejectCall } from '../store/callSlice';

const CallModal = ({ caller, onAccept, onReject }) => {
  const dispatch = useDispatch();

  const handleAccept = () => {
    dispatch(acceptCall());
    onAccept();
  };

  const handleReject = () => {
    dispatch(rejectCall());
    onReject();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Incoming Call</h2>
        <p className="mb-6">Call from {caller}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleAccept}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full"
          >
            <Phone size={24} />
          </button>
          <button
            onClick={handleReject}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
