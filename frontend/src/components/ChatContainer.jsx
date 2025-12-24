import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./common/MessageSkeleton";
import MessageStatus from "./common/MessageStatus";

import { useAuth } from "../authentication/useAuth";
import { formatMessageTime, isSameDay } from "../lib/utils.js";

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser } = useChat();
    const { authUser } = useAuth();
    const messageEndRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id);
        const socket = useAuth.getState().socket;
        
        if (socket) {
            socket.emit("markAsRead", { myId: authUser._id, userToChatId: selectedUser._id });
        }
    }, [selectedUser._id, getMessages, authUser._id])

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current?.scrollIntoView({
                behavior: "smooth"
            })
        }
    }, [messages])


    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    const renderMessages = () => {
        if (messages.length === 0) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg text-zinc-500">No messages yet. Start the conversation!</p>
                </div>
            );
        }

        const messageElements = [];
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const prevMessage = messages[i - 1];

            if (!prevMessage || !isSameDay(new Date(prevMessage.createdAt), new Date(message.createdAt))) {
                messageElements.push(
                    <div key={`date-${message._id}`} className="chat-date">
                        <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                );
            }
            messageElements.push(
                <div
                    key={message._id}
                    className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    ref={i === messages.length - 1 ? messageEndRef : null}
                >
                    <div className="chat-image avatar">
                        <div className="size-10 rounded-full border">
                            <img
                                src={
                                    message.senderId === authUser._id
                                        ? authUser.profilePic || "/avatar.png"
                                        : selectedUser.profilePic || "/avatar.png"
                                }
                                alt="profile pic"
                            />
                        </div>
                    </div>
                    <div className="chat-header mb-1 flex items-center gap-2">
                        <time className="text-xs opacity-50 ml-1">
                            {formatMessageTime(message.createdAt)}
                        </time>
                        {message.senderId === authUser._id && <MessageStatus status={message.status} />}
                    </div>
                    <div className="chat-bubble flex flex-col">
                        {message.image && (
                            <img
                                src={message.image}
                                alt="Attachment"
                                className="sm:max-w-[200px] rounded-md mb-2"
                            />
                        )}
                        {message.text && <p>{message.text}</p>}
                    </div>
                </div>
            );
        }
        return messageElements;
    };


    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {renderMessages()}
            </div>

            <MessageInput />
        </div>
    )
}

export default ChatContainer