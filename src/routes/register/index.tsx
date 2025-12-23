import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Cpu, UserPlus, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/register/")({
  component: RegisterPage,
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation(
    trpc.registerUser.mutationOptions()
  );

  const resendVerificationMutation = useMutation(
    trpc.requestVerificationEmail.mutationOptions()
  );

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      
      toast.success(result.message);
      setRegisteredEmail(data.email);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;

    const promise = resendVerificationMutation.mutateAsync({
      email: registeredEmail,
    });

    toast.promise(promise, {
      loading: "Sending verification email...",
      success: "Verification email sent! Please check your inbox.",
      error: (err) => err.message || "Failed to send verification email",
    });

    try {
      await promise;
    } catch (error) {
      console.error(error);
    }
  };

  // Show success message after registration
  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <button
                onClick={() => navigate({ to: "/" })}
                className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
              >
                <Cpu className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  pcforgeai
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
              <div className="text-center">
                <div className="mb-4 inline-flex rounded-full bg-green-500/20 p-4">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Registration Successful!
                </h1>
                <p className="text-gray-400 mb-4">
                  We've sent a verification email to:
                </p>
                <p className="text-blue-400 font-medium mb-6">
                  {registeredEmail}
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Please check your inbox and click the verification link to activate your account.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Go to Login
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendVerificationMutation.isPending}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {resendVerificationMutation.isPending ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2 cursor-pointer transition hover:opacity-80"
            >
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                pcforgeai
              </span>
            </button>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex rounded-full bg-blue-500/20 p-4">
                <UserPlus className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="mt-2 text-gray-400">
                Join us to save and share your PC builds
              </p>
            </div>

            <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-200">
                  You'll need to verify your email address before you can log in
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate({ to: "/login" })}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
