import { createFormHook, createFormHookContexts } from "@tanstack/react-form"
import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"

export const { fieldContext, useFieldContext, formContext, useFormContext } =
    createFormHookContexts()

export const { useAppForm, withForm } = createFormHook({
    fieldComponents: {
        TextField,
        SelectField,
    },
    formComponents: {
        SubmitButton,
    },
    fieldContext,
    formContext,
})


//example usage use this repo file
//https://github.com/Balastrong/confhub/blob/main/src/routes/events/submit.tsx

