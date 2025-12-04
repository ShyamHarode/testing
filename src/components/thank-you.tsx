import Link from "next/link";
import ClientLayout from "~/components/layout/main-layout/client-layout";

function ThankYouPage() {
  return (
    <ClientLayout theme="white">
      <div className="container max-w-[1440px] mx-auto flex min-h-screen items-center justify-center bg-[url('/thankyou.webp')] bg-center bg-no-repeat px-2 md:justify-start md:px-0">
        <div className="w-[380px]g flex flex-col items-center md:items-start">
          <p className="max-w-2xl font-lato text-6xl font-bold leading-tight text-black">
            Thank You for submitting your Event
          </p>
        </div>
      </div>
    </ClientLayout>
  );
}

export default ThankYouPage;
