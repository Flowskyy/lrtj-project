import RedeemViewContent from "./RedeemViewContent";

interface RedeemViewContentWrapperProps {
  redeemId: string;
}

export default function RedeemViewContentWrapper({ redeemId }: RedeemViewContentWrapperProps) {
  return <RedeemViewContent redeemId={redeemId} />;
}
