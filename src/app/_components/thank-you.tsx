import Link from "next/link";
import ClientLayout from "~/components/layout/main-layout/client-layout";

function ThankYouPage() {
  return (
    <ClientLayout theme="white">
      <div className="container mx-auto flex min-h-screen items-center justify-center bg-[url('https://res.cloudinary.com/dagxeprfw/image/upload/v1696407542/talk-tales/home-page/gvzsgr5e5oq9dhv3diok.png')] bg-center bg-no-repeat px-2 md:justify-start md:px-0">
        <div className="w-[380px]g flex flex-col items-center md:items-start">
          <p className="max-w-2xl font-lato text-6xl font-bold leading-tight text-black">
            Thank You for submitting your details
          </p>
          <p className="my-8 max-w-[577px] font-lato text-xl text-[#5B5B5B]">
            We will contact you with the final amount and payment link.
          </p>
          <Link
            href="/"
            className="flex h-12 w-44 items-center justify-center rounded-md bg-[#E0097A] text-white hover:bg-[#E0097A]/80"
          >
            Home
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}

export default ThankYouPage;
