import MerchandiseViewContent from "./MerchandiseViewContent";

interface MerchandiseViewContentWrapperProps {
  merchandiseId: string;
}

export default function MerchandiseViewContentWrapper({ merchandiseId }: MerchandiseViewContentWrapperProps) {
  return <MerchandiseViewContent merchandiseId={merchandiseId} />;
}
