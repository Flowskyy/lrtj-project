import NewsViewContent from "./NewsViewContent";

interface NewsViewContentWrapperProps {
  newsId: string;
}

export default function NewsViewContentWrapper({ newsId }: NewsViewContentWrapperProps) {
  return <NewsViewContent newsId={newsId} />;
}
