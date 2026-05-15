import React, { useEffect, useRef } from 'react'
import ProfileInfo from './profile-info/ProfileInfo';
import NewDM from './new-dm/NewDM';
import FriendRequests from './friend-requests/FriendRequests';
import { apiClient } from '@/lib/api.client';
import { GET_ALL_USER_CHANNELS_ROUTE, GET_CONTACT_FOR_DM_ROUTE } from '@/utils/constant';
import { useAppStore } from '@/store/store';
import ContactList from '@/components/ContactList';
import CreateChanel from './create-channel/CreateChanel';
import { readActiveChat } from '@/store/chatPersistence';

const ContactContainer = () => {
    const {
        directMessagesContacts,
        setDirectMessagesContacts,
        channels,
        setChannels,
        setSelectedChatType,
        setSelectedChatData,
        setselectedChatMessages
    } = useAppStore();
    const restoredRef = useRef(false);

    const refreshDmContacts = async () => {
        try {
            const cRes = await apiClient.get(GET_CONTACT_FOR_DM_ROUTE, { withCredentials: true });
            if (cRes.status === 200 && cRes.data.contacts) {
                setDirectMessagesContacts(cRes.data.contacts);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [cRes, chRes] = await Promise.all([
                    apiClient.get(GET_CONTACT_FOR_DM_ROUTE, { withCredentials: true }),
                    apiClient.get(GET_ALL_USER_CHANNELS_ROUTE, { withCredentials: true })
                ]);
                if (cancelled) return;
                const contacts = cRes.status === 200 && cRes.data.contacts ? cRes.data.contacts : [];
                const chs = chRes.status === 200 && chRes.data.channels ? chRes.data.channels : [];
                setDirectMessagesContacts(contacts);
                setChannels(chs);

                if (restoredRef.current) return;
                const key = readActiveChat();
                if (!key) return;
                if (key.type === "channel") {
                    const ch = chs.find((c) => String(c._id ?? c.id) === key.id);
                    if (ch) {
                        setSelectedChatType("channel");
                        setSelectedChatData(ch);
                        setselectedChatMessages([]);
                        restoredRef.current = true;
                    }
                } else {
                    const person = contacts.find((c) => String(c._id ?? c.id) === key.id);
                    if (person) {
                        setSelectedChatType("contact");
                        setSelectedChatData(person);
                        setselectedChatMessages([]);
                        restoredRef.current = true;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        })();
        return () => { cancelled = true; };
    }, [setDirectMessagesContacts, setChannels, setSelectedChatType, setSelectedChatData, setselectedChatMessages]);

    return (
        <div className='relative md:w-[35vw] lg:w-[20vw] bg-chat-panel border-r-2 border-chat-border w-full transition-colors duration-300'>
            <div className='pt-3 animate-in slide-in-from-left-2 duration-300'>
                <Logo />
            </div>
            <div className='my-5'>
                <div className='flex items-center justify-between pr-10'>
                    <Title text="Direct Message" />
                    <NewDM onContactsUpdated={refreshDmContacts} />
                </div>
                <FriendRequests onUpdated={refreshDmContacts} />
                <div className='max-h-[38vh] overflow-y-auto scrollbar-hidden'>
                    <ContactList contacts={directMessagesContacts} />
                </div>
            </div>
            <div className='my-5'>
                <div className='flex items-center justify-between pr-10'>
                    <Title text="Channels" />
                    <CreateChanel />
                </div>
                <div className='max-h-[38vh] overflow-y-auto scrollbar-hidden'>
                    <ContactList contacts={channels} isChannel={true} />
                </div>
            </div>
            <ProfileInfo />
        </div>
    )
}

export default ContactContainer


const Logo = () => {
    return (
        <div className="flex p-5 justify-start items-center gap-2">
            <svg
                id="logo-38"
                width="78"
                height="32"
                viewBox="0 0 78 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
                    className="ccustom"
                    fill="#8338ec"
                ></path>
                <path
                    d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
                    className="ccompli1"
                    fill="#975aed"
                ></path>
                <path
                    d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
                    className="ccompli2"
                    fill="#a16ee8"
                ></path>
            </svg>
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Syncronus</span>
        </div>
    );
};

const Title = ({ text }) => {
    return (
        <h6 className='uppercase tracking-widest text-muted-foreground pl-10 font-light text-sm'>{text}</h6>
    )
}
