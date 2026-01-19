import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import Sidebar from "../components/Sidebar";
import CallModal from "../components/CallModal";
import CallControls from "../components/CallControls";
import useWebRTC from "../hooks/useWebRTC";

import { useDispatch, useSelector } from "react-redux";
import { PhoneOff } from "lucide-react";
import { startCall as startCallRedux } from "../store/callSlice"; // Rename to avoid conflict

const HomePage = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((state) => state.chat);
  const { isReceivingCall, isConnected, isCalling, caller, receiver, isMuted } = useSelector((state) => state.call);

  const {
    startCall, // This is the useWebRTC hook's startCall function
    acceptIncomingCall,
    rejectIncomingCall,
    handleEndCall,
    toggleMuteCall,
    remoteAudioRef,
  } = useWebRTC();

  // Function to initiate a call, dispatched from ChatHeader
  const handleStartCall = (receiverUser) => {
    if (!isCalling && !isReceivingCall && !isConnected) {
      const newCallId = Date.now().toString(); // Generate a unique call ID
      dispatch(startCallRedux({ receiver: receiverUser, callId: newCallId }));
      // Now trigger the WebRTC call initiation
      startCall(receiverUser);
    }
  };

  return (
    <div className='h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-base-200 p-0 md:p-4'>
      <main className='w-full max-w-7xl h-full md:h-[90vh] bg-base-100 rounded-none md:rounded-lg shadow-xl flex'>
        <div className="hidden md:flex w-full">
          <div className="md:w-1/3 lg:w-1/4 md:shrink-0 h-full">
            <Sidebar />
          </div>
          <div className="flex-1 flex h-full">
            {selectedUser ? <ChatContainer onStartCall={handleStartCall} /> : <NoChatSelected />}
          </div>
        </div>

        <div className="md:hidden w-full h-full">
          {selectedUser ? <ChatContainer onStartCall={handleStartCall} /> : <Sidebar />}
        </div>
      </main>

      {/* Call Modal */}
      {isReceivingCall && caller && (
        <CallModal
          caller={caller.fullName}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}

      {/* Calling Indicator */}
      {isCalling && !isConnected && receiver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-lg font-semibold">Calling {receiver.fullName}...</p>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Controls */}
      {isConnected && (
        <CallControls
          onHangUp={handleEndCall}
          onToggleMute={toggleMuteCall}
          isMuted={isMuted} // Pass isMuted prop
        />
      )}

      {/* Remote Audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
};

export default HomePage;

