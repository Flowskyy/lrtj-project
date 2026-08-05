import DailyBenefitViewContent from "./DailyBenefitViewContent";

interface DailyBenefitViewContentWrapperProps {
  dailyBenefitId: string;
}

export default function DailyBenefitViewContentWrapper({ dailyBenefitId }: DailyBenefitViewContentWrapperProps) {
  return <DailyBenefitViewContent dailyBenefitId={dailyBenefitId} />;
}
