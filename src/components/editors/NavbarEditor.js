import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { PageType } from "@prisma/client";
import { LinkIcon, Plus } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import DarkModeToggle from "@/components/DarkModeToggle";
import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import FormButton, { FormButtonWrapper } from "@/components/FormSubmitButton";
import PageAdder from "@/components/PageAdder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DEFAULT_SERVICE_GROUP_KEY,
  DEFAULT_SERVICE_GROUP_NAME,
  getGroups,
} from "@/features/service-nesting/utils/groups";
import { MIN_REVIEWS } from "@/lib/constants";
import { cn, getSectionBgImageObject } from "@/lib/utils";
import { imageInputSchema } from "@/lib/zod-schemas/image-input";
import ImageUploaderForm from "../forms/ImageUploaderForm";

// Types
import type { WebsiteWithConversionsLocationsImages } from "@/types/prisma";
import type { BlogPost, Conversion, Page, Project, Review, Service, ServiceArea } from "@prisma/client";

interface NavbarItem {
  id: string;
  type:
    | "services"
    | "projects"
    | "blogPosts"
    | "reviews"
    | "conversions"
    | "page"
    | "legal"
    | "areasServed"
    | "external";
  visible: boolean;
  order: number;
  pageId?: string;
  text?: string;
  url?: string;
  groupKey?: string;
  groupName?: string;
}

interface FormData {
  isCustomNav: boolean;
  logo: { url?: string } | string;
  items: NavbarItem[];
  variantNumber?: number;
  isDarkMode?: boolean;
}

interface NavbarEditorProps {
  website: WebsiteWithConversionsLocationsImages & {
    services?: Service[];
    projects?: Project[];
    blogPosts?: BlogPost[];
    reviews?: Review[];
    serviceAreas?: ServiceArea[];
    pages?: Page[];
    navbar?: {
      items?: NavbarItem[];
      variantNumber?: number;
      isCustomNav?: boolean;
      isDarkMode?: boolean;
    };
  };
  onSave: (_updatedFields: {
    logo: string;
    navbar: {
      isCustomNav: boolean;
      items: NavbarItem[];
      variantNumber?: number;
      isDarkMode?: boolean;
    };
  }) => Promise<void>;
  content?: {
    variantNumber?: number;
    isDarkMode?: boolean;
  };
}

interface AddItemDialogProps {
  isOpen: boolean;
  setIsOpen: (_isOpen: boolean) => void;
  onSelectPage: () => void;
  onSelectExternalLink: () => void;
}

interface ExternalLinkDialogProps {
  isOpen: boolean;
  setIsOpen: (_isOpen: boolean) => void;
  onSave: (_data: { text: string; url: string }) => void;
}

// Items that are hidden by default
const DEFAULT_HIDDEN_ITEMS = ["legal", "areasServed"];

// Formats the item type for lookup
const getLookupKey = (item: NavbarItem): string =>
  item.type === "page"
    ? `page-${item.pageId}`
    : item.type === "legal"
      ? `legal-${item.pageId}`
      : item.type === "services"
        ? `services-${item.groupKey ?? DEFAULT_SERVICE_GROUP_KEY}`
        : item.type;

const validationSchema = z.object({
  isCustomNav: z.boolean(),
  logo: imageInputSchema(false),
  items: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "services",
        "projects",
        "blogPosts",
        "reviews",
        "conversions",
        "page",
        "legal",
        "areasServed",
        "external",
      ]),
      visible: z.boolean(),
      order: z.number(),
      pageId: z.string().optional(),
      text: z.string().optional(),
      url: z.string().optional(),
      groupKey: z.string().optional(),
      groupName: z.string().optional(),
    })
  ),
  variantNumber: z.number().optional(),
  isDarkMode: z.boolean().optional(),
});

// Ensures the order numbers are always sequential when manipulating the items array
const normalizeOrder = (items: NavbarItem[]): NavbarItem[] => {
  return items
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));
};

