"use client";

import { useEffect, useState } from "react";
import { Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  buildModifierPayload,
  defaultSelections,
  hasRequiredModifiers,
  initialModifierSelections,
  isConversationalModifierFlow,
  modifierWizardSteps,
  type ModifierGroupConfig,
  validateSelections,
} from "@/lib/pos/modifiers";

interface ModifierWizardProps {
  open: boolean;
  itemName: string;
  groups: ModifierGroupConfig[];
  onClose: () => void;
  onFire: (payload: {
    modifiers: ReturnType<typeof buildModifierPayload>["selections"];
    modifierSummary: string;
    price: number;
  }) => void;
}

export function ModifierWizard({ open, itemName, groups, onClose, onFire }: ModifierWizardProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const forced = hasRequiredModifiers(groups);
  const conversational = isConversationalModifierFlow(groups);
  const optionalOnly = !forced;
  const steps = modifierWizardSteps(groups);
  const activeStep = conversational ? steps[step] : null;
  const displayGroups = conversational && activeStep ? activeStep : groups;
  const activeGroup =
    conversational && activeStep?.length === 1 ? activeStep[0] : null;

  useEffect(() => {
    if (open) {
      setSelected(initialModifierSelections(groups, { forceExplicitRequired: forced }));
      setError(null);
      setStep(0);
    }
  }, [open, groups, forced]);

  if (!open) return null;

  const toggleOption = (group: ModifierGroupConfig, optionId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      const exists = current.includes(optionId);
      let next: string[];
      if (group.maxSelect === 1) {
        next = exists ? [] : [optionId];
      } else if (exists) {
        next = current.filter((id) => id !== optionId);
      } else if (current.length >= group.maxSelect) {
        next = [...current.slice(1), optionId];
      } else {
        next = [...current, optionId];
      }
      return { ...prev, [group.id]: next };
    });
    setError(null);
  };

  const fireWithDefaults = () => {
    const defaults = defaultSelections(groups);
    const built = buildModifierPayload(groups, defaults);
    onFire({
      modifiers: built.selections,
      modifierSummary: built.summary,
      price: built.priceDelta,
    });
  };

  const fireWithoutExtras = () => {
    onFire({
      modifiers: [],
      modifierSummary: "",
      price: 0,
    });
  };

  const handleFire = () => {
    const check = validateSelections(groups, selected);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    const built = buildModifierPayload(groups, selected);
    onFire({
      modifiers: built.selections,
      modifierSummary: built.summary,
      price: built.priceDelta,
    });
  };

  const handleNext = () => {
    const stepGroups = steps[step] ?? [];
    const check = validateSelections(stepGroups, selected);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFire();
    }
  };

  const stepLabel = conversational
    ? `Step ${step + 1} of ${steps.length}`
    : optionalOnly
      ? "Category extras (optional)"
      : "Required choice";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            {stepLabel}
          </p>
          <h2 className="text-lg font-bold text-slate-900">{itemName}</h2>
          {activeGroup ? (
            <p className="mt-1 text-base font-medium text-slate-800">{activeGroup.name}</p>
          ) : (
            conversational &&
            activeStep &&
            activeStep.length > 1 && (
              <p className="mt-1 text-sm text-slate-600">Any extras? (optional)</p>
            )
          )}
          {!conversational && optionalOnly && (
            <p className="mt-1 text-sm text-slate-600">Tap any extras — or skip if none needed.</p>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {displayGroups.map((group) => (
            <div key={group.id}>
              {(!conversational || (activeStep && activeStep.length > 1)) && (
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  {group.name}
                  {(group.required || group.minSelect > 0) && (
                    <span className="text-red-500"> *</span>
                  )}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const picked = (selected[group.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group, option.id)}
                      className={cn(
                        "rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-colors",
                        picked
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:border-orange-300"
                      )}
                    >
                      {option.name}
                      {option.priceDelta > 0 && (
                        <span className="mt-0.5 block text-xs font-normal text-slate-500">
                          +${option.priceDelta.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {group.maxSelect > 1 && (
                <p className="mt-1 text-xs text-slate-500">
                  {group.minSelect === group.maxSelect
                    ? `Choose exactly ${group.maxSelect}`
                    : `Choose up to ${group.maxSelect}`}
                  {group.minSelect > 0 && group.minSelect !== group.maxSelect
                    ? ` (at least ${group.minSelect})`
                    : ""}
                </p>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t p-4 sm:flex-row">
          <Button variant="secondary" onClick={onClose} className="sm:flex-1">
            Cancel
          </Button>
          {optionalOnly && (
            <Button variant="ghost" onClick={fireWithoutExtras} className="sm:flex-1">
              Skip extras
            </Button>
          )}
          {!forced && (
            <Button variant="ghost" onClick={fireWithDefaults} className="sm:flex-1">
              <Zap className="h-4 w-4" />
              Fire defaults
            </Button>
          )}
          {conversational ? (
            <Button onClick={handleNext} className="sm:flex-1">
              <Flame className="h-4 w-4" />
              {step < steps.length - 1 ? "Next" : "Fire to kitchen"}
            </Button>
          ) : (
            <Button onClick={handleFire} className="sm:flex-1">
              <Flame className="h-4 w-4" />
              {optionalOnly ? "Add to order" : "Fire to kitchen"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
