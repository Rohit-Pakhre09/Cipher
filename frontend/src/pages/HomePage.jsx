import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import Sidebar from "../components/Sidebar";
import { useSelector } from "react-redux";

const HomePage = () => {
  const { selectedUser } = useSelector((state) => state.chat);

  return (
    <div className='h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-base-200 p-0 md:p-4'>
      <main className='w-full max-w-7xl h-full md:h-[90vh] bg-base-100 rounded-none md:rounded-lg shadow-xl flex'>
        <div className="hidden md:flex w-full">
          <div className="md:w-1/3 lg:w-1/4 md:shrink-0 h-full">
            <Sidebar />
          </div>
          <div className="flex-1 flex h-full">
            {selectedUser ? <ChatContainer /> : <NoChatSelected />}
          </div>
        </div>

        <div className="md:hidden w-full h-full">
          {selectedUser ? <ChatContainer /> : <Sidebar />}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
