import { useAppStore } from '@/store/store';
import React from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { getColor } from '@/lib/utils';
import { HOST } from '@/utils/constant';

const ContactList = ({ contacts, isChannel = false }) => {
  const {
    selectedChatType,
    selectedChatData,
    setSelectedChatType,
    setSelectedChatData,
    setselectedChatMessages,
    onlineUserIds
  } = useAppStore();

  const handleClick = (contact) => {
    if (isChannel) {
      setSelectedChatType("channel");
    } else {
      setSelectedChatType("contact");
    }
    setSelectedChatData(contact);

    if (selectedChatData && selectedChatData._id !== contact._id) {
      setselectedChatMessages([]);
    }
  };

  return (
    <div className='mt-2'>
      {contacts.map((contact, idx) => (
        <div
          key={contact._id}
          style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
          onClick={() => handleClick(contact)}
          className={`pl-8 py-2.5 mx-2 rounded-md cursor-pointer transition-all duration-200 ease-out
            hover:bg-black/5 dark:hover:bg-[#f1f1f111] hover:translate-x-0.5 active:scale-[0.99]
            animate-in fade-in slide-in-from-left-2 duration-300
            ${selectedChatData && selectedChatData._id === contact._id
              ? "bg-[#8417ff] hover:bg-[#8417ff] text-white shadow-sm"
              : ""
            }`}
        >
          <div className={`flex gap-4 items-center justify-start ${selectedChatData && selectedChatData._id === contact._id ? "text-white" : "text-foreground/85 dark:text-neutral-300"}`}>
            {
              !isChannel && (
                <div className="relative shrink-0">
                  <Avatar className='h-10 w-10 rounded-full overflow-hidden transition-transform duration-200'>
                    {
                      contact.image ?
                        (<AvatarImage src={`${HOST}/${contact.image}`} alt="avatar" className="object-cover w-full h-full bg-black rounded-full" />)
                        :
                        (
                          <div className={`uppercase h-10 w-10 text-sm border border-white/10 flex items-center justify-center rounded-full ${getColor(contact.color)}`} >
                            {contact.firstName ? contact.firstName.split("").shift() : contact.email?.split("").shift()}
                          </div>
                        )
                    }
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-chat-panel ${onlineUserIds?.[contact._id] ? "bg-emerald-500" : "bg-neutral-500"
                      }`}
                    title={onlineUserIds?.[contact._id] ? "Online" : "Offline"}
                  />
                </div>
              )
            }
            {
              isChannel && (
                <div className='bg-muted dark:bg-white/10 h-9 w-9 flex items-center justify-center rounded-full text-foreground font-semibold shrink-0'>#</div>
              )
            }
            <span className="truncate text-sm">{isChannel ? contact.name : (contact.firstName ? `${contact.firstName}` : contact.email)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;
