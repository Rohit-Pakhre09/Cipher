import { useState } from "react";
import { useAuth } from "../authentication/useAuth";
import { Eye, EyeOff, Loader2, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

const UserSvg = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const MailSvg = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const LockSvg = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);


const signupSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignUpPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    const { signup, isSigningUp } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = (data) => {
        signup(data);
        toast.success("Account created successfully");
    };

    return (
        <section className="min-h-screen grid lg:grid-cols-2">

            {/* 1. Left Content */}
            <div className="flex flex-col justify-center items-center">
                <div className="w-full max-w-md space-y-6">

                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center gap-2 group">
                            <div
                                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
                            >
                                <MessageSquare className="size-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-2">Create Account</h1>
                            <p className="text-base-content/60">Get started with your free account</p>
                        </div>
                    </div>

                    {/* Sign Up Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Full Name</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserSvg className="size-5 text-base-content/40 z-50" />
                                </div>
                                <input
                                    type="text"
                                    className={`input input-bordered w-full pl-10 ${errors.fullName ? "input-error" : ""}`}
                                    placeholder="John Doe"
                                    {...register("fullName")}
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                        </div>

                        {/* Email Field */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Email</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MailSvg className="size-5 text-base-content/40 z-50" />
                                </div>
                                <input
                                    type="email"
                                    className={`input input-bordered w-full pl-10 ${errors.email ? "input-error" : ""}`}
                                    placeholder="you@example.com"
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password Field */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Password</span>
                            </label>
                            <div className="relative">
                                {/* SVG ICON WRAPPER: ADDED inset-y-0 */}
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockSvg className="size-5 text-base-content/40 z-50" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`input input-bordered w-full pl-10 ${errors.password ? "input-error" : ""}`}
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5 text-base-content/40" />
                                    ) : (
                                        <Eye className="size-5 text-base-content/40" />
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="btn btn-primary w-full mt-8" disabled={isSigningUp}>
                            {isSigningUp ? (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-base-content/60">
                            Already have an account?{" "}
                            <Link to="/login" className="link link-primary">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Right Content: AuthImagePattern Component */}
            <AuthImagePattern
                title="Chat on Cipher"
                subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
            />

        </section>
    )
}

export default SignUpPage