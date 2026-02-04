import ToggleTheme from "@/components/shared/toggle-theme";

export default function Footer() {
  return (
    <footer className="py-12 text-center text-gray-400 text-sm">
      <div className="mb-2 px-4">
        <ToggleTheme className="w-min" />
      </div>
      © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}. All rights reserved.
    </footer>
  );
}
