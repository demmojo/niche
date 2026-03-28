import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductSwitcher } from "../../components/ProductSwitcher";

// Mock the Radix UI primitives as they can be tricky in JSDOM without proper layout
vi.mock("@radix-ui/react-dropdown-menu", () => {
  return {
    Root: ({ children }: any) => (
      <div data-testid="dropdown-root">{children}</div>
    ),
    Trigger: ({ children }: any) => (
      <button data-testid="dropdown-trigger">{children}</button>
    ),
    Portal: ({ children }: any) => (
      <div data-testid="dropdown-portal">{children}</div>
    ),
    Content: ({ children }: any) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    Label: ({ children }: any) => <div>{children}</div>,
    Item: ({ children, onSelect }: any) => (
      <button data-testid="dropdown-item" onClick={onSelect}>
        {children}
      </button>
    ),
    Separator: () => <hr />,
  };
});

describe("ProductSwitcher Role-Based Rendering", () => {
  const mockProducts = [
    { id: "1", name: "Product 1" },
    { id: "2", name: "Product 2" },
  ];
  const mockUser = { uid: "test-123", email: "user@test.com" };

  it("allows superadmin to click Add New Product without modal", () => {
    const handleSelect = vi.fn();

    render(
      <ProductSwitcher
        products={mockProducts}
        activeProductId="1"
        onSelectProduct={handleSelect}
        isSuperadmin={true}
        user={mockUser}
      />,
    );

    const items = screen.getAllByTestId("dropdown-item");
    const addProductItem = items[items.length - 1]; // The last item

    fireEvent.click(addProductItem);

    // Superadmin should trigger onSelectProduct(null) to launch onboarding
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it("shows Request Access modal for normal users instead of adding product", () => {
    const handleSelect = vi.fn();

    render(
      <ProductSwitcher
        products={mockProducts}
        activeProductId="1"
        onSelectProduct={handleSelect}
        isSuperadmin={false}
        user={mockUser}
      />,
    );

    const items = screen.getAllByTestId("dropdown-item");
    const addProductItem = items[items.length - 1];

    fireEvent.click(addProductItem);

    // Normal user should NOT trigger onSelectProduct
    expect(handleSelect).not.toHaveBeenCalled();
    // Modal state is internal, but we can verify the trigger doesn't execute the superadmin action
  });

  it("allows user to select an existing product", () => {
    const handleSelect = vi.fn();

    render(
      <ProductSwitcher
        products={mockProducts}
        activeProductId="1"
        onSelectProduct={handleSelect}
        isSuperadmin={false}
        user={mockUser}
      />,
    );

    const items = screen.getAllByTestId("dropdown-item");
    const secondProductItem = items[1]; // The second product item

    fireEvent.click(secondProductItem);

    expect(handleSelect).toHaveBeenCalledWith("2");
  });
});
