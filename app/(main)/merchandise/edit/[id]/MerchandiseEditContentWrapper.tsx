"use client";

import dynamic from "next/dynamic";

const MerchandiseEditContent = dynamic(() => import("./MerchandiseEditContent"), { ssr: false });

export default function MerchandiseEditContentWrapper(props: any) {
  return <MerchandiseEditContent {...props} />;
}
