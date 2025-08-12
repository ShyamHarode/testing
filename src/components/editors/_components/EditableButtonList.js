import loGet from "lodash/get";
import { AtSign, Link, Phone } from "lucide-react";

import EditorInputField from "@/components/forms/EditorInputField";
import EditorInputList from "@/components/forms/EditorInputList";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROMPT_TYPES } from "@/lib/ai/prompts";
import BUTTON_TYPES from "@/lib/constants/buttonTypes";

const ButtonIcon = ({ type, ...props }) => {
  let Component;

  switch (type) {
    case BUTTON_TYPES.SITE_LINK:
    case BUTTON_TYPES.EXTERNAL_LINK:
      Component = Link;
      break;
    case BUTTON_TYPES.PHONE_NUMBER:
      Component = Phone;
      break;
    case BUTTON_TYPES.EMAIL:
      Component = AtSign;
      break;
    default:
      break;
  }

  if (!Component) return null;
  return <Component {...props} />;
};

const SelectionItem = ({ type, ...props }) => {
  let name;

  switch (type) {
    case BUTTON_TYPES.SITE_LINK:
      name = "Link to a page on this site";
      break;
    case BUTTON_TYPES.EXTERNAL_LINK:
      name = "Link to another website";
      break;
    case BUTTON_TYPES.PHONE_NUMBER:
      name = "Phone number";
      break;
    case BUTTON_TYPES.EMAIL:
      name = "Email";
      break;
    default:
      break;
  }

  return (
    <SelectItem value={type} {...props}>
      <div className="flex items-center justify-between">
        <span>{name}</span>
      </div>
    </SelectItem>
  );
};

const buttonTypeDataRender = {
  [BUTTON_TYPES.EXTERNAL_LINK]: {
    placeholder: "https://example.com",
    label: "External link",
  },
  [BUTTON_TYPES.PHONE_NUMBER]: {
    placeholder: "+1 123-456-7890",
    label: "Phone number",
  },
  [BUTTON_TYPES.EMAIL]: {
    placeholder: "example@domain.com",
    label: "Email",
  },
};

export default function EditableButtonList({
  pages,
  form,
  fields,
  editingIndex,
  setEditingIndex,
  remove,
  update,
  listName,
  fieldName,
  ...props
}) {
  const error = loGet(form.formState.errors, fieldName);
  const { getValues } = form;

  const getUpdatedField = (index) => {
    const values = getValues();
    return values[fieldName][index];
  };

  const handleSortEnd = (newItems) => {
    form.setValue(fieldName, newItems, { shouldDirty: true });
  };

  return (
    <>
      <EditorInputList
        fields={fields}
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        remove={remove}
        onSortEnd={handleSortEnd}
        renderDisplay={(field) => (
          <div className="flex items-center gap-4 border-ash-200 border p-3 rounded-md h-full">
            <ButtonIcon type={field.type} className="h-4 w-4 text-ash-500" />
            <p className="font-bold text-sm">{field.label}</p>
          </div>
        )}
        renderEdit={(field, index) => (
          <div className="flex flex-col">
            <div className={"relative focus-within:text-ash-900 text-ash-500"}>
              <Label
                htmlFor={"button-type"}
                className="text-xs text-inherit top-[11px] px-1 left-2 bg-white rounded-md font-normal relative inline-block"
              >
                Button type
              </Label>
              <Select
                id={"button-type"}
                onValueChange={(value) => {
                  const updatedField = getUpdatedField(index);
                  update(index, { ...updatedField, type: value, link: "/" });
                }}
                defaultValue={field.type}
              >
                <SelectTrigger className="py-6 text-black">
                  <SelectValue placeholder="Button type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BUTTON_TYPES).map((type) => (
                    <SelectionItem type={type} key={type} />
                  ))}
                </SelectContent>
              </Select>
            </div>

            {field.type === BUTTON_TYPES.SITE_LINK && (
              <div className={"relative focus-within:text-ash-900 text-ash-500"}>
                <Label
                  htmlFor={"page-link"}
                  className="text-xs text-inherit top-[11px] px-1 left-2 bg-white rounded-md font-normal relative flex items-center gap-2 -mt-1 w-max"
                >
                  <ButtonIcon type={BUTTON_TYPES.SITE_LINK} className="h-4 w-4" />
                  <span>Site link</span>
                </Label>
                <Select
                  id={"page-link"}
                  onValueChange={(value) => {
                    const updatedField = getUpdatedField(index);
                    update(index, { ...updatedField, link: value });
                  }}
                  defaultValue={field?.link ?? "/"}
                >
                  <SelectTrigger className="py-6 text-black">
                    <SelectValue placeholder="Home" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.slug} value={`/${page.slug}`}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(field.type === BUTTON_TYPES.EXTERNAL_LINK ||
              field.type === BUTTON_TYPES.PHONE_NUMBER ||
              field.type === BUTTON_TYPES.EMAIL) && (
              <div className="-mt-3">
                <EditorInputField
                  form={form}
                  fieldName={`${fieldName}.${index}.link`}
                  placeholder={buttonTypeDataRender[field.type].placeholder}
                  label={buttonTypeDataRender[field.type].label}
                />
              </div>
            )}

            <div className="-mt-3">
              <EditorInputField
                form={form}
                fieldName={`${fieldName}.${index}.label`}
                label="Button text"
                placeholder={
                  field.type === BUTTON_TYPES.SITE_LINK
                    ? "Go to page"
                    : field.type === BUTTON_TYPES.EXTERNAL_LINK
                      ? "Visit website"
                      : field.type === BUTTON_TYPES.PHONE_NUMBER
                        ? "Call Us!"
                        : field.type === BUTTON_TYPES.EMAIL
                          ? "Email Us!"
                          : "Button text"
                }
                aiPrompt={{
                  type: PROMPT_TYPES.BUTTON_LABEL,
                  buttonType: field.type,
                  link: form.watch(`${fieldName}.${index}.link`),
                }}
              />
            </div>
          </div>
        )}
        {...props}
      />
      {!!error?.length && (
        <div className="flex flex-col gap-1">
          {error.map(
            (entry, index) =>
              entry?.link &&
              entry?.link?.message && (
                <div key={index} className="mt-0.5 mb-2 text-xs text-lava-500">
                  {entry.link.message}
                </div>
              )
          )}
        </div>
      )}
    </>
  );
}
