import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPersistedSelectedUserId, getUsers, selectUser } from "../store/chatSlice";
import { Search, Users } from "lucide-react";
import SidebarSkeleton from "./common/SidebarSkeleton";

const Sidebar = () => {
    const dispatch = useDispatch();
    const { users, selectedUser, isUsersLoading } = useSelector((state) => state.chat);
    const { onlineUsers, authUser } = useSelector((state) => state.auth);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!authUser?._id) return;
        dispatch(getUsers());
    }, [dispatch, authUser?._id]);

    useEffect(() => {
        if (selectedUser || users.length === 0) return;

        const savedUserId = getPersistedSelectedUserId();
        if (!savedUserId) return;

        const restoredUser = users.find((user) => String(user._id) === String(savedUserId));
        if (restoredUser) {
            dispatch(selectUser(restoredUser));
        }
    }, [dispatch, selectedUser, users]);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredUsers = users.filter((user) =>
        user.fullName?.toLowerCase().includes(normalizedSearchTerm)
    );

    const onlineUserIds = new Set((onlineUsers || []).map((id) => String(id)));
    const onlineCount = (onlineUsers || []).filter((id) => String(id) !== String(authUser?._id)).length;

    if (isUsersLoading) return <SidebarSkeleton />;

    return (
        <aside className="h-full w-full border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium">Contacts</span>
                </div>
                <div className="mt-3">
                    <span className="text-xs text-zinc-500">({onlineCount} online)</span>
                </div>
                <div className="mt-3 relative">
                    <Search className="pointer-events-none absolute z-10 left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/60" />
                    <input
                        type="text"
                        placeholder="Search contacts"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-bordered w-full pl-10"
                    />
                </div>
            </div>

            <div className="overflow-y-auto w-full py-3">
                {filteredUsers.map((user) => {
                    const isOnline = onlineUserIds.has(String(user._id));

                    return (
                        <button
                            key={user._id}
                            onClick={() => dispatch(selectUser(user))}
                            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors cursor-pointer
              border-b border-base-300
              ${String(selectedUser?._id) === String(user._id) ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
                        >
                            <div className="relative">
                                <img
                                    src={user.profilePic || "/avatar.png"}
                                    alt={user.name}
                                    className="size-12 object-cover rounded-full"
                                />
                                {isOnline && (
                                    <span
                                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                                    />
                                )}
                            </div>

                            <div className="text-left min-w-0">
                                <div className="font-medium truncate">{user.fullName}</div>
                                <div className="text-sm text-zinc-400">
                                    {isOnline ? "Online" : "Offline"}
                                </div>
                            </div>
                        </button>
                    );
                })}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No users found</div>
                )}
            </div>
        </aside>
    )
}

export default Sidebar
