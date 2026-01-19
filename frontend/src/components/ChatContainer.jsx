import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Edit, Trash2 } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./common/MessageSkeleton";
import MessageStatus from "./common/MessageStatus";
import { editMessage, deleteMessage } from "../store/chatSlice";

import { formatMessageTime, isSameDay } from "../lib/utils.js";
import TypingIndicator from "./common/TypingIndicator.jsx";

const ChatContainer = ({ onStartCall }) => { // Add onStartCall prop
    const { messages, isMessagesLoading, selectedUser } = useSelector((state) => state.chat);
    const { authUser, socket } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const messagesContainerRef = useRef(null);
    const typingIndicatorRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDeleteId, setMessageToDeleteId] = useState(null);

    const selectedUserRef = useRef(selectedUser);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setEditText(message.text);
    };

    const handleSaveEdit = async () => {
        if (editingMessage && editText.trim()) {
            await dispatch(editMessage({ messageId: editingMessage._id, text: editText.trim() }));
            setEditingMessage(null);
            setEditText("");
        }
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditText("");
    };

    const handleDeleteMessage = (messageId) => {
        setMessageToDeleteId(messageId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (messageToDeleteId) {
            await dispatch(deleteMessage(messageToDeleteId));
            setShowDeleteModal(false);
            setMessageToDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMessageToDeleteId(null);
    };

    useEffect(() => {
        if (isTyping && typingIndicatorRef.current) {
            typingIndicatorRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isTyping]);

    useEffect(() => {
        if (!socket) return;

        const handleTypingEvent = (data) => {
            if (data.senderId === selectedUserRef.current?._id) {
                setIsTyping(true);
            }
        };

        const handleStopTypingEvent = () => {
            setIsTyping(false);
        };

        socket.on("typing", handleTypingEvent);
        socket.on("stopTyping", handleStopTypingEvent);

        return () => {
            socket.off("typing", handleTypingEvent);
            socket.off("stopTyping", handleStopTypingEvent);
        }
    }, [socket]);


    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col">
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

            if (message.deleted) {
                messageElements.push(
                    <div
                        key={message._id}
                        className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-bubble text-gray-500 italic">
                            This message was deleted
                        </div>
                    </div>
                );
            } else {
                messageElements.push(
                    <div
                        key={message._id}
                        className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
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
                                {message.editedAt && <span className="text-xs opacity-50"> (edited)</span>}
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
                            {editingMessage && editingMessage._id === message._id ? (
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="textarea textarea-bordered textarea-sm"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveEdit} className="btn btn-xs btn-primary">Save</button>
                                        <button onClick={handleCancelEdit} className="btn btn-xs btn-ghost">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                message.text && <p>{message.text}</p>
                            )}
                        </div>
                        {message.senderId === authUser._id && !message.image && !editingMessage && (
                            <div className="chat-actions">
                                <button onClick={() => handleDeleteMessage(message._id)} className="btn btn-xs btn-ghost text-red-500"><Trash2 size={16} /></button>
                                <button onClick={() => handleEditMessage(message)} className="btn btn-xs btn-ghost"><Edit size={16} /></button>
                            </div>
                        )}
                    </div>
                );
            }
        }
        return messageElements;
    };


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-base-100 scrollbar-thin" ref={messagesContainerRef}>
                <ChatHeader onStartCall={() => onStartCall(selectedUser)} />
                {/* Messages */}
                <div className="p-4 space-y-4">
                    {renderMessages()}
                    <div ref={typingIndicatorRef}>
                        {isTyping && <TypingIndicator />}
                    </div>
                </div>
            </div>

            <MessageInput />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Confirm Delete</h3>
                        <p className="py-4">Are you sure you want to delete this message?</p>
                        <div className="modal-action">
                            <button onClick={confirmDelete} className="btn btn-error">Yes, delete</button>
                            <button onClick={cancelDelete} className="btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatContainer