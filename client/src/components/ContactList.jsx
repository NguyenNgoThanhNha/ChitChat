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
    setselectedChatMessages
  } = useAppStore();

  const handleClick = (contact) => {
    if (isChannel) {
      setSelectedChatType("channel");
    } else {
      setSelectedChatType("contact");
    }
    setSelectedChatData(contact); // render chat

    // Clear messages if a different contact is selected
    if (selectedChatData && selectedChatData._id !== contact._id) {
      setselectedChatMessages([]);
    }
  };

  return (
    <div className='mt-5'>
      {contacts.map((contact) => (
        <div
          key={contact._id}
          onClick={() => handleClick(contact)}
          className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${selectedChatData && selectedChatData._id === contact._id ?
            "bg-[#8417ff] hover:bg-[#8417ff]"
            :
            "hover:bg-[#f1f1f111]"
            }`}
        >
          <div className='flex gap-5 items-center justify-start text-neutral-300'>
            {
              !isChannel && (
                <Avatar className='h-12 w-12 rounded-full overflow-hidden'>
                  {
                    contact.image ?
                      (<AvatarImage src={`${HOST}/${contact.image}`} alt="avatar" className="object-cover w-full h-full bg-black rounded-full" />)
                      :
                      (
                        <div className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(contact.color)}`} >
                          {contact.firstName ? contact.firstName.split("").shift() : contact.email?.split("").shift()}
                        </div>
                      )
                  }
                </Avatar>
              )
            }
            {
              isChannel && (
                <div className='bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full'>#</div>
              )
            }
            {isChannel ? <span>{contact.name}</span> : <span>{contact.firstName ? `${contact.firstName}` : contact.email}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;
