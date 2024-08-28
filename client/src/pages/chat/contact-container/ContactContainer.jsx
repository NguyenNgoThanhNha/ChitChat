import React, { useEffect } from 'react'
import ProfileInfo from './profile-info/ProfileInfo';
import NewDM from './new-dm/NewDM';
import { apiClient } from '@/lib/api.client';
import { GET_ALL_USER_CHANNELS_ROUTE, GET_CONTACT_FOR_DM_ROUTE } from '@/utils/constant';
import { useAppStore } from '@/store/store';
import ContactList from '@/components/ContactList';
import CreateChanel from './create-channel/CreateChanel';

const ContactContainer = () => {
    const { directMessagesContacts, setDirectMessagesContacts, channels, setChannels } = useAppStore();
    useEffect(() => {
        const getContacts = async () => {
            const response = await apiClient.get(GET_CONTACT_FOR_DM_ROUTE, { withCredentials: true })
            if (response.status === 200 && response.data.contacts) {
                setDirectMessagesContacts(response.data.contacts)
            }
        };
        const getChannels = async () => {
            const response = await apiClient.get(GET_ALL_USER_CHANNELS_ROUTE, { withCredentials: true })
            if (response.status === 200 && response.data.channels) {
                setChannels(response.data.channels)
            }
        }

        getContacts();
        getChannels();
    }, [setDirectMessagesContacts, setChannels])
    return (
        <div className='relative md:w-[35vw] lg:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full'>
            <div className='pt-3'>
                <Logo />
            </div>
            <div className='my-5'>
                <div className='flex items-center justify-between pr-10'>
                    <Title text="Direct Message" />
                    <NewDM />
                </div>
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
        <div className="flex p-5  justify-start items-center gap-2">
            <svg
                id="logo-38"
                width="78"
                height="32"
                viewBox="0 0 78 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {" "}
                <path
                    d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
                    className="ccustom"
                    fill="#8338ec"
                ></path>{" "}
                <path
                    d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
                    className="ccompli1"
                    fill="#975aed"
                ></path>{" "}
                <path
                    d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
                    className="ccompli2"
                    fill="#a16ee8"
                ></path>{" "}
            </svg>
            <span className="text-3xl font-semibold ">Syncronus</span>
        </div>
    );
};

const Title = ({ text }) => {
    return (
        <h6 className='uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm'>{text}</h6>
    )
}
