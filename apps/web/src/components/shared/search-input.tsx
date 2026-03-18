"use client";
import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";
import { cn } from "@repo/ui/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";
import { useRef } from "react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export default function SearchInput({
  placeholder,
  className,
  inputClassName,
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
      params.set("tab", "search");
    } else {
      params.delete("search");
      params.set("tab", "all");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDebouncedSearch = useDebounceCallback(handleSearch, 300);

  return (
    <InputGroup
      className={cn(
        "w-full sm:w-auto sm:min-w-[200px] lg:min-w-[300px] border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1",
        className,
      )}
    >
      <InputGroupInput
        placeholder={placeholder ?? "Search..."}
        type="search"
        className={inputClassName}
        ref={searchInputRef}
        onChange={(e) => {
          handleDebouncedSearch(e.target.value);
        }}
        defaultValue={searchParams.get("search")?.toString()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch(searchInputRef.current?.value || "");
          }
        }}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          className={cn(
            "hover:opacity-100 hover:bg-accent h-6 w-6",
            searchInputRef.current && searchInputRef.current.value !== ""
              ? ""
              : "hidden",
          )}
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("search");
            params.set("tab", "all");
            router.replace(`${pathname}?${params.toString()}`);
            if (searchInputRef.current) {
              searchInputRef.current.value = "";
            }
          }}
        >
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
