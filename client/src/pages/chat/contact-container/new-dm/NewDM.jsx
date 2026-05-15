import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { apiClient } from '@/lib/api.client'
import { animationDefaultOptions, getColor } from '@/lib/utils'
import { useAppStore } from '@/store/store'
import { saveActiveChat } from '@/store/chatPersistence'
import {
    FRIEND_REQUEST_ROUTE,
    FRIEND_REQUEST_ITEM_ROUTE,
    FRIEND_REQUESTS_INCOMING_ROUTE,
    HOST,
    SEARCH_CONTACT_ROUTE
} from '@/utils/constant'
import React, { useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import Lottie from 'react-lottie'
import { toast } from 'sonner'

const relationLabel = {
    friends: "Friends",
    pending_sent: "Request sent",
    pending_received: "Accept below",
    none: "Add friend"
};

const NewDM = ({ onContactsUpdated }) => {
    const { setSelectedChatType, setSelectedChatData, setselectedChatMessages } = useAppStore();
    const [openNewContactModal, setOpenNewContactModal] = useState(false)
    const [searchedContact, setSearchContact] = useState([])
    const [busyId, setBusyId] = useState(null)

    const searchContact = async (searchTerm) => {
        try {
            if (searchTerm.length) {
                const response = await apiClient.post(SEARCH_CONTACT_ROUTE, { searchTerm }, { withCredentials: true })
                if (response.status === 200 && response.data.contacts) {
                    setSearchContact(response.data.contacts)
                }
            } else {
                setSearchContact([]);
            }
        } catch (error) {
            console.log(error)
        }
    }

    const selectNewContact = (contact) => {
        if (contact.relation !== "friends") {
            toast.info("You must be friends to start a direct message");
            return;
        }
        setOpenNewContactModal(false);
        setSelectedChatType("contact");
        setSelectedChatData(contact);
        setselectedChatMessages([]);
        saveActiveChat("contact", contact._id);
        setSearchContact([])
    }

    const sendRequest = async (e, contact) => {
        e.stopPropagation();
        setBusyId(contact._id);
        try {
            await apiClient.post(FRIEND_REQUEST_ROUTE, { toUserId: contact._id }, { withCredentials: true });
            toast.success("Friend request sent");
            setSearchContact((list) =>
                list.map((c) => (c._id === contact._id ? { ...c, relation: "pending_sent" } : c))
            );
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not send request");
        } finally {
            setBusyId(null);
        }
    }

    const acceptRequest = async (e, contact) => {
        e.stopPropagation();
        setBusyId(contact._id);
        try {
            const inc = await apiClient.get(FRIEND_REQUESTS_INCOMING_ROUTE, { withCredentials: true });
            const req = (inc.data.requests || []).find(
                (r) => String(r.from?._id ?? r.from) === String(contact._id)
            );
            if (!req) {
                toast.error("Request not found");
                return;
            }
            await apiClient.patch(
                FRIEND_REQUEST_ITEM_ROUTE(req._id),
                { action: "accept" },
                { withCredentials: true }
            );
            toast.success("You are now friends");
            setSearchContact((list) =>
                list.map((c) => (c._id === contact._id ? { ...c, relation: "friends" } : c))
            );
            onContactsUpdated?.();
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not accept");
        } finally {
            setBusyId(null);
        }
    }

    const renderAction = (contact) => {
        const rel = contact.relation || "none";
        if (rel === "friends") {
            return (
                <span className="text-[10px] text-emerald-400 shrink-0">Friends</span>
            );
        }
        if (rel === "pending_sent") {
            return <span className="text-[10px] text-muted-foreground shrink-0">Pending</span>;
        }
        if (rel === "pending_received") {
            return (
                <button
                    type="button"
                    disabled={busyId === contact._id}
                    onClick={(e) => acceptRequest(e, contact)}
                    className="text-[10px] px-2 py-1 rounded bg-[#8417ff] text-white shrink-0"
                >
                    Accept
                </button>
            );
        }
        return (
            <button
                type="button"
                disabled={busyId === contact._id}
                onClick={(e) => sendRequest(e, contact)}
                className="text-[10px] px-2 py-1 rounded border border-[#8417ff]/50 text-[#c4b5fd] shrink-0"
            >
                Add friend
            </button>
        );
    };

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <FaPlus className='text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300'
                            onClick={() => setOpenNewContactModal(true)}
                        />
                    </TooltipTrigger>
                    <TooltipContent className='mb-2 p-3'>
                        Find friends &amp; message
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={openNewContactModal} onOpenChange={setOpenNewContactModal}>
                <DialogContent className='w-[400px] max-h-[85vh] flex flex-col'>
                    <DialogHeader className='flex items-center'>
                        <DialogTitle>Find friends</DialogTitle>
                        <DialogDescription className="text-xs">
                            Send a friend request, then start a DM when accepted.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Input placeholder="Search by name or email" className='rounded-lg p-6' onChange={(e) => searchContact(e.target.value)} />
                    </div>
                    {
                        searchedContact.length > 0 && (
                            <ScrollArea className="h-[250px]">
                                <div className='flex flex-col gap-3'>
                                    {searchedContact.map((contact) => (
                                        <div
                                            key={contact._id}
                                            className={`flex gap-3 items-center p-2 rounded-lg ${contact.relation === "friends" ? "cursor-pointer hover:bg-accent" : ""}`}
                                            onClick={() => selectNewContact(contact)}
                                        >
                                            <div className='w-10 h-10 relative shrink-0'>
                                                <Avatar className='h-10 w-10 rounded-full overflow-hidden'>
                                                    {
                                                        contact.image ?
                                                            (<AvatarImage src={`${HOST}/${contact.image}`} alt="avatar" className="object-cover w-full h-full bg-black" />)
                                                            :
                                                            (
                                                                <div className={`uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(contact.color)}`} >
                                                                    {contact.firstName ? contact.firstName.split("").shift() : contact.email?.split("").shift()}
                                                                </div>
                                                            )
                                                    }
                                                </Avatar>
                                            </div>
                                            <div className='flex flex-col flex-1 min-w-0'>
                                                <span className="truncate text-sm">
                                                    {contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.email}
                                                </span>
                                                <span className='text-xs text-muted-foreground'>{relationLabel[contact.relation] || contact.relation}</span>
                                            </div>
                                            {renderAction(contact)}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )
                    }
                    {
                        searchedContact.length <= 0 && (
                            <div className='flex-1 md:flex flex-col mt-4 justify-center items-center'>
                                <Lottie isClickToPauseDisabled={true} height={100} width={100} options={animationDefaultOptions} />
                                <p className='text-sm text-muted-foreground mt-4 text-center px-4'>
                                    Search users to send a friend request
                                </p>
                            </div>
                        )
                    }
                </DialogContent>
            </Dialog>
        </>
    )
}

export default NewDM
