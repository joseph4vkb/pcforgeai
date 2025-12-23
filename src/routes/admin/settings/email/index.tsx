import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/useAuthStore";
import {
  Mail,
  Save,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/settings/email/")({
  component: EmailSettingsPage,
});

interface SmtpForm {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
}

interface TestEmailForm {
  testEmail: string;
}

function EmailSettingsPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [testEmailSent, setTestEmailSent] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/admin/login" });
    }
  }, [token, navigate]);

  const configQuery = useQuery(
    trpc.getAdminConfig.queryOptions(
      { authToken: token || "" },
      { enabled: !!token }
    )
  );

  const updateConfigMutation = useMutation(
    trpc.updateAdminConfig.mutationOptions()
  );

  const sendTestEmailMutation = useMutation(
    trpc.sendTestEmail.mutationOptions()
  );

  const {
    register: registerSmtp,
    handleSubmit: handleSubmitSmtp,
    reset: resetSmtp,
    formState: { errors: smtpErrors },
  } = useForm<SmtpForm>();

  const {
    register: registerTestEmail,
    handleSubmit: handleSubmitTestEmail,
    formState: { errors: testEmailErrors },
  } = useForm<TestEmailForm>();

  useEffect(() => {
    if (configQuery.data) {
      resetSmtp({
        smtpHost: configQuery.data.smtpHost || "",
        smtpPort: configQuery.data.smtpPort || 587,
        smtpUser: configQuery.data.smtpUser || "",
        smtpPassword: configQuery.data.smtpPassword || "",
        smtpSecure: configQuery.data.smtpSecure ?? true,
      });
    }
  }, [configQuery.data, resetSmtp]);

  const onSubmitSmtp = async (data: SmtpForm) => {
    const promise = updateConfigMutation.mutateAsync({
      authToken: token || "",
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUser: data.smtpUser,
      smtpPassword: data.smtpPassword,
      smtpSecure: data.smtpSecure,
    });

    toast.promise(promise, {
      loading: "Updating SMTP configuration...",
      success: "SMTP configuration updated successfully!",
      error: "Failed to update SMTP configuration",
    });

    try {
      await promise;
      queryClient.invalidateQueries({
        queryKey: trpc.getAdminConfig.queryKey(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmitTestEmail = async (data: TestEmailForm) => {
    setTestEmailSent(false);
    const promise = sendTestEmailMutation.mutateAsync({
      authToken: token || "",
      testEmail: data.testEmail,
    });

    toast.promise(promise, {
      loading: "Sending test email...",
      success: (result) => result.message,
      error: (err: any) => err.message || "Failed to send test email",
    });

    try {
      await promise;
      setTestEmailSent(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/admin/dashboard" })}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                Email Settings
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 rounded-2xl bg-white/10 p-6 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white">
            SMTP Configuration
          </h2>
          <p className="mt-2 text-gray-400">
            Configure email settings for sending notifications, verification
            emails, and password reset links from the platform.
          </p>
        </div>

        {configQuery.isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        )}

        {configQuery.data && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* SMTP Configuration Form */}
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Mail className="h-6 w-6 text-blue-400" />
                  SMTP Server Settings
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Configure your SMTP server credentials to enable email
                  functionality.
                </p>
              </div>

              <form
                onSubmit={handleSubmitSmtp(onSubmitSmtp)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      {...registerSmtp("smtpHost", {
                        required: "SMTP Host is required",
                      })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="smtp.gmail.com"
                    />
                    {smtpErrors.smtpHost && (
                      <p className="mt-1 text-sm text-red-400">
                        {smtpErrors.smtpHost.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      {...registerSmtp("smtpPort", {
                        required: "SMTP Port is required",
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      placeholder="587"
                    />
                    {smtpErrors.smtpPort && (
                      <p className="mt-1 text-sm text-red-400">
                        {smtpErrors.smtpPort.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SMTP User (Email)
                  </label>
                  <input
                    type="email"
                    {...registerSmtp("smtpUser", {
                      required: "SMTP User is required",
                    })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="your-email@example.com"
                  />
                  {smtpErrors.smtpUser && (
                    <p className="mt-1 text-sm text-red-400">
                      {smtpErrors.smtpUser.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    {...registerSmtp("smtpPassword", {
                      required: "SMTP Password is required",
                    })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    placeholder="••••••••"
                  />
                  {smtpErrors.smtpPassword && (
                    <p className="mt-1 text-sm text-red-400">
                      {smtpErrors.smtpPassword.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    For Gmail, use an App Password instead of your regular
                    password.
                  </p>
                </div>

                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-300">
                        Port & Security Settings
                      </p>
                      <p className="mt-1 text-sm text-yellow-400/80">
                        <strong>Port 587:</strong> Uses STARTTLS (recommended). Leave "Use TLS/SSL" checked or unchecked - it will automatically use STARTTLS.
                      </p>
                      <p className="mt-1 text-sm text-yellow-400/80">
                        <strong>Port 465:</strong> Uses implicit TLS. Check "Use TLS/SSL" for this port.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    {...registerSmtp("smtpSecure")}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-400/50"
                  />
                  <label htmlFor="smtpSecure" className="text-sm text-gray-300">
                    Use TLS/SSL (Check for port 465, optional for port 587)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition hover:shadow-xl hover:shadow-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save SMTP Configuration
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Test Email Section */}
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Send className="h-6 w-6 text-green-400" />
                  Test Email Configuration
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  Send a test email to verify your SMTP configuration is
                  working correctly.
                </p>
              </div>

              <form
                onSubmit={handleSubmitTestEmail(onSubmitTestEmail)}
                className="space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    {...registerTestEmail("testEmail", {
                      required: "Email address is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    placeholder="test@example.com"
                  />
                  {testEmailErrors.testEmail && (
                    <p className="mt-1 text-sm text-red-400">
                      {testEmailErrors.testEmail.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    A test email will be sent to this address to verify your
                    SMTP settings.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendTestEmailMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-green-500/50 transition hover:shadow-xl hover:shadow-green-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendTestEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending Test Email...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Test Email
                    </>
                  )}
                </button>
              </form>

              {/* Success/Info Messages */}
              {testEmailSent && (
                <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-300">
                        Test email sent successfully!
                      </p>
                      <p className="mt-1 text-sm text-green-400/80">
                        Check the recipient's inbox to confirm delivery. If the
                        email doesn't arrive, verify your SMTP settings and try
                        again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-300">
                      Common SMTP Providers
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-400/80">
                      <li>
                        <strong>Gmail:</strong> smtp.gmail.com:587 (Use App
                        Password)
                      </li>
                      <li>
                        <strong>Zoho:</strong> smtp.zoho.com:587 (STARTTLS)
                      </li>
                      <li>
                        <strong>Outlook:</strong> smtp-mail.outlook.com:587
                      </li>
                      <li>
                        <strong>SendGrid:</strong> smtp.sendgrid.net:587
                      </li>
                      <li>
                        <strong>Mailgun:</strong> smtp.mailgun.org:587
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-blue-400/70">
                      Most modern providers use port 587 with STARTTLS. Port 465 with implicit TLS is less common but still supported.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
