/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import React from "react";

export default function Footer({ theme }: { theme?: string }) {
  const data = [
    {
      title: `About Us`,
      href: "/about-us",
      subNav: [
        // {
        //   title: `Blog`,
        //   href: "https://talktalesentertainment.com/blog/",
        // },
        {
          title: `Career`,
          href: "/career",
        },
        {
          title: `Contact Us`,
          href: "/contact-us/",
        },
      ],
    },
    // {
    //   title: `Shop`,
    //   href: "https://talktalesentertainment.com/shop/",
    //   subNav: [
    //     {
    //       title: `Checkout`,
    //       href: `https://talktalesentertainment.com/checkout/`,
    //     },
    //     {
    //       title: `My Account`,
    //       href: `https://talktalesentertainment.com/my-account/`,
    //     },
    //     {
    //       title: `Shipping Addresses`,
    //       href: `https://talktalesentertainment.com/checkout/shipping-addresses/`,
    //     },
    //   ],
    // },
    // {
    //   title: `Corporate Events`,
    //   href: "https://talktalesentertainment.com/events/",
    //   subNav: [
    //     {
    //       title: `Kits`,
    //       href: "https://talktalesentertainment.com/craft-cocktail-kits/",
    //     },
    //     {
    //       title: `Classes`,
    //       href: "https://talktalesentertainment.com/virtual-cocktail-classes/",
    //     },
    //   ],
    // },
    {
      title: `CLASSES`,
      href: "/classes/",
      subNav: [
        // {
        //   title: `Privacy Policy`,
        //   href: "https://talktalesentertainment.com/privacy/",
        // },
        // {
        //   title: `Sitemap`,
        //   href: "https://talktalesentertainment.com/sitemap/",
        // },
      ],
    },
    {
      title: `PARTNERSHIPS`,
      href: "/brand-partnerships/",
      subNav: [
      
      ],
    },
    {
      title: `Cocktail Recipes`,
      href: "/cocktail-recipes/",
      subNav: [
      
      ],
    },
    {
      title: `Contact Us`,
      href: "/contact-us/",
      subNav: [
      
      ],
    },
    // {
    //   title: `Terms and Conditions`,
    //   href: "/terms-and-conditions/",
    //   subNav: [
    //     // {
    //     //   title: `Privacy Policy`,
    //     //   href: "https://talktalesentertainment.com/privacy/",
    //     // },
    //     // {
    //     //   title: `Sitemap`,
    //     //   href: "https://talktalesentertainment.com/sitemap/",
    //     // },
    //   ],
    // },
  ];
  return (
    <div
      className={`${
        theme === "white"
          ? "bg-[#40BAC8] "
          : "bg-[#222038] pt-4 sm:pt-10 lg:pt-12"
      }`}
    >
      <footer className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 pt-10 text-center md:grid-cols-2 lg:grid-cols-7 lg:gap-8 lg:pt-12 lg:text-left">
          <div className="col-span-full lg:col-span-2">
            <div className="mb-4 lg:-mt-2">
              <Link
                href="/"
                className="text-black-800 inline-flex items-center gap-2 text-xl font-bold md:text-2xl"
                aria-label="logo"
                target="_blank"
                rel="noreferrer"
              >
                <img src="/logo.png" alt="logo" width={100} />
              </Link>
            </div>

            <a href="tel:8312950829" className="block">
              <span className="font-OswaldRegular w-full pr-2 text-base">
                Phone:
              </span>
              +1 (831) 295-0829
            </a>

            <a
              className="font-LatoRegular text-sm"
              href="mailto:CONTACT@TALKTALESENTERTAINMENT.COM"
            >
              <span className="font-OswaldRegular pr-2 text-base">Email:</span>
              <span className="text-xs md:text-base">
                contact@talktalesentertainment.com
              </span>
            </a>
            <div className="flex flex-row gap-2 mt-4 justify-center items-center lg:justify-start">
              <a href="https://www.instagram.com/talktalesentertainment/" target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
  <path d="M24 12.7314C24 6.10332 18.6281 0.731445 12 0.731445C5.37188 0.731445 0 6.10332 0 12.7314C0 19.3596 5.37188 24.7314 12 24.7314C12.0703 24.7314 12.1406 24.7314 12.2109 24.7268V15.3893H9.63281V12.3846H12.2109V10.1721C12.2109 7.60801 13.7766 6.21113 16.0641 6.21113C17.1609 6.21113 18.1031 6.29082 18.375 6.32832V9.00957H16.8C15.5578 9.00957 15.3141 9.60019 15.3141 10.4674V12.3799H18.2906L17.9016 15.3846H15.3141V24.2674C20.3297 22.8283 24 18.2111 24 12.7314Z" fill="white"/>
</svg></a>
              <a href="https://www.instagram.com/talktalesentertainment/" target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
  <path d="M22.6288 8.342C22.6169 7.44224 22.4484 6.55142 22.1311 5.70939C21.8559 4.99915 21.4355 4.35412 20.8969 3.81552C20.3583 3.27692 19.7133 2.85659 19.0031 2.58139C18.1719 2.26937 17.2937 2.10066 16.4061 2.08243C15.2632 2.03135 14.9009 2.01709 11.9998 2.01709C9.09871 2.01709 8.72687 2.01709 7.59233 2.08243C6.70508 2.10079 5.82737 2.2695 4.99655 2.58139C4.28619 2.8564 3.64107 3.27666 3.10244 3.81529C2.56382 4.35391 2.14355 4.99904 1.86854 5.70939C1.5559 6.53996 1.38755 7.41787 1.37077 8.30517C1.31969 9.44922 1.30424 9.81156 1.30424 12.7127C1.30424 15.6137 1.30424 15.9844 1.37077 17.1201C1.38859 18.0088 1.5561 18.8855 1.86854 19.7183C2.14402 20.4284 2.56459 21.0733 3.10339 21.6117C3.6422 22.1501 4.28739 22.5702 4.99774 22.8451C5.82629 23.1697 6.70415 23.3505 7.59352 23.3797C8.73756 23.4308 9.0999 23.4462 12.001 23.4462C14.9021 23.4462 15.2739 23.4462 16.4085 23.3797C17.2961 23.3622 18.1743 23.1939 19.0054 22.8819C19.7155 22.6064 20.3604 22.186 20.8989 21.6474C21.4375 21.1089 21.8579 20.464 22.1334 19.7539C22.4459 18.9223 22.6134 18.0456 22.6312 17.1558C22.6823 16.0129 22.6977 15.6506 22.6977 12.7483C22.6954 9.8472 22.6954 9.47892 22.6288 8.342ZM11.9927 18.1988C8.95853 18.1988 6.50056 15.7409 6.50056 12.7067C6.50056 9.67256 8.95853 7.21459 11.9927 7.21459C13.4493 7.21459 14.8462 7.79322 15.8762 8.8232C16.9062 9.85317 17.4848 11.2501 17.4848 12.7067C17.4848 14.1633 16.9062 15.5603 15.8762 16.5902C14.8462 17.6202 13.4493 18.1988 11.9927 18.1988ZM17.7034 8.29211C17.5352 8.29226 17.3686 8.25924 17.2131 8.19494C17.0577 8.13064 16.9164 8.03631 16.7975 7.91736C16.6785 7.7984 16.5842 7.65716 16.5199 7.50172C16.4556 7.34627 16.4226 7.17966 16.4227 7.01144C16.4227 6.84334 16.4558 6.67689 16.5202 6.52158C16.5845 6.36628 16.6788 6.22516 16.7977 6.1063C16.9165 5.98743 17.0576 5.89314 17.2129 5.82881C17.3682 5.76448 17.5347 5.73137 17.7028 5.73137C17.8709 5.73137 18.0374 5.76448 18.1927 5.82881C18.348 5.89314 18.4891 5.98743 18.608 6.1063C18.7268 6.22516 18.8211 6.36628 18.8854 6.52158C18.9498 6.67689 18.9829 6.84334 18.9829 7.01144C18.9829 7.71949 18.4103 8.29211 17.7034 8.29211Z" fill="white"/>
  <path d="M11.9927 16.2743C13.963 16.2743 15.5602 14.677 15.5602 12.7067C15.5602 10.7364 13.963 9.13915 11.9927 9.13915C10.0224 9.13915 8.42512 10.7364 8.42512 12.7067C8.42512 14.677 10.0224 16.2743 11.9927 16.2743Z" fill="white"/>
</svg></a>
<a href="https://www.instagram.com/talktalesentertainment/" target="_blank" rel="noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
  <path d="M12.8025 12.3218L18.2034 20.047H15.9869L11.5797 13.7432V13.7428L10.9326 12.8174L5.78426 5.45312H8.00078L12.1555 11.3964L12.8025 12.3218Z" fill="white"/>
  <path d="M21.4067 0.731445H2.59325C1.16108 0.731445 0 1.89252 0 3.3247V22.1382C0 23.5704 1.16108 24.7314 2.59325 24.7314H21.4067C22.8389 24.7314 24 23.5704 24 22.1382V3.3247C24 1.89252 22.8389 0.731445 21.4067 0.731445ZM15.308 21.0839L10.8481 14.5932L5.26435 21.0839H3.82122L10.2073 13.6609L3.82122 4.36665H8.69203L12.9152 10.513L18.2026 4.36665H19.6458L13.5562 11.4454H13.5558L20.1788 21.0839H15.308Z" fill="white"/>
</svg></a>

            </div>
          </div>

          {data.map((n, index) => {
            return (
              <div key={index}>
                <Link href={n.href}>
                  <div className="font-OswaldRegular mb-4 text-base tracking-widest uppercase whitespace-nowrap">
                    {n.title}
                  </div>
                </Link>
                {/* <nav className="flex flex-col gap-4">
                  {n.subNav.map((i, index) => {
                    return (
                      <div key={index + 2}>
                        <Link
                          href={i.href}
                          className="font-OswaldRegular transition duration-100 uppercase"
                        >
                          {i.title}
                        </Link>
                      </div>
                    );
                  })}
                </nav> */}
              </div>
            );
          })}
        </div>

        <div
          className={`${
            theme === "white" ? "pb-8" : "py-8 text-gray-400"
          } grid grid-cols-1 text-sm lg:grid-cols-2`}
        >
          {/* <div className="text-center lg:text-left mt-2">
            <Link href="/privacy-policy" >
              Privacy Policy
            </Link>
          </div> */}
          <div className="mt-2 text-center lg:text-right">
            © {new Date().getFullYear()} TalkTales. All Rights Reserved.
          </div>
          <div className="mt-2 text-center lg:text-right">
            <Link href="/terms-and-conditions">Terms and Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
