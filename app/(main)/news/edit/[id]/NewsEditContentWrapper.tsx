"use client";

import dynamic from "next/dynamic";

const NewsEditContent = dynamic(() => import("./NewsEditContent"), { ssr: false });

export default function NewsEditContentWrapper(props: any) {
  return <NewsEditContent {...props} />;
}
