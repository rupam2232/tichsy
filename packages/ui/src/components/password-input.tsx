"use client";

import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";
import { Check, EyeIcon, EyeOffIcon, LockKeyhole, X } from "lucide-react";
import {
  useState,
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
  type ChangeEvent,
  useEffect,
  useDeferredValue,
  useMemo,
} from "react";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/input-group";

const PasswordInputContext = createContext<{ password: string } | null>(null);

export function PasswordInput({
  children,
  onChange,
  value,
  defaultValue,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  children?: ReactNode;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(defaultValue ?? "");

  const Icon = showPassword ? EyeIcon : EyeOffIcon;
  const currentValue = value ?? password;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    onChange?.(e);
  };

  return (
    <PasswordInputContext value={{ password: currentValue.toString() }}>
      <div className="space-y-3">
        <InputGroup className="border-zinc-400 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-1">
          <InputGroupAddon>
            <LockKeyhole />
          </InputGroupAddon>
          <InputGroupInput
            {...props}
            data-slot="input-group-control"
            value={value}
            defaultValue={defaultValue}
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => setShowPassword((p) => !p)}>
              <Icon />
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {children}
      </div>
    </PasswordInputContext>
  );
}

export function PasswordInputStrengthChecker({
  onScoreChange,
}: {
  onScoreChange?: (score: number) => void;
}) {
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [errorLoadingOptions, setErrorLoadingOptions] = useState(false);

  const { password } = usePasswordInput();
  const deferredPassword = useDeferredValue(password);
  const strengthResult = useMemo(() => {
    if (!optionsLoaded || deferredPassword.length === 0) {
      return {
        score: 0,
        feedback: { warning: null, suggestions: [] },
      } as const;
    }

    const PASSWORD_POLICY_REGEX =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;'"<>?() [\] {}|\\/~`_^+#=-]{8,}$/;

    const PASSWORD_POLICY_MESSAGE =
      "Password must contain at least one uppercase letter, one lowercase letter, one special character, and one number";

    if (!PASSWORD_POLICY_REGEX.test(deferredPassword)) {
      return {
        score: 2,
        feedback: { warning: PASSWORD_POLICY_MESSAGE, suggestions: [] },
      } as const;
    }

    return zxcvbn(deferredPassword);
  }, [optionsLoaded, deferredPassword]);

  useEffect(() => {
    onScoreChange?.(strengthResult.score);
  }, [strengthResult.score, onScoreChange]);

  useEffect(() => {
    Promise.all([
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ])
      .then(([common, english]) => {
        zxcvbnOptions.setOptions({
          translations: english.translations,
          graphs: common.adjacencyGraphs,
          maxLength: 50,
          dictionary: {
            ...common.dictionary,
            ...english.dictionary,
          },
        });
        setOptionsLoaded(true);
      })
      .catch(() => setErrorLoadingOptions(true));
  }, []);

  function getLabel() {
    if (deferredPassword.length === 0) return "Password strength";
    if (!optionsLoaded) return "Loading strength checker";

    const score = strengthResult.score;
    switch (score) {
      case 0:
      case 1:
        return "Very weak";
      case 2:
        return "Weak";
      case 3:
        return "Strong";
      case 4:
        return "Very strong";
      default:
        throw new Error(`Invalid score: ${score satisfies never}`);
    }
  }

  const label = getLabel();

  if (errorLoadingOptions) return null;

  return (
    <div className="space-y-0.5">
      <div
        role="progressbar"
        aria-label="Password Strength"
        aria-valuenow={strengthResult.score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuetext={label}
        className="flex gap-1"
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const color =
            strengthResult.score >= 3 ? "bg-primary" : "bg-destructive";

          return (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-200 ease-in-out",
                strengthResult.score > i ||
                  (deferredPassword.length > 0 && i === 0)
                  ? color
                  : "bg-muted",
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-end text-sm text-muted-foreground">
        {strengthResult.feedback.warning == null &&
        strengthResult.feedback.suggestions.length === 0 ? (
          label
        ) : (
          <Tooltip>
            <TooltipTrigger className="underline underline-offset-1">
              {label}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="">
              {strengthResult.feedback.warning ??
                strengthResult.feedback.suggestions[0]}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function PasswordInputRequirements() {
  const { password } = usePasswordInput();

  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "At least one number",
      met: /\d/.test(password),
    },
    {
      label: "At least one special character",
      met: /[@$!%*?&.,:;'"<>?() [\] {}|\\/~`_^+#=-]/.test(password),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Password must contain:
      </p>
      <ul className="text-sm space-y-1">
        {requirements.map((req, i) => (
          <li
            key={i}
            className={cn(
              "transition-colors duration-200 flex items-center gap-2 [&_svg]:size-[16px]",
              req.met
                ? "text-green-600 dark:text-green-400"
                : "[&_svg]:text-red-600 dark:[&_svg]:text-red-400 text-muted-foreground",
            )}
          >
            {req.met ? <Check /> : <X />}
            <span className="text-xs">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const usePasswordInput = () => {
  const context = useContext(PasswordInputContext);
  if (context == null) {
    throw new Error(
      "usePasswordInput must be used within a PasswordInputContext",
    );
  }
  return context;
};
