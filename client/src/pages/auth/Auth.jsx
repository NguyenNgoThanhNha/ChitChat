import React, { useState } from 'react'
import Victory from "../../assets/victory.svg"
import Background from "../../assets/login2.png"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api.client';
import { SIGNIN_ROUTE, SIGNUP_ROUTE } from '@/utils/constant';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/store';
const Auth = () => {
    const navigate = useNavigate();
    const { setUserInfo } = useAppStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setconfirmPassword] = useState("");
    const [signInClicked, setSignInClicked] = useState(false);
    const [signUpClicked, setSignUpClicked] = useState(false);

    const validateSignUp = () => {
        if (!email.length) {
            toast.error("Email is required")
            return false
        }
        if (!password.length) {
            toast.error("Password is required")
            return false
        }
        if (!confirmPassword.length) {
            toast.error("Confirm Password is required")
            return false
        }
        if (password !== confirmPassword) {
            toast.error("Password and Confirm Password must be same")
        }
        return true
    }

    const validateSignIn = () => {
        if (!email.length) {
            toast.error("Email is required")
            return false
        }
        if (!password.length) {
            toast.error("Password is required")
            return false
        }
        return true
    }

    const handleSignIn = async () => {
        setSignInClicked(true);
        if (validateSignIn()) {
            try {
                const response = await apiClient.post(SIGNIN_ROUTE, { email, password }, { withCredentials: true });
                if (response.status === 200) {
                    toast.success("Sign In Success!");
                    setUserInfo(response.data.user) // set user info to zustand
                    if (response.data.user.profileSetup) {
                        navigate("/chat");
                    } else {
                        navigate("/profile");
                    }
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Sign In Failed");
            } finally {
                setSignInClicked(false);
            }
        } else {
            setSignInClicked(false);
        }
    };

    const handleSignUp = async () => {
        setSignUpClicked(true);
        if (validateSignUp()) {
            try {
                const response = await apiClient.post(SIGNUP_ROUTE, { email, password }, { withCredentials: true });
                if (response.status === 201) {
                    toast.success("Sign Up Account Success!");
                    setUserInfo(response.data.user) // set user info to zustand
                    navigate("/profile");
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Sign Up Failed");
            } finally {
                setSignUpClicked(false);
            }
        } else {
            setSignUpClicked(false);
        }
    };

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
                            <div>
                                <Input placeholder="Email" type="email" className="rounded-full p-6" value={email} onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSignIn();
                                        }
                                    }} />
                                {signInClicked && !email.length && <span className='text-red-500 ml-2'>Email is required!</span>}
                            </div>
                            <div>
                                <Input placeholder="Password" type="password" className="rounded-full p-6" value={password} onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSignIn();
                                        }
                                    }} />
                                {signInClicked && !password.length && <span className='text-red-500 ml-2'>Password is required!</span>}
                            </div>
                            <Button className="rounded-full p-6" onClick={handleSignIn}>Sign In</Button>
                        </TabsContent>
                        <TabsContent className="flex flex-col gap-5" value="sign_up">
                            <div>
                                <Input placeholder="Email" type="email" className="rounded-full p-6" value={email} onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSignUp();
                                        }
                                    }} />
                                {signUpClicked && !email.length && <span className='text-red-500 ml-2'>Email is required!</span>}
                            </div>
                            <div>
                                <Input placeholder="Password" type="password" className="rounded-full p-6" value={password} onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSignUp();
                                        }
                                    }} />
                                {signUpClicked && !password.length && <span className='text-red-500 ml-2'>Password is required!</span>}
                            </div>
                            <div>
                                <Input placeholder="Confirm Password" type="password" className="rounded-full p-6" value={confirmPassword} onChange={(e) => setconfirmPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSignUp();
                                        }
                                    }} />
                                {signUpClicked && !confirmPassword.length && <span className='text-red-500 ml-2'>Confirm Password is required!</span>}
                                {signUpClicked && confirmPassword !== password && <span className='text-red-500 ml-2'>Password and Confirm Password must be same</span>}
                            </div>
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