import { useUser as useClerkUser, useSession } from "@clerk/nextjs";

type PublicUserData = {
  identifier: string;
  id: string;
};

interface UseUserReturn {
  user: ReturnType<typeof useClerkUser>["user"];
  session: ReturnType<typeof useSession>["session"];
  isLoaded: boolean;
  isSuperUser: boolean;
  isImpersonating: boolean;
  impersonatedUser: PublicUserData | null;
  isAgencyUser: boolean;
  isDealManager: boolean;
}

export function useUser(): UseUserReturn {
  const { user, isLoaded } = useClerkUser();
  const { session, isLoaded: isSessionLoaded } = useSession();

  // check if user is superuser either directly or via impersonation
  const isSuperUser = Boolean(user?.publicMetadata?.isSuperUser || session?.actor?.sub);
  const isDealManager = Boolean(user?.publicMetadata?.isDealManager);
  const isImpersonating = Boolean(session?.actor?.sub);
  const isAgencyUser = Boolean(user?.publicMetadata?.isAgencyUser);

  const impersonatedUser = session?.actor?.sub
    ? {
        identifier: session?.publicUserData?.identifier,
        id: session?.id,
      }
    : null;

  return {
    user,
    session,
    isLoaded: isLoaded && isSessionLoaded,
    isSuperUser,
    isImpersonating,
    impersonatedUser,
    isAgencyUser,
    isDealManager,
  };
}
