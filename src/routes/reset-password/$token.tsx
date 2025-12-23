import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Cpu, Lock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

export const Route = createFileRoute("/reset-password/$token")({
  component: ResetPasswordPage,
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation(
    trpc.resetPassword.mutationOptions()
  );

  const onSubmit = async (data: ResetPasswordForm) => {
    const promise = resetPasswordMutation.mutateAsync({
      token,
      password: data.password,
    });

    toast.promise(promise, {
      loading: "Resetting password...",
      success: "Password reset successfully!",
      error: (err) => err.message || "Failed to reset password",
    });

    try {
      await promise;
      setResetSuccess(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Cpu className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">PC Builder</span>
              </div>
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
                  Password Reset Complete!
                </h1>
                <p className="text-gray-400 mb-6">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Login
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
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">PC Builder</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-md border border-white/20">
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex rounded-full bg-blue-500/20 p-4">
                <Lock className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Reset Password</h1>
              <p className="mt-2 text-gray-400">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  New Password
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
                  Confirm New Password
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
                disabled={resetPasswordMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
