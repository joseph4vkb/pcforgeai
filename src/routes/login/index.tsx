import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import { Cpu, LogIn, ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation(
    trpc.login.mutationOptions()
  );

  const resendVerificationMutation = useMutation(
    trpc.requestVerificationEmail.mutationOptions()
  );

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      
      toast.success("Logged in successfully!");
      setAuth(result.token, result.email, result.role);
      
      // Navigate based on role
      if (result.role === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/account" });
      }
    } catch (error: any) {
      if (error.message?.includes("verify your email")) {
        setUnverifiedEmail(data.email);
        toast.error(error.message);
      } else {
        toast.error(error.message || "Failed to log in");
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    const promise = resendVerificationMutation.mutateAsync({
      email: unverifiedEmail,
    });

    toast.promise(promise, {
      loading: "Sending verification email...",
      success: "Verification email sent! Please check your inbox.",
      error: (err) => err.message || "Failed to send verification email",
    });

    try {
      await promise;
      setUnverifiedEmail(null);
    } catch (error) {
      console.error(error);
    }
  };

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
                <LogIn className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="mt-2 text-gray-400">
                Log in to access your saved builds
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {unverifiedEmail && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-200 mb-2">
                        Your email address is not verified. Please check your inbox for the verification link.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendVerificationMutation.isPending}
                        className="text-sm text-yellow-400 hover:text-yellow-300 font-medium underline"
                      >
                        {resendVerificationMutation.isPending ? "Sending..." : "Resend verification email"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/forgot-password" })}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                </div>
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

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loginMutation.isPending ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => navigate({ to: "/register" })}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
