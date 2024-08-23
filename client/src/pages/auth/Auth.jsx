import React, { useState } from 'react'
import Victory from "../../assets/victory.svg"
import Background from "../../assets/login2.png"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [conformPassword, setConformPassword] = useState("");

    const handleSignIn = () => {
        console.log("email: ", email)
    }

    const handleSignUp = () => {

    }
    return (
        <div className='h-[100vh] w-[100vw] flex items-center justify-center'>
            <div className='h-[80vh] w-[80vw] bg-white border-2 border-white text-opacity-90 shadow-2xl md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl grid xl:grid-cols-2'>
                <div className='flex flex-col gap-10 items-center justify-center'>
                    <div className='flex items-center justify-center'>
                        <h1 className='text-5xl font-bold md:text-6xl'>Welcome</h1>
                        <img src={Victory} alt='Victory Emoji' className='h-[100px]' />
                    </div>
                    <p className='font-medium text-center'>
                        Fill in the details to get started with the best app!
                    </p>
                </div>
                <div className='flex items-center justify-center w-full'>
                    <Tabs className='w-3/4' defaultValue="sign_in">
                        <TabsList className="bg-transparent rounded-none w-full">
                            <TabsTrigger className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300" value="sign_in">Sign In</TabsTrigger>
                            <TabsTrigger className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300" value="sign_up">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent className="flex flex-col gap-5 mt-8" value="sign_in">
                            <Input placeholder="Email" type="email" className="rounded-full p-6" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <Input placeholder="Password" type="password" className="rounded-full p-6" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Button className="rounded-full p-6" onClick={handleSignIn}>Sign In</Button>
                        </TabsContent>
                        <TabsContent className="flex flex-col gap-5" value="sign_up">
                            <Input placeholder="Email" type="email" className="rounded-full p-6" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <Input placeholder="Password" type="password" className="rounded-full p-6" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Input placeholder="Confirm Password" type="password" className="rounded-full p-6" value={conformPassword} onChange={(e) => setConformPassword(e.target.value)} />
                            <Button className="rounded-full p-6" onClick={handleSignUp}>Sign Up</Button>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <div className='hidden xl:flex justify-center items-center'>
                <img src={Background} alt='background sign in' className='h-[700px]' />
            </div>
        </div>
    )
}

export default Auth