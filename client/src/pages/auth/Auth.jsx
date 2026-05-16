import React, { useState } from 'react'
import Victory from "../../assets/victory.svg"
import Background from "../../assets/login2.png"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api.client';
import { setAuthToken } from '@/lib/authToken';
import { SIGNIN_ROUTE, SIGNUP_ROUTE } from '@/utils/constant';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/store';
import { cn } from '@/lib/utils';
import { HiOutlineSparkles, HiOutlineChatBubbleLeftRight, HiOutlineShieldCheck } from 'react-icons/hi2';

const BrandLogo = ({ className }) => (
    <div className={cn("flex items-center gap-2.5", className)}>
        <svg width="78" height="32" viewBox="0 0 78 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
            <path d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z" fill="#8338ec" />
            <path d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z" fill="#975aed" />
            <path d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z" fill="#a16ee8" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-foreground">Syncronus</span>
    </div>
);

const FEATURES = [
    { icon: HiOutlineChatBubbleLeftRight, text: "Real-time chat & voice" },
    { icon: HiOutlineShieldCheck, text: "Secure & private" },
    { icon: HiOutlineSparkles, text: "Shop, blog & more" },
];

const Auth = () => {
    const navigate = useNavigate();
    const { setUserInfo } = useAppStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setconfirmPassword] = useState("");
    const [signInClicked, setSignInClicked] = useState(false);
    const [signUpClicked, setSignUpClicked] = useState(false);
    const [activeTab, setActiveTab] = useState("sign_in");
    const [loading, setLoading] = useState(false);

    const validateSignUp = () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
        if (!email.length) { toast.error("Email is required"); return false; }
        if (!password.length) { toast.error("Password is required"); return false; }
        if (!passwordRegex.test(password)) {
            toast.error("Password must be at least 6 characters long, contain at least one uppercase letter, one special character, and one lowercase letter.");
            return false;
        }
        if (!confirmPassword.length) { toast.error("Confirm Password is required"); return false; }
        if (password !== confirmPassword) { toast.error("Password and Confirm Password must be the same"); return false; }
        return true;
    };

    const validateSignIn = () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
        if (!email.length) { toast.error("Email is required"); return false; }
        if (!password.length) { toast.error("Password is required"); return false; }
        if (!passwordRegex.test(password)) {
            toast.error("Password must be at least 6 characters long, contain at least one uppercase letter, one special character, and one lowercase letter.");
            return false;
        }
        return true;
    };

    const handleSignIn = async () => {
        setSignInClicked(true);
        if (!validateSignIn()) { setSignInClicked(false); return; }
        setLoading(true);
        try {
            const response = await apiClient.post(SIGNIN_ROUTE, { email, password }, { withCredentials: true });
            if (response.status === 200) {
                toast.success("Sign In Success!");
                if (response.data.token) setAuthToken(response.data.token);
                setUserInfo(response.data.user);
                navigate(response.data.user.profileSetup ? "/chat" : "/profile");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Sign In Failed");
        } finally {
            setSignInClicked(false);
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setSignUpClicked(true);
        if (!validateSignUp()) { setSignUpClicked(false); return; }
        setLoading(true);
        try {
            const response = await apiClient.post(SIGNUP_ROUTE, { email, password }, { withCredentials: true });
            if (response.status === 201) {
                toast.success("Sign Up Account Success!");
                if (response.data.token) setAuthToken(response.data.token);
                setUserInfo(response.data.user);
                navigate("/profile");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Sign Up Failed");
        } finally {
            setSignUpClicked(false);
            setLoading(false);
        }
    };

    const inputClass =
        "auth-field-in rounded-xl h-12 sm:h-14 px-5 bg-background/60 backdrop-blur-sm text-foreground border-border/80 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8417ff]/50 focus-visible:border-[#8417ff]/40 transition-all duration-300 hover:border-[#8417ff]/30";

    const fieldDelay = (i) => ({ animationDelay: `${0.12 + i * 0.08}s` });

    const renderFields = (mode) => {
        const clicked = mode === "sign_in" ? signInClicked : signUpClicked;
        const isSignUp = mode === "sign_up";

        return (
            <div key={mode} className="auth-tab-content-in flex flex-col gap-4 sm:gap-5 mt-6">
                <div style={fieldDelay(0)}>
                    <Input
                        placeholder="Email"
                        type="email"
                        className={inputClass}
                        style={fieldDelay(0)}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {clicked && !email.length && <span className="text-red-500 text-xs ml-2 mt-1 block">Email is required!</span>}
                </div>
                <div style={fieldDelay(1)}>
                    <Input
                        placeholder="Password"
                        type="password"
                        className={inputClass}
                        style={fieldDelay(1)}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {clicked && !password.length && <span className="text-red-500 text-xs ml-2 mt-1 block">Password is required!</span>}
                </div>
                {isSignUp && (
                    <div style={fieldDelay(2)}>
                        <Input
                            placeholder="Confirm Password"
                            type="password"
                            className={inputClass}
                            style={fieldDelay(2)}
                            value={confirmPassword}
                            onChange={(e) => setconfirmPassword(e.target.value)}
                        />
                        {clicked && !confirmPassword.length && (
                            <span className="text-red-500 text-xs ml-2 mt-1 block">Confirm Password is required!</span>
                        )}
                        {clicked && confirmPassword && confirmPassword !== password && (
                            <span className="text-red-500 text-xs ml-2 mt-1 block">Passwords must match</span>
                        )}
                    </div>
                )}
                <div style={fieldDelay(isSignUp ? 3 : 2)}>
                    <Button
                        disabled={loading}
                        className="auth-shimmer-btn w-full rounded-xl h-12 sm:h-14 text-base font-semibold bg-gradient-to-r from-[#8417ff] via-[#975aed] to-[#741bda] text-white shadow-lg shadow-[#8417ff]/25 hover:shadow-[#8417ff]/40 hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-70"
                        onClick={mode === "sign_in" ? handleSignIn : handleSignUp}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                {mode === "sign_in" ? "Signing in…" : "Creating account…"}
                            </span>
                        ) : (
                            mode === "sign_in" ? "Sign In" : "Create Account"
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto auth-bg-mesh flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <div className="auth-orb w-72 h-72 bg-[#8417ff]/30 top-[10%] left-[5%]" style={{ animationDelay: "0s" }} />
            <div className="auth-orb w-96 h-96 bg-[#975aed]/25 bottom-[5%] right-[10%]" style={{ animationDelay: "-3s" }} />
            <div className="auth-orb w-48 h-48 bg-violet-400/20 top-[50%] right-[30%]" style={{ animationDelay: "-5s" }} />

            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-14 items-center py-4">
                {/* Hero */}
                <div className="auth-hero-in flex flex-col items-center xl:items-start text-center xl:text-left gap-6 sm:gap-8">
                    <BrandLogo className="justify-center xl:justify-start" />

                    <div className="relative">
                        <span className="auth-pulse-ring absolute -inset-4 rounded-full bg-[#8417ff]/20" aria-hidden />
                        <div className="flex items-center justify-center xl:justify-start gap-3 flex-wrap">
                            <h1 className="auth-title-gradient text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                                Welcome back
                            </h1>
                            <img
                                src={Victory}
                                alt=""
                                className="auth-float h-14 sm:h-20 lg:h-24 drop-shadow-lg"
                            />
                        </div>
                    </div>

                    <p
                        className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed auth-field-in"
                        style={{ animationDelay: "0.2s" }}
                    >
                        Connect, chat, and collaborate — all in one beautiful workspace.
                    </p>

                    <ul className="flex flex-col gap-3 w-full max-w-sm">
                        {FEATURES.map(({ icon: Icon, text }, i) => (
                            <li
                                key={text}
                                className="auth-field-in flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm px-4 py-3 text-sm text-foreground/90"
                                style={{ animationDelay: `${0.35 + i * 0.1}s` }}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8417ff]/15 text-[#8417ff]">
                                    <Icon className="text-lg" />
                                </span>
                                {text}
                            </li>
                        ))}
                    </ul>

                    <div className="hidden xl:flex justify-center w-full auth-float-slow mt-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#8417ff]/25 to-transparent rounded-3xl blur-2xl scale-90" aria-hidden />
                            <img
                                src={Background}
                                alt=""
                                className="relative h-[320px] w-auto object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div className="auth-panel-in w-full max-w-md mx-auto xl:max-w-lg xl:mx-0">
                    <div className="auth-card-glow relative rounded-2xl sm:rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#8417ff]/20 blur-3xl" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#975aed]/15 blur-3xl" aria-hidden />

                        <div className="relative">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Get started</h2>
                            <p className="text-sm text-muted-foreground mb-6">Sign in or create your account</p>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-12 p-1 rounded-xl bg-muted/80 border border-border/50">
                                    <TabsTrigger
                                        value="sign_in"
                                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground font-medium transition-all duration-300"
                                    >
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sign_up"
                                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md text-muted-foreground font-medium transition-all duration-300"
                                    >
                                        Sign Up
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="sign_in" className="mt-0 focus-visible:outline-none">
                                    {activeTab === "sign_in" && renderFields("sign_in")}
                                </TabsContent>
                                <TabsContent value="sign_up" className="mt-0 focus-visible:outline-none">
                                    {activeTab === "sign_up" && renderFields("sign_up")}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center xl:hidden auth-float-slow">
                        <img
                            src={Background}
                            alt=""
                            className="h-[200px] sm:h-[260px] w-auto object-contain drop-shadow-xl opacity-90"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
