"use client";

import dynamic from "next/dynamic";

const DailyBenefitEditContent = dynamic(() => import("./DailyBenefitEditContent"), { ssr: false });

export default function DailyBenefitEditContentWrapper(props: any) {
  return <DailyBenefitEditContent {...props} />;
}
