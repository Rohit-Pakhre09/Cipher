import { Mic, MicOff, PhoneOff } from 'lucide-react';
// Removed useSelector

const CallControls = ({ onHangUp, onToggleMute, isMuted }) => { // isMuted received as prop
  // Removed const { isMuted } = useSelector((state) => state.call);

  const handleToggleMute = () => {
    onToggleMute();
  };

  const handleHangUp = () => {
    onHangUp();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 flex justify-center space-x-4 z-40">
      <button
        onClick={handleToggleMute}
        className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-blue-500'} text-white`}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      <button
        onClick={handleHangUp}
        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

export default CallControls;
