import React, { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Plus, Sparkles } from "lucide-react";
import { RequestAccessModal } from "./RequestAccessModal";
import { Product } from "../types/product";

interface ProductSwitcherProps {
  products: Product[];
  activeProductId: string | null;
  onSelectProduct: (productId: string | null) => void;
  isSuperadmin: boolean;
  user: any;
}

/**
 *
 */
export function ProductSwitcher({
  products,
  activeProductId,
  onSelectProduct,
  isSuperadmin,
  user,
}: ProductSwitcherProps) {
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const activeProduct = products.find((p) => p.id === activeProductId);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex items-center justify-between min-w-[140px] max-w-[200px] px-3 py-1.5 text-sm font-medium text-ink-dark transition-colors bg-transparent border border-transparent rounded-lg hover:bg-ink-dark/5 focus:outline-none focus:bg-ink-dark/5 data-[state=open]:bg-ink-dark/5">
          <span className="truncate">
            {activeProduct?.name || "Select Product"}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 text-ink-dark/50 shrink-0" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-56 bg-paper-base border border-ink-dark/10 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-200 z-50"
            sideOffset={4}
            align="start"
          >
            <DropdownMenu.Label className="px-2 py-2 text-xs font-semibold tracking-wider text-ink-dark/50 uppercase">
              Your Products
            </DropdownMenu.Label>

            {products.map((product) => (
              <DropdownMenu.Item
                key={product.id}
                onSelect={() => onSelectProduct(product.id)}
                className="flex items-center justify-between px-2 py-2 text-sm text-ink-dark transition-colors rounded-lg cursor-pointer select-none hover:bg-ink-dark/5 focus:bg-ink-dark/5 focus:outline-none"
              >
                <span className="truncate">{product.name}</span>
                {activeProductId === product.id && (
                  <Check className="w-4 h-4 text-accent-teal shrink-0" />
                )}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="h-px my-1 bg-ink-dark/10" />

            <DropdownMenu.Item
              onSelect={(e) => {
                e.preventDefault();
                if (isSuperadmin) {
                  onSelectProduct(null); // Triggers OnboardingWizard
                } else {
                  setIsUpsellOpen(true);
                }
              }}
              className="flex items-center px-2 py-2 text-sm font-medium text-ink-dark transition-colors rounded-lg cursor-pointer select-none group hover:bg-accent-teal/10 focus:bg-accent-teal/10 focus:outline-none"
            >
              <div className="flex items-center justify-center w-5 h-5 mr-2 bg-ink-dark/5 rounded-full group-hover:bg-accent-teal/20 transition-colors">
                <Plus className="w-3 h-3 text-ink-dark" />
              </div>
              Add New Product
              {!isSuperadmin && (
                <Sparkles className="w-3.5 h-3.5 ml-auto text-accent-gold" />
              )}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <RequestAccessModal
        open={isUpsellOpen}
        onOpenChange={setIsUpsellOpen}
        feature="Multiple Products"
        user={user}
      />
    </>
  );
}
