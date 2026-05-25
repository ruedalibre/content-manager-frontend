import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PricingModalContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const PricingModalContext = createContext<PricingModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function PricingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <PricingModalContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </PricingModalContext.Provider>
  );
}

export function usePricingModal() {
  return useContext(PricingModalContext);
}
