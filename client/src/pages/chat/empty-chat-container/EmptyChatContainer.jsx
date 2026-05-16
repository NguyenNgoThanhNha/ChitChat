import { animationDefaultOptions } from '@/lib/utils'
import React from 'react'
import Lottie from 'react-lottie'

const EmptyChatContainer = () => {
    return (
        <div className='flex-1 flex bg-chat-surface flex-col justify-center items-center transition-colors animate-chat-fade min-h-0'>
            <div className="animate-in zoom-in-95 duration-500">
                <Lottie isClickToPauseDisabled={true} height={200} width={200} options={animationDefaultOptions} />
            </div>
            <div className='text-foreground flex flex-col gap-4 items-center mt-8 lg:text-3xl text-2xl text-center px-6 animate-in slide-in-from-bottom-4 duration-500 delay-100'>
                <h3 className='poppins-medium'>
                    Hi <span className='text-purple-500'>!</span> Welcome to
                    <span className='text-purple-500'> Syncronus</span> Chat App
                    <span className='text-purple-500'>.</span>
                </h3>
            </div>
        </div>
    )
}

export default EmptyChatContainer