const processItems = (website: NavbarEditorProps["website"]) => {
  const {
    services = [],
    projects = [],
    blogPosts = [],
    reviews = [],
    conversions = [],
    serviceAreas = [],
    navbar = {},
  } = website ?? {};
  const general = website?.pages?.filter((p) => p.type === PageType.GENERAL && !!p.slug) || [];
  const legal = website?.pages?.filter((p) => p.type === PageType.LEGAL && !!p.slug) || [];

  const areasServed = serviceAreas.filter((p) => !!p.slug);
  const externalLinks = navbar?.items?.filter((item) => item.type === "external") || [];

  const serviceGroups = getGroups(services);
  const servicesByGroup = serviceGroups.map((group) =>
    services.filter((service) => {
      const groupInfo = service.groupInfo as unknown as { key: string; name: string };
      return groupInfo?.key === group.key;
    })
  );

  const availableItems = [
    ...servicesByGroup
      .map((serviceGroup) => {
        if (serviceGroup.length === 0) return null;
        const groupInfo = serviceGroup[0].groupInfo as unknown as { key: string; name: string };
        return {
          id: groupInfo?.key || "general",
          type: "services" as const,
          visible: true,
          order: 1,
          groupName: groupInfo?.name || "General",
          groupKey: groupInfo?.key || "general",
        };
      })
      .filter(Boolean),
    { type: "projects" as const, visible: projects.length > 0, id: "projects", order: 1 },
    { type: "blogPosts" as const, visible: blogPosts.length > 0, id: "blogPosts", order: 1 },
    { type: "reviews" as const, visible: (reviews.length || 0) > MIN_REVIEWS, id: "reviews", order: 1 },
    { type: "areasServed" as const, visible: areasServed.length > 0, id: "areasServed", order: 1 },
    ...general.map((page) => ({
      id: page.id,
      type: "page" as const,
      pageId: page.id,
      visible: true,
      order: 1,
    })),
    ...legal.map((page) => ({
      id: page.id,
      type: "legal" as const,
      pageId: page.id,
      visible: true,
      order: 1,
    })),
    { type: "conversions" as const, visible: conversions.length > 0, id: "conversions", order: 1 },
    ...externalLinks.map((link) => ({
      id: link.id,
      type: "external" as const,
      text: link.text,
      url: link.url,
      visible: link.visible ?? true,
      order: 1,
    })),
  ];

  let visibleItems: NavbarItem[] = [];

  if (Boolean(navbar?.items?.length) && navbar?.isCustomNav && navbar.items) {
    const existingItemsMap = new Map(navbar.items.map((item) => [getLookupKey(item), item]));

    // finds the max order of existing items (excluding conversions)
    const maxExistingOrder = Math.max(
      0,
      ...navbar.items.filter((item) => item.type !== "conversions").map((item) => item.order || 0)
    );

    // finds the order of existing conversions
    const existingConversionsItem = navbar.items.find((item) => item.type === "conversions");
    const conversionsOrder = existingConversionsItem?.order;

    // process all available items
    availableItems
      .filter((item): item is NonNullable<typeof item> => item !== null && item.visible)
      .forEach((item) => {
        const lookupKey = getLookupKey(item);
        const existingItem = existingItemsMap.get(lookupKey);

        let order: number;
        if (
          existingItem &&
          typeof existingItem === "object" &&
          "order" in existingItem &&
          existingItem.order !== undefined
        ) {
          // uses existing order
          order = existingItem.order as number;
        } else if (item.type === "conversions") {
          // conversions always go last
          order = Number.MAX_SAFE_INTEGER;
        } else {
          if (conversionsOrder !== undefined) {
            // if conversions exists, place new items just before it
            order = conversionsOrder - 0.5;
          } else {
            // if no conversions, place last
            order = maxExistingOrder + 1;
          }
        }

        visibleItems.push({
          ...item,
          // if the item is a a default hidden item, it should be hidden by default
          visible:
            existingItem && typeof existingItem === "object" && "visible" in existingItem
              ? (existingItem.visible as boolean)
              : !DEFAULT_HIDDEN_ITEMS.includes(item.type),
          order,
        });
      });
  } else {
    // if auto-generated, not custom nav
    availableItems
      .filter((item): item is NonNullable<typeof item> => item !== null && item.visible)
      .forEach((item, index) => {
        visibleItems.push({
          ...item,
          order: index + 1,
          // if the item is a a default hidden item, it should be hidden by default but still be visible in the editor
          visible: !DEFAULT_HIDDEN_ITEMS.includes(item.type),
        });
      });
  }

  return {
    servicesByGroup,
    projects,
    blogPosts,
    reviews,
    conversions,
    areasServed,
    general,
    legal,
    availableItems,
    visibleItems: normalizeOrder(visibleItems),
    navbar: {
      items: navbar?.items ?? [],
      variantNumber: navbar?.variantNumber ?? 0,
      isCustomNav: navbar?.isCustomNav ?? false,
      isDarkMode: navbar?.isDarkMode ?? false,
    },
  };
};

