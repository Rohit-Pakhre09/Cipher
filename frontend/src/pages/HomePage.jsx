import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import Sidebar from "../components/Sidebar";

import { useChat } from "../hooks/useChat";

const HomePage = () => {
  const { selectedUser } = useChat();
  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-2 md:px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)] md:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Sidebar - visible on mobile only when no chat is selected */}
            <div className={`${selectedUser ? 'hidden' : 'block'} md:block`}>
              <Sidebar />
            </div>

            {/* Chat Area - visible on mobile only when a chat IS selected */}
            <div className={`flex-1 ${selectedUser ? 'flex' : 'hidden'} md:flex`}>
              {selectedUser ? <ChatContainer /> : <NoChatSelected />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage;
