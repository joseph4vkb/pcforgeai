import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Cpu, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/forgot-password/")({
  component: ForgotPasswordPage,
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation(
    trpc.forgotPassword.mutationOptions()
  );

  const onSubmit = async (data: ForgotPasswordForm) => {
    const promise = forgotPasswordMutation.mutateAsync({
      email: data.email,
    });

    toast.promise(promise, {
      loading: "Sending reset link...",
      success: "Password reset link sent!",
      error: (err) => err.message || "Failed to send reset link",
    });

    try {
      await promise;
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (submitted) {
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
                  <Mail className="h-12 w-12 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Check Your Email
                </h1>
                <p className="text-gray-400 mb-6">
                  If an account exists with this email, we've sent you a password reset link. Please check your inbox.
                </p>
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex items-center gap-2 text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Login</span>
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
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
              <p className="mt-2 text-gray-400">
                Enter your email and we'll send you a reset link
              </p>
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

              <button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Remember your password?{" "}
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
