# TabsView Component Usage Examples

## Basic Usage

```tsx
import { TabsView } from "../../../components/TabsView";

const tabs = [
  {
    id: "tab1",
    label: "Tab 1",
    icon: "📊",
    content: <Component1 />,
  },
  {
    id: "tab2",
    label: "Tab 2",
    icon: "📈",
    content: <Component2 />,
  },
];

<TabsView tabs={tabs} defaultTab="tab1" />;
```

## Advanced Features

### Variants

```tsx
// Default rounded tabs
<TabsView tabs={tabs} variant="default" />

// Pill-shaped tabs
<TabsView tabs={tabs} variant="pills" />

// Underlined tabs
<TabsView tabs={tabs} variant="underline" />
```

### Sizes

```tsx
// Small tabs
<TabsView tabs={tabs} size="sm" />

// Medium tabs (default)
<TabsView tabs={tabs} size="md" />

// Large tabs
<TabsView tabs={tabs} size="lg" />
```

### Badges and Disabled States

```tsx
const advancedTabs = [
  {
    id: "orders",
    label: "Orders",
    icon: "🛒",
    badge: "12", // Shows notification count
    content: <Orders />,
  },
  {
    id: "customers",
    label: "Customers",
    icon: "👥",
    badge: "New",
    content: <Customers />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: "📊",
    disabled: true, // Tab is disabled
    content: <Reports />,
  },
];

<TabsView
  tabs={advancedTabs}
  defaultTab="orders"
  onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
/>;
```

### Custom Styling

```tsx
<TabsView
  tabs={tabs}
  className="custom-tabs-container"
  tabsClassName="custom-tabs-navigation"
  contentClassName="custom-tabs-content"
  variant="pills"
  size="lg"
/>
```

## Real Implementation Examples

### Store Configuration (Current Usage)

```tsx
const tabs = [
  {
    id: "stores",
    label: "Store Settings",
    icon: "🏪",
    content: <Stores />,
  },
  {
    id: "forms",
    label: "Forms",
    icon: "📋",
    content: <Forms />,
  },
  {
    id: "settings",
    label: "Notifications",
    icon: "🔔",
    content: <NotificationSettings />,
  },
];

<TabsView tabs={tabs} defaultTab="stores" />;
```

### Products and Brands (Current Usage)

```tsx
const tabs = [
  {
    id: "products",
    label: "Products",
    icon: "📦",
    content: <Products />,
  },
  {
    id: "brands",
    label: "Brands",
    icon: "🏷️",
    content: <Brands />,
  },
];

<TabsView tabs={tabs} defaultTab="products" />;
```

### Orders and Customers (Current Usage)

```tsx
const tabs = [
  {
    id: "orders",
    label: "Orders",
    icon: "🛒",
    content: <Orders />,
  },
  {
    id: "customers",
    label: "Customers",
    icon: "👥",
    content: <Customers />,
  },
];

<TabsView tabs={tabs} defaultTab="orders" />;
```
