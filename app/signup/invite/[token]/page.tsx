"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail, Lock, User } from "lucide-react";

export default function InviteSignupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // Validate invitation on load
  useEffect(() => {
    validateInvitation();
  }, [token]);

  // OTP resend timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  const validateInvitation = async () => {
    try {
      const res = await fetch(`/api/signup/invite/${token}`);
      const data = await res.json();

      if (res.ok) {
        setInvitation(data);
        setOtpResendTimer(60); // 1 minute cooldown for resend
      } else {
        setError(data.error || "Invalid invitation");
      }
    } catch (err) {
      console.error("Error validating invitation:", err);
      setError("Failed to validate invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`/api/signup/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP verified successfully");
        setOtpVerified(true);
      } else {
        toast.error(data.error || "Invalid OTP");
        if (data.attemptsRemaining !== undefined) {
          toast.error(`${data.attemptsRemaining} attempts remaining`);
        }
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      toast.error("Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return;

    setResendingOtp(true);
    try {
      const res = await fetch(`/api/signup/invite/${token}`);
      const data = await res.json();

      if (res.ok) {
        toast.success("New OTP sent to your email");
        setOtp("");
        setOtpResendTimer(60);
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      toast.error("Failed to resend OTP");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSigningUp(true);
    try {
      const res = await fetch(`/api/signup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully");
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch (err) {
      console.error("Error creating account:", err);
      toast.error("Failed to create account");
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#E5262C]" />
            <p className="mt-4 text-gray-600">Validating invitation...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 text-center">{error}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => router.push("/")}
            >
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#E5262C] rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
          <CardDescription>
            {invitation && (
              <span>
                Signing up as <span className="font-semibold">{invitation.email}</span>
                {invitation.role && <span> • {invitation.role}</span>}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpVerified ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Enter OTP Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={verifyingOtp}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#E5262C] hover:bg-[#c41f24] text-white"
                disabled={verifyingOtp || otp.length !== 6}
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendOtp}
                disabled={resendingOtp || otpResendTimer > 0}
              >
                {resendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : otpResendTimer > 0 ? (
                  `Resend OTP in ${otpResendTimer}s`
                ) : (
                  "Resend OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email verified! Please set your password to complete registration.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={signingUp}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={signingUp}
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={signingUp}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#E5262C] hover:bg-[#c41f24] text-white"
                disabled={signingUp || !username || !password || !confirmPassword}
              >
                {signingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
