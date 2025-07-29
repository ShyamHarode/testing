import { useRouter } from "next/router";

import { Home, Link, PanelsTopLeft, Rocket, Waypoints } from "lucide-react";

import useOrgWebsites from "@/components/hooks/useOrgWebsites";
import { PRODUCT_TYPES } from "@/lib/constants";
import { NavigationItem } from "@/types/navigation";

const useNavigation = (withAllItems = false) => {
  const router = useRouter();
  const { currentWebsiteId: orgWebsiteId } = useOrgWebsites();
  const backupWebsiteId = router?.query?.websiteId;

  const websiteId = orgWebsiteId || backupWebsiteId;

  const isCurrentSection = (item: NavigationItem): boolean => {
    if (!item.subNavigation?.length) return false;

    const currentPath = router.asPath;

    return item.subNavigation.some((subItem) => {
      // WARNING: this will break if we use a folder other than websiteId - BAD coding by Will
      const resolvedHref = subItem.href.replace("[websiteId]", (websiteId || "").toString());
      return currentPath.startsWith(resolvedHref);
    });
  };

  const navigation: NavigationItem[] = [
    {
      name: "Company Info",
      shortName: "Company",
      key: "COMPANY",
      description: "Manage your company information.",
      icon: Home,
      productIsLive: true,
      current: isCurrentSection,
      subNavigation: [
        {
          name: "General",
          description: "Adjust your general settings.",
          href: `/dashboard/sites/${websiteId}/company`,
          current: router.pathname.includes("/company"),
        },
        {
          name: "Brand",
          description: "Manage the styles and colors of your business.",
          href: `/dashboard/sites/${websiteId}/brand`,
          current: router.pathname.includes("/brand"),
        },
        {
          name: "Links & QR Codes",
          description: "Manage the links and QR codes for your business.",
          href: `/dashboard/sites/${websiteId}/links`,
          current: router.pathname.includes("/links"),
        },
        {
          name: "Team",
          description: "Manage your team members.",
          href: `/dashboard/sites/${websiteId}/organization`,
          current: router.pathname.includes("/organization"),
        },

        {
          name: "Email Settings",
          description: "Manage your email settings.",
          href: `/dashboard/sites/${websiteId}/email-settings`,
          current: router.pathname.includes("/email-settings"),
        },
      ],
    },
    {
      name: "Website",
      shortName: "Website",
      key: PRODUCT_TYPES.WEBSITE,
      icon: PanelsTopLeft,
      productIsLive: true,
      description:
        "Build and manage your service business website with our easy-to-use editor. Create stunning pages, showcase your work, and convert visitors into customers.",
      onboardingLink: "/dashboard/sites/new",
      current: isCurrentSection,
      subNavigation: [
        {
          name: "Overview",
          description: "Pages that are shared across your website.",
          href: `/dashboard/sites/${websiteId}/overview`,
          current: router.pathname.includes("/overview"),
        },
        {
          name: "Services & Areas",
          description: "Adjust your services and areas of expertise.",
          href: `/dashboard/sites/${websiteId}/services`,
          current: router.pathname.includes("/services"),
        },
        {
          name: "Photo Library",
          description: "Manage the media for your website.",
          href: `/dashboard/sites/${websiteId}/photos`,
          current: router.pathname.includes("/photos"),
        },
        {
          name: "Blog",
          description: "Demonstrate your work via blog posts & project pages.",
          href: `/dashboard/sites/${websiteId}/posts`,
          current: router.pathname.includes("/posts"),
        },
        {
          name: "Testimonials",
          description: "Demonstrate social proof via testimonials.",
          href: `/dashboard/sites/${websiteId}/reviews`,
          current: router.pathname.includes("/reviews"),
        },
        {
          name: "Goals",
          description: "Set your goals and track your progress.",
          href: `/dashboard/sites/${websiteId}/goals`,
          current: router.pathname.includes("/goals"),
        },
        {
          name: "Leads",
          description: "All of the leads that have come in through your website.",
          href: `/dashboard/sites/${websiteId}/messages`,
          current: router.pathname.includes("/messages"),
        },
        {
          name: "Analytics",
          description: "Get an idea of your visitor count and what CTAs they clicked.",
          href: `/dashboard/sites/${websiteId}/analytics`,
          current: router.pathname.includes("/analytics"),
        },
        {
          name: "Settings",
          description: "Adjust your domain, scripts, redirects, and more.",
          href: `/dashboard/sites/${websiteId}/settings`,
          current: router.pathname.includes("/settings"),
        },
        {
          name: "Site Editor",
          description: "Edit your website with our easy-to-use editor.",
          href: `/dashboard/sites/${websiteId}/pages`,
          current: router.pathname.includes("/pages"),
        },
      ],
    },
    {
      name: "Social Media Manager",
      shortName: "Social Media",
      key: PRODUCT_TYPES.SOCIAL_MEDIA,
      icon: Waypoints,
      description:
        "Automate your social media posts with our AI tool. Set a fequency and get your posts created and published automatically.",
      productIsLive: true,
      onboardingLink: "/dashboard/sites/new",
      current: isCurrentSection,
      subNavigation: [
        {
          name: "Posts",
          description: "You social media posts.",
          href: `/dashboard/sites/${websiteId}/socials`,
          current: router.pathname.endsWith("/socials"),
        },
        {
          name: "Settings",
          description: "Adjust your settings.",
          href: `/dashboard/sites/${websiteId}/socials-settings`,
          current: router.pathname.includes("/socials-settings"),
        },
      ],
    },
    {
      name: "Google Profile Optimizer",
      key: PRODUCT_TYPES.GBP,
      shortName: "GBP Optimizer",
      description: "Optimize your Google profile.",
      icon: Rocket,
      current: isCurrentSection,
      subNavigation: [
        {
          name: "Optimizer",
          description: "View your profile score and steps to improve your business profile",
          href: `/dashboard/sites/${websiteId}/gbp-optimizer`,
          current: router.pathname.includes("/gbp-optimizer"),
        },
        {
          name: "Analytics",
          description: "View a complete breakdown of how your business profile is performing",
          href: `/dashboard/sites/${websiteId}/gbp-analytics`,
          current: router.pathname.includes("/gbp-analytics"),
        },
      ],
      productIsLive: true,
    },
    {
      name: "Offsite SEO",
      shortName: "SEO",
      icon: Link,
      current: isCurrentSection,
      subNavigation: [],
      productIsLive: false,
    },
  ];

  // Check if item requires a websiteId by examining if any subNavigation href uses websiteId
  const itemRequiresWebsiteId = (item: NavigationItem): boolean => {
    if (!item.subNavigation?.length) return false;
    return item.subNavigation.some((subItem) => subItem.href && subItem.href.includes(`/sites/${websiteId}/`));
  };

  // Filter out navigation items that require websiteId when it's null
  const filteredNavigation = websiteId ? navigation : navigation.filter((item) => !itemRequiresWebsiteId(item));

  return {
    navigation: withAllItems ? navigation : filteredNavigation,
    currentNavItem: filteredNavigation.find((item) => item.current && item.current(item)),
  };
};

export default useNavigation;
