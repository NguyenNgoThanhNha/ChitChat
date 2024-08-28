import MultipleSelector from '@/components/multipleselect'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { apiClient } from '@/lib/api.client'
import { useAppStore } from '@/store/store'
import { CREATE_CHANNEL_ROUTE, GET_ALL_CONTACT_ROUTE } from '@/utils/constant'
import React, { useEffect, useState } from 'react'
import { FaPlus } from 'react-icons/fa'
import { toast } from 'sonner'

const CreateChanel = () => {
    const { setSelectedChatType, setSelectedChatData, addChannel } = useAppStore();

    const [newChannelModal, setOpenNewChannelModal] = useState(false)
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([])
    const [chanelName, setChannelName] = useState("")

    useEffect(() => {
        const getData = async () => {
            const response = await apiClient.get(GET_ALL_CONTACT_ROUTE, { withCredentials: true })
            setAllContacts(response.data.contacts)
        };
        getData();
    }, [])

    const createChannel = async () => {
        try {
            if (chanelName.length > 0 && selectedContacts.length > 0) {
                const response = await apiClient.post(CREATE_CHANNEL_ROUTE, {
                    name: chanelName,
                    members: selectedContacts.map((contact) => contact.value)
                }, { withCredentials: true });
                if (response.status === 201) {
                    setChannelName("");
                    setSelectedContacts([]);
                    setOpenNewChannelModal(false);
                    addChannel(response.data.channel);
                    toast.success("Create new channel success");
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <FaPlus className='text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300'
                            onClick={() => setOpenNewChannelModal(true)}
                        />
                    </TooltipTrigger>
                    <TooltipContent className='bg-[#1c1b1e] border-none mb-2 p-3 text-white'>
                        Create New Channel
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Dialog open={newChannelModal} onOpenChange={setOpenNewChannelModal}>
                <DialogContent className='bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col rounded-md'>
                    <DialogHeader className='flex items-center'>
                        <DialogTitle>Please fill up the details for new Channel</DialogTitle>
                        <DialogDescription></DialogDescription>
                    </DialogHeader>
                    <div>
                        <Input placeholder="Channel Name" className='rounded-lg p-6 bg-[#2c2e3b] border-none' onChange={(e) => setChannelName(e.target.value)}
                            value={chanelName} />
                    </div>
                    <div>
                        <MultipleSelector className='rounded-lg bg-[#2c2e3b] border-none py-2 text-white'
                            defaultOptions={allContacts}
                            placeholder="Search Contacts"
                            value={selectedContacts}
                            onChange={setSelectedContacts}
                            emptyIndicator={
                                <p className='text-center text-lg leading-10 text-gray-600'>No result found</p>
                            }
                        />
                    </div>
                    <div>
                        <button className='w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300 p-2 rounded' onClick={createChannel}>Create Channel</button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default CreateChanel