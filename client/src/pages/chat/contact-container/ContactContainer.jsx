import React, { useEffect, useRef } from 'react'
import ProfileInfo from './profile-info/ProfileInfo';
import NewDM from './new-dm/NewDM';
import { apiClient } from '@/lib/api.client';
import { GET_ALL_USER_CHANNELS_ROUTE, GET_CONTACT_FOR_DM_ROUTE } from '@/utils/constant';
import { useAppStore } from '@/store/store';
import ContactList from '@/components/ContactList';
import CreateChanel from './create-channel/CreateChanel';
import { readActiveChat } from '@/store/chatPersistence';
import { cn } from '@/lib/utils';

const ContactContainer = () => {
    const {
        directMessagesContacts,
        setDirectMessagesContacts,
        channels,
        setChannels,
        setSelectedChatType,
        setSelectedChatData,
        setselectedChatMessages,
        selectedChatType
    } = useAppStore();
    const restoredRef = useRef(false);
    const chatOpen = selectedChatType !== undefined;

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
        <div
            className={cn(
                'relative flex flex-col w-full h-[100dvh] md:h-full md:w-[35vw] lg:w-[20vw] bg-chat-panel border-r-2 border-chat-border transition-colors duration-300',
                chatOpen && 'hidden md:flex'
            )}
        >
            <div className="pt-safe shrink-0 animate-in slide-in-from-left-2 duration-300">
                <Logo />
            </div>
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden pb-[72px] md:pb-[68px]">
                <section className="flex flex-col min-h-0 flex-1 border-b border-chat-border/60">
                    <div className="flex items-center justify-between pr-4 pl-2 py-2 shrink-0">
                        <Title text="Direct Message" />
                        <NewDM onContactsUpdated={refreshDmContacts} />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden overscroll-contain">
                        <ContactList contacts={directMessagesContacts} />
                    </div>
                </section>
                <section className="flex flex-col min-h-0 flex-1">
                    <div className="flex items-center justify-between pr-4 pl-2 py-2 shrink-0">
                        <Title text="Channels" />
                        <CreateChanel />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden overscroll-contain">
                        <ContactList contacts={channels} isChannel={true} />
                    </div>
                </section>
            </div>
            <ProfileInfo onContactsUpdated={refreshDmContacts} />
        </div>
    )
}

export default ContactContainer

const Logo = () => {
    return (
        <div className="flex p-4 sm:p-5 justify-start items-center gap-2">
            <svg
                id="logo-38"
                width="78"
                height="32"
                viewBox="0 0 78 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 sm:h-8 w-auto"
            >
                <path d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z" fill="#8338ec" />
                <path d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z" fill="#975aed" />
                <path d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z" fill="#a16ee8" />
            </svg>
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Syncronus</span>
        </div>
    );
};

const Title = ({ text }) => {
    return (
        <h6 className="uppercase tracking-widest text-muted-foreground pl-6 sm:pl-10 font-light text-xs sm:text-sm">{text}</h6>
    )
}
