import "i18next"
import translation from "./locales/index"
import { defaultNS } from "./index"

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS
        resources: typeof translation
    }
}