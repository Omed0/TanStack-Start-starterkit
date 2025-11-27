const en = (await import("./en.json")).default
const ckb = (await import("./ckb.json")).default

export default {
    en: { translation: en },
    ckb: { translation: ckb },
};