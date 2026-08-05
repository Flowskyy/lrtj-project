"use client";

import DailyBenefitViewContent from "./DailyBenefitViewContent";

interface DailyBenefitViewContentWrapperProps {
  username: string;
  userEmail: string | null;
  dailyBenefitId: string;
}

export default function DailyBenefitViewContentWrapper({
  username,
  userEmail,
  dailyBenefitId,
}: DailyBenefitViewContentWrapperProps) {
  return (
    <DailyBenefitViewContent
      username={username}
      userEmail={userEmail}
      dailyBenefitId={dailyBenefitId}
    />
  );
}
