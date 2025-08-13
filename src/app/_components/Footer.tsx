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
      title: `Our Team`,
      href: "/our-team/",
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
        <div className="mb-16 grid grid-cols-1 gap-12 pt-10 text-center md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:pt-12 lg:text-left">
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

            <a href="tel:+12132860079" className="block">
              <span className="font-OswaldRegular w-full pr-2 text-base">
                Phone:
              </span>
              +1 (213) 286-0079
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
          </div>

          {data.map((n, index) => {
            return (
              <div key={index}>
                <Link href={n.href}>
                  <div className="font-OswaldRegular mb-4 text-base  tracking-widest">
                    {n.title}
                  </div>
                </Link>
                <nav className="flex flex-col gap-4">
                  {n.subNav.map((i, index) => {
                    return (
                      <div key={index + 2}>
                        <Link
                          href={i.href}
                          className="font-OswaldRegular transition duration-100"
                        >
                          {i.title}
                        </Link>
                      </div>
                    );
                  })}
                </nav>
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
