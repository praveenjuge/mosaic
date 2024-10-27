"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserMetaData } from "@/lib/types";
import { SignedIn, useUser } from "@clerk/nextjs";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from "@mynaui/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TOTAL_STEPS = 3;

interface OnboardingStep {
  title: string;
  description: string;
  href: string;
  isCompleted: (userData: UserMetaData) => boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Add Your First Website",
    description: "Go to websites page and click Add Website to get started.",
    href: "/websites",
    isCompleted: (userData) =>
      !!userData.websites_used && userData.websites_used > 0,
  },
  {
    title: "Generate Your First OG Image",
    description:
      "After you add a website, add the given URL to your website to generate your first OG image.",
    href: "/websites",
    isCompleted: (userData) =>
      !!userData.images_used && userData.images_used > 0,
  },
  {
    title: "Upgrade to Pro",
    description:
      "Get unlimited websites and premium features to easily generate OG images for your websites.",
    href: "/subscription",
    isCompleted: (userData) =>
      !!userData.plan && userData.plan.toLowerCase() !== "free",
  },
];

export function OnboardingCard() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();

  useEffect(() => {
    const storedVisibility = localStorage.getItem("onboardingCardVisible");
    const storedMinimized = localStorage.getItem("onboardingCardMinimized");
    setIsVisible(storedVisibility !== "false");
    setIsMinimized(storedMinimized === "true");
  }, []);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const userData = (user?.publicMetadata as unknown as UserMetaData) || {};
  const isUserDataEmpty = Object.keys(userData).length === 0;
  const completedSteps = isUserDataEmpty
    ? 0
    : onboardingSteps.filter((step) => step.isCompleted(userData)).length;

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("onboardingCardVisible", "false");
    setIsPopoverOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    localStorage.setItem("onboardingCardMinimized", "true");
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    localStorage.setItem("onboardingCardMinimized", "false");
  };

  if (!isVisible || (!isUserDataEmpty && completedSteps === TOTAL_STEPS)) {
    return null;
  }

  if (isMinimized) {
    return (
      <Button
        size="sm"
        onClick={handleMaximize}
        className="fixed bottom-4 right-4 z-50"
      >
        Start here ({completedSteps}/{TOTAL_STEPS})
        <ChevronUp className="ml-2 size-4" />
      </Button>
    );
  }

  return (
    <SignedIn>
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
            <ClosePopover
              isOpen={isPopoverOpen}
              setIsOpen={setIsPopoverOpen}
              onClose={handleClose}
            />
            <CardTitles />
            <MinimizeButton onClick={handleMinimize} />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ol className="space-y-4">
              {onboardingSteps.map((step, index) => (
                <OnboardingStep
                  key={index}
                  step={step}
                  userData={userData}
                  stepNumber={index + 1}
                />
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </SignedIn>
  );
}

function ClosePopover({
  isOpen,
  setIsOpen,
  onClose,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onClose: () => void;
}) {
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="size-6 p-0">
          <X className="size-3.5 stroke-2" />
          <span className="sr-only">Close</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Are you sure?</h4>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to close the onboarding guide?
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CardTitles() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Sparkles className="size-9 fill-yellow-500 text-yellow-500" />
      <CardTitle>Let&apos;s get you set up!</CardTitle>
    </div>
  );
}

function MinimizeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="size-6 p-0"
    >
      <ChevronDown className="size-3.5 stroke-2" />
      <span className="sr-only">Minimize</span>
    </Button>
  );
}

function OnboardingStep({
  step,
  userData,
  stepNumber,
}: {
  step: OnboardingStep;
  userData: UserMetaData;
  stepNumber: number;
}) {
  const isCompleted = step.isCompleted(userData);
  return (
    <li
      className={`${isCompleted ? "pointer-events-none line-through opacity-40" : ""}`}
    >
      <Link
        href={step.href}
        className="flex items-start gap-3 rounded border-[0.5px] bg-primary-foreground p-3 transition-colors hover:bg-secondary"
      >
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-[0.5px] text-xs font-medium ${isCompleted ? "border-emerald-500 bg-emerald-500 text-primary-foreground" : "bg-background"}`}
        >
          {isCompleted ? <Check className="size-3 stroke-2" /> : stepNumber}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium">
            {step.title} {"->"}
          </h3>
          <p className="text-muted-foreground">{step.description}</p>
        </div>
      </Link>
    </li>
  );
}
