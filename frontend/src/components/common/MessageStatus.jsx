import { Check, CheckCheck } from "lucide-react";

const MessageStatus = ({ status }) => {
    if (status === 'delivered') {
        return <CheckCheck className="size-4 text-gray-500" />;
    }
    if (status === 'read') {
        return <CheckCheck className="size-4 text-blue-500" />;
    }
    return <Check className="size-4 text-gray-500" />;
};

export default MessageStatus;
