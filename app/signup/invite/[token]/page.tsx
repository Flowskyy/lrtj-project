"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, XCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
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

    if (!otp || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
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

    if (!password || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordError("");
    setSigningUp(true);
    try {
      const res = await fetch(`/api/signup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully");
        // Set sessionStorage flag BEFORE redirect to ensure it's available
        // when the dashboard auth guard runs
        sessionStorage.setItem('tab_authenticated', 'true')
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setPasswordError(data.error || "Failed to create account");
      }
    } catch (err) {
      console.error("Error creating account:", err);
      setPasswordError("Failed to create account");
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 relative"
        style={{
          backgroundImage: 'url("/lrt-station.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="w-full max-w-sm relative z-10">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#E5262C]" />
                <p className="mt-4 text-gray-600">Validating invitation...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 relative"
        style={{
          backgroundImage: 'url("/lrt-station.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="w-full max-w-sm relative z-10">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
                <p className="text-gray-600 text-center">{error}</p>
                <Button
                  variant="outline"
                  className="mt-6 h-10"
                  onClick={() => router.push("/")}
                >
                  Go to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url("/lrt-station.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="w-full max-w-sm relative z-10">
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo-lrtj.png"
                alt="LRT Jakarta"
                width={200}
                height={65}
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Registration Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Registration</h2>
              {invitation && (
                <p className="text-sm text-gray-600">
                  Signing up as <span className="font-semibold">{invitation.email}</span>
                  {invitation.role && <span> • {invitation.role}</span>}
                </p>
              )}
            </div>

            {!otpVerified ? (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="otp" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Enter OTP Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    disabled={verifyingOtp}
                    className="h-9 text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-gray-500">
                    Enter the 4-digit code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium transition-colors disabled:opacity-50"
                  disabled={verifyingOtp || otp.length !== 4}
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
                  className="w-full h-8 text-xs"
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
              <form onSubmit={handleSignup} className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      disabled={signingUp}
                      className="h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={signingUp}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      disabled={signingUp}
                      className="h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={signingUp}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-500">{passwordError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium transition-colors disabled:opacity-50"
                  disabled={signingUp || !password || !confirmPassword}
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
    </div>
  );
}