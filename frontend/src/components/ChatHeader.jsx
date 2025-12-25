import { X } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../authentication/useAuth";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChat();
    const { onlineUsers } = useAuth();
    const isOnline = onlineUsers.includes(selectedUser._id);

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                            {isOnline && (
                                <span
                                    className="absolute bottom-0 right-0 size-2.5 bg-green-500 
                  rounded-full ring-2 ring-base-100"
                                />
                            )}
                        </div>
                    </div>

                    {/* User info */}
                    <div>
                        <h3 className="font-medium">{selectedUser.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                            {isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {/* Close button */}
                <button className="cursor-pointer" onClick={() => setSelectedUser(null)}>
                    <X />
                </button>
            </div>
        </div>
    );
};
export default ChatHeader;