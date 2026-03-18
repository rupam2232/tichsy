import { TabsList, TabsTrigger } from "@repo/ui/components/tabs";

interface props {
  tabs: { value: string; label: string }[];
  className?: string;
  tabTriggerClassName?: string;
  defaultValue?: string;
}

export default function TabHeader({
  tabs,
  className,
  tabTriggerClassName,
  defaultValue,
}: props) {
  return (
    <TabsList className={className}>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          defaultChecked={tab.value === defaultValue}
          className={tabTriggerClassName}
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
