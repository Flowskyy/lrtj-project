import UserViewContent from "./UserViewContent";

interface UserViewContentWrapperProps {
  userId: string;
}

export default function UserViewContentWrapper({ userId }: UserViewContentWrapperProps) {
  return <UserViewContent userId={userId} />;
}