const ADD_ITEM_DIALOG_ID = "add-item-dialog";
const PAGE_ADDER_DIALOG_ID = "page-adder-dialog";
const EXTERNAL_LINK_DIALOG_ID = "external-link-dialog";

export default function NavbarEditor({ website, onSave, content }: NavbarEditorProps) {
  const { servicesByGroup, conversions, areasServed, general, legal, visibleItems, navbar } = useMemo(() => {
    return processItems(website);
  }, [website]);

  const defaultValues = {
    isCustomNav: navbar.isCustomNav,
    logo: !website.logo ? "" : getSectionBgImageObject(website.logo),
    items: visibleItems,
    variantNumber: content?.variantNumber ?? 0,
    isDarkMode: content?.isDarkMode ?? false,
  };

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const isCustomNav = form.watch("isCustomNav");

  // set the form variantNumber when the content variantNumber changes (i.e. when the navbar is shuffled)
  // this keeps it in sync with the latest variantNumber and prevents its reset to a stale value on form submission
  useEffect(() => {
    form.setValue("variantNumber", content?.variantNumber ?? 0);
  }, [form, content?.variantNumber]);

  const onFormSubmit = async (data: FormData) => {
    //Separate out the logo from the navbar data so we can update them as separate fields
    const updatedFields = {
      logo: typeof data.logo === "string" ? data.logo : (data.logo?.url ?? ""),
      navbar: {
        isCustomNav: data.isCustomNav,
        items: data.items,
        variantNumber: data.variantNumber,
        isDarkMode: data.isDarkMode,
      },
    };

    await onSave(updatedFields);
    //Reset back to the original data and pull logo from the global field
    form.reset({ ...updatedFields.navbar, logo: data.logo ?? getSectionBgImageObject(website?.logo) });
  };

  const [editingIndex, setEditingIndex] = useState(null);
  const [dialogState, setDialogState] = useState({
    [ADD_ITEM_DIALOG_ID]: false,
    [PAGE_ADDER_DIALOG_ID]: false,
    [EXTERNAL_LINK_DIALOG_ID]: false,
  });

  const setDialog = (dialog: string, isOpen: boolean) => {
    setDialogState((prev) => ({ ...prev, [dialog]: isOpen }));
  };

  const handleSelectPage = () => {
    setDialog(ADD_ITEM_DIALOG_ID, false);
    setDialog(PAGE_ADDER_DIALOG_ID, true);
  };

  const handleSelectExternalLink = () => {
    setDialog(ADD_ITEM_DIALOG_ID, false);
    setDialog(EXTERNAL_LINK_DIALOG_ID, true);
  };

  const handleVisibility = (index: number) => {
    const items = form.getValues("items");
    const updatedItems = items.map((item, i) => (i === index ? { ...item, visible: !item.visible } : item));

    form.setValue("items", updatedItems, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleSortEnd = (newItems: NavbarItem[]) => {
    // Update the order numbers
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    form.setValue("items", reorderedItems, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleAddExternalLink = (data: { text: string; url: string }) => {
    const items = form.getValues("items");
    const newItem: NavbarItem = {
      id: crypto.randomUUID(),
      type: "external",
      visible: true,
      order: items.length + 1,
      text: data.text,
      url: data.url,
    };

    form.setValue("items", [...items, newItem], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <Form {...form} key={`navbar-form-${website?.id}`}>
      <form key={`navbar-inner-form-${website?.id}`} onSubmit={form.handleSubmit(onFormSubmit)}>
        <DarkModeToggle form={form} />
        <ImageUploaderForm
          key="logo-uploader"
          label="Logo"
          fieldName="logo"
          form={form}
          showGalleryButton={false}
          onGalleryImagesSelectFinished={() => {}}
        />

        <div key="auto-navbar-switch" className="flex flex-col rounded-lg border p-4 mb-8">
          <FormField
            key="auto-navbar-field"
            control={form.control}
            name="isCustomNav"
            render={({ field }) => (
              <div key="auto-navbar-container" className="flex flex-row items-center justify-between">
                <div className="space-y-0.5 mr-2.5">
                  <FormLabel className="text-base">Custom navigation {isCustomNav ? "on" : "off"}</FormLabel>
                  <FormDescription>
                    {isCustomNav ? "Customize your navigation below." : "We've generated your navigation for you."}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            )}
          />
        </div>

        {isCustomNav && (
          <div key="custom-navbar-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Custom navbar</h3>
              <div className="flex items-center gap-3">
                <Tooltip key="add-item-tooltip">
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" onClick={() => setDialog(ADD_ITEM_DIALOG_ID, true)}>
                      <Plus className="w-4 h-4" />
                      Add Item
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs font-normal">
                    Add navigation item
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <EditorInputList
              key="navbar-editable-list"
              listName="Links"
              fields={fields}
              editingIndex={editingIndex}
              setEditingIndex={setEditingIndex}
              renderDisplay={(item: NavbarItem, index: number) => {
                return renderDisplay(item, index, general, conversions, servicesByGroup, legal, areasServed);
              }}
              renderEdit={() => null}
              onXClick={() => {}}
              allowEdit={false}
              handleVisibility={handleVisibility}
              onSortEnd={handleSortEnd}
              remove={remove}
              allowDelete={false}
            />
          </div>
        )}

        {isCustomNav && (
          <p key="cta-buttons-note" className={cn(form.formState.isDirty && "mb-[69px]")}>
            Want to modify your &quot;call to action&quot; buttons?{" "}
            <Link href={`/dashboard/sites/${website.id}/company#goals`} className="underline text-ash-700">
              Click here &rarr;
            </Link>
          </p>
        )}

        <FormButtonWrapper key="form-buttons" form={form} />
      </form>

      <AddItemDialog
        isOpen={dialogState[ADD_ITEM_DIALOG_ID]}
        setIsOpen={(isOpen) => setDialog(ADD_ITEM_DIALOG_ID, isOpen)}
        onSelectPage={handleSelectPage}
        onSelectExternalLink={handleSelectExternalLink}
      />

      <PageAdder
        key="page-adder"
        isOpen={dialogState[PAGE_ADDER_DIALOG_ID]}
        setIsOpen={(isOpen: boolean) => setDialog(PAGE_ADDER_DIALOG_ID, isOpen)}
        websiteId={website.id}
        // @ts-ignore - PageAdder props type issue with existingSlugs
        existingSlugs={website?.pages?.map((p) => p.slug).filter((slug): slug is string => Boolean(slug)) || []}
        canCloseModal={true}
      />

      <ExternalLinkDialog
        isOpen={dialogState[EXTERNAL_LINK_DIALOG_ID]}
        setIsOpen={(isOpen) => setDialog(EXTERNAL_LINK_DIALOG_ID, isOpen)}
        onSave={handleAddExternalLink}
      />
    </Form>
  );
}

// Handles rendering the navbar items
const renderDisplay = (
  item: NavbarItem,
  index: number,
  general: Page[],
  conversions: Conversion[],
  servicesByGroup: Service[][],
  legal: Page[],
  areasServed: ServiceArea[]
) => (
  <div
    key={`item-${item.type}-${item.id}-${index}`}
    className={`flex items-center justify-between p-3 border rounded-lg ${!item.visible ? "opacity-50 bg-ash-100" : ""}`}
  >
    <div className="flex-1">
      {renderItemLabel(item, index, general, conversions, servicesByGroup, legal, areasServed)}
    </div>
    <div className="flex items-center gap-2">
      <span
        className={`text-sm px-2 py-1 rounded ${item.visible ? "text-mint-800 bg-mint-100" : "text-lava-800 bg-lava-100"}`}
      >
        {item.visible ? "Visible" : "Hidden"}
      </span>
    </div>
  </div>
);

// Handles rendering the info about each item
const renderItemLabel = (
  item: NavbarItem,
  index: number,
  general: Page[],
  conversions: Conversion[],
  servicesByGroup: Service[][],
  legal: Page[],
  areasServed: ServiceArea[]
) => {
  switch (item.type) {
    case "services": {
      const displayName = item.groupName === DEFAULT_SERVICE_GROUP_NAME ? "Services" : item.groupName;
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {index + 1}. {displayName}
          </div>
          <div className="pl-4 text-sm text-ash-500">
            {servicesByGroup
              .filter((serviceGroup) => {
                if (serviceGroup.length === 0) return false;
                const groupInfo = serviceGroup[0].groupInfo as unknown as { key: string; name: string };
                return groupInfo?.key === item.groupKey;
              })
              .map((services) => {
                return services.map((service) => {
                  return <div key={`service-${service.id}`}>{service.name}</div>;
                });
              })}
          </div>
        </div>
      );
    }
    case "areasServed":
      return (
        <div className="space-y-1">
          <div className="font-medium">{index + 1}. Areas Served</div>
          <div className="pl-4 text-sm text-ash-500">
            {areasServed.map((serviceArea) => (
              <div key={`service-area-${serviceArea.id}`}>{serviceArea.name}</div>
            ))}
          </div>
        </div>
      );

    case "projects":
      return `${index + 1}. Projects`;

    case "blogPosts":
      return `${index + 1}. Blog Posts`;

    case "reviews":
      return `${index + 1}. Reviews`;
    case "page": {
      const pageData = general.find((p) => p.id === item.pageId);
      if (!pageData) return null;
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {index + 1}. {pageData.name}
          </div>
          <div className="pl-4 text-sm text-ash-500">/{pageData.slug}</div>
        </div>
      );
    }
    case "legal": {
      const pageData = legal.find((p) => p.id === item.pageId);
      if (!pageData) return null;
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {index + 1}. {pageData.name}
          </div>
          <div className="pl-4 text-sm text-ash-500">/{pageData.slug}</div>
        </div>
      );
    }
    case "conversions":
      return (
        <div className="space-y-1">
          <div className="font-medium">{index + 1}. Call to Action Buttons</div>
          <div className="pl-4 text-sm text-ash-500">
            {conversions.map((conversion) => (
              <div key={`conversion-${conversion.id}`}>{conversion.ctaText}</div>
            ))}
          </div>
        </div>
      );
    case "external":
      return (
        <div className="space-y-1">
          <div className="font-medium">
            {index + 1}. {item.text}
          </div>
          <div className="pl-4 text-sm text-ash-500 break-all overflow-hidden">{item.url}</div>
        </div>
      );
    default:
      return item.type;
  }
};

function AddItemDialog({ isOpen, setIsOpen, onSelectPage, onSelectExternalLink }: AddItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Navigation Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-4 h-32 hover:border-ash-700"
            onClick={onSelectPage}
          >
            <Plus className="h-8 w-8" />
            <span>Add New Page</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center gap-4 h-32 hover:border-ash-700"
            onClick={onSelectExternalLink}
          >
            <LinkIcon className="h-8 w-8" />
            <span>Add External Link</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  text: z.string().trim().min(1, "Link text is required"),
  url: z.string().trim().min(1, "Please enter a valid URL"),
});

function ExternalLinkDialog({ isOpen, setIsOpen, onSave }: ExternalLinkDialogProps) {
  const form = useForm<{ text: string; url: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: "",
      url: "",
    },
  });

  const onSubmit = (data: { text: string; url: string }) => {
    onSave(data);
    form.reset();
    setIsOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add External Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <EditorInputField
            form={form}
            fieldName="text"
            label="Link Text"
            placeholder="e.g. Our Story"
            required
            aiPrompt=""
            className=""
            icon={null}
          />
          <EditorInputField
            form={form}
            fieldName="url"
            label="URL"
            placeholder="https://example.com"
            required
            aiPrompt=""
            className=""
            icon={null}
          />
          <div className="flex justify-end">
            <FormButton formState={form.formState}>Add Link</FormButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
