import { ArrowLeft, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../store/chatSlice";

const ChatHeader = () => {
    const dispatch = useDispatch();
    const { selectedUser } = useSelector((state) => state.chat);
    const { onlineUsers } = useSelector((state) => state.auth);
    const isOnline = onlineUsers.includes(selectedUser._id);

    return (
        <div className="p-2.5 border-b border-base-300 sticky top-0 z-10 bg-base-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Back button (mobile) */}
                    <button className="btn btn-ghost md:hidden" onClick={() => dispatch(selectUser(null))}>
                        <ArrowLeft />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Avatar */}
                    <div className="avatar">
                        <div className="size-10 relative">
                            <img
                                src={selectedUser.profilePic || "/avatar.png"}
                                alt={selectedUser.fullName}
                                className="size-10 rounded-full object-cover"
                            />
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

                {/* Close button (desktop) */}
                <button className="cursor-pointer hidden md:block" onClick={() => dispatch(selectUser(null))}>
                    <X />
                </button>
            </div>
        </div>
    );
};
export default ChatHeader;