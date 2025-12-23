import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useEffect, useState } from "react";
import { Cpu, CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/verify-email/$token")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyEmailMutation = useMutation(
    trpc.verifyEmail.mutationOptions()
  );

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const result = await verifyEmailMutation.mutateAsync({ token });
        setVerificationStatus("success");
        toast.success(result.message);
      } catch (error: any) {
        setVerificationStatus("error");
        setErrorMessage(error.message || "Failed to verify email");
        toast.error(error.message || "Failed to verify email");
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
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
              {verificationStatus === "loading" && (
                <>
                  <div className="mb-4 inline-flex rounded-full bg-blue-500/20 p-4">
                    <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Verifying Your Email
                  </h1>
                  <p className="text-gray-400">
                    Please wait while we verify your email address...
                  </p>
                </>
              )}

              {verificationStatus === "success" && (
                <>
                  <div className="mb-4 inline-flex rounded-full bg-green-500/20 p-4">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Email Verified!
                  </h1>
                  <p className="text-gray-400 mb-6">
                    Your email has been successfully verified. You can now log in to your account.
                  </p>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Go to Login
                  </button>
                </>
              )}

              {verificationStatus === "error" && (
                <>
                  <div className="mb-4 inline-flex rounded-full bg-red-500/20 p-4">
                    <XCircle className="h-12 w-12 text-red-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Verification Failed
                  </h1>
                  <p className="text-gray-400 mb-6">
                    {errorMessage}
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate({ to: "/login" })}
                      className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Go to Login
                    </button>
                    <button
                      onClick={() => navigate({ to: "/register" })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Back to Register
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
