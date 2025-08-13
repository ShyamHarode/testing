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
          <p className="my-8 max-w-[577px] font-lato text-xl text-[#5B5B5B]">
          Your date and time have been blocked off. A TalkTales account manager will reach out to finalize your event details 
          </p>
          <Link
            href="/"
            className="flex h-12 w-44 items-center gap-2 justify-center rounded-md bg-[#E0097A] text-white hover:bg-[#E0097A]/80"
          >    <span className="text-[20px] leading-[150%] font-[400] font-lato not-italic text-white">Home</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 8H15" stroke="#F7F8FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 1L15 8L8 15" stroke="#F7F8FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        
          </Link>
  
        </div>
      </div>
    </ClientLayout>
  );
}

export default ThankYouPage;
