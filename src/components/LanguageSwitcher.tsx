import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language: string) => {
    void i18n.changeLanguage(language);
    localStorage.setItem("mysubs.language", language);
  };

  return (
    <div className="flex items-center gap-2">
      <Languages
        size={18}
        className="shrink-0 text-slate-500"
        aria-hidden="true"
      />

      <label htmlFor="language" className="sr-only">
        {t("common.language")}
      </label>

      <select
        id="language"
        value={i18n.resolvedLanguage === "en" ? "en" : "sv"}
        onChange={(e) => changeLanguage(e.target.value)}
        className="min-h-11 max-w-full rounded-lg border
          border-slate-200 bg-white px-3 py-2
          text-sm text-slate-700 outline-none
          focus:border-blue-500 focus:ring-2
          focus:ring-blue-500/20"
      >
        <option value="sv">🇸🇪 Svenska</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
}