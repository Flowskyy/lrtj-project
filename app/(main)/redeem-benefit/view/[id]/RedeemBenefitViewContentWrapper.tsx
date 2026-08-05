import RedeemBenefitViewContent from "./RedeemBenefitViewContent";

interface RedeemBenefitViewContentWrapperProps {
  redeemBenefitId: string;
}

export default function RedeemBenefitViewContentWrapper({ redeemBenefitId }: RedeemBenefitViewContentWrapperProps) {
  return <RedeemBenefitViewContent redeemBenefitId={redeemBenefitId} />;
}