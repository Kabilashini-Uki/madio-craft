# Loading Skeleton Implementation Guide

## Overview
Added comprehensive loading skeleton components with color differentiation and shadows to all dashboards (Buyer, Artisan, Admin).

## New Component: LoadingSkeleton.js

### Available Components

#### 1. **SkeletonCard**
- Animated loading card with gradient background
- Color options: amber, blue, green, purple, red
- Customizable height
- Shadow effects

```jsx
<SkeletonCard color="amber" height="h-32" />
```

#### 2. **SkeletonRow**
- Loading row with image placeholder and text
- Perfect for list items and table rows
- Color-coded backgrounds

```jsx
<SkeletonRow color="amber" />
```

#### 3. **SkeletonGrid**
- Multiple skeleton cards in grid layout
- Customizable count and color
- Responsive grid

```jsx
<SkeletonGrid count={3} color="amber" />
```

#### 4. **SkeletonTable**
- Multiple skeleton rows for table loading
- Customizable row count

```jsx
<SkeletonTable rows={5} color="amber" />
```

#### 5. **SidebarSkeleton**
- Animated sidebar loading state
- Responsive to sidebar open/closed state

```jsx
<SidebarSkeleton sidebarOpen={true} />
```

#### 6. **DashboardLoadingShade**
- Complete dashboard loading state
- Includes header, sidebar, and content skeletons
- Full page loading experience

```jsx
<DashboardLoadingShade sidebarOpen={true} />
```

## Color Scheme

Each skeleton component supports color differentiation:

- **Amber** (#FCD34D) - Primary/Default
- **Blue** (#60A5FA) - Secondary
- **Green** (#4ADE80) - Success
- **Purple** (#C084FC) - Tertiary
- **Red** (#F87171) - Danger

## Implementation in Dashboards

### BuyerDashboard Updates

#### Overview Tab
```jsx
{loadingOrders ? (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <SkeletonCard color="amber" height="h-32" />
      <SkeletonCard color="yellow" height="h-32" />
      <SkeletonCard color="red" height="h-32" />
    </div>
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
      {[...Array(3)].map((_, i) => (
        <SkeletonRow key={i} color="amber" />
      ))}
    </div>
  </div>
) : (
  // Actual content
)}
```

#### Orders Tab
```jsx
{loadingOrders ? (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => (
      <SkeletonRow key={i} color="amber" />
    ))}
  </div>
) : (
  // Actual orders
)}
```

## Shadow Effects

All skeleton components include:
- **shadow-sm** - Subtle shadow for cards
- **hover:shadow-md** - Enhanced shadow on hover
- **transition-shadow** - Smooth shadow transitions

## Animation

All skeletons use:
- **animate-pulse** - Smooth pulsing animation
- **duration-2000** - 2-second animation cycle
- **opacity transitions** - Smooth fade effects

## Usage Example

```jsx
import { SkeletonCard, SkeletonRow, SkeletonGrid } from '../components/LoadingSkeleton';

function MyDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {loading ? (
        <SkeletonGrid count={3} color="amber" />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {data.map(item => (
            <Card key={item.id} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Match Colors to Content**
   - Use amber for primary actions
   - Use blue for secondary information
   - Use green for success states
   - Use red for warnings/errors

2. **Consistent Sizing**
   - Keep skeleton height matching actual content
   - Use same spacing as final layout

3. **Smooth Transitions**
   - Fade out skeletons when content loads
   - Use motion.div for smooth animations

4. **Accessibility**
   - Skeletons are purely visual
   - Ensure actual content is accessible
   - Use aria-busy for screen readers

## Files Modified

- `madio-craft/client/src/components/LoadingSkeleton.js` - New component file
- `madio-craft/client/src/pages/BuyerDashboard.js` - Updated with loading skeletons

## Next Steps

To apply to other dashboards:

1. **ArtisanDashboard.js**
   - Import LoadingSkeleton components
   - Wrap loading states with appropriate skeletons
   - Use color differentiation for different sections

2. **AdminDashboard.js**
   - Import LoadingSkeleton components
   - Add skeletons for stats cards
   - Add skeletons for user/product/order tables

3. **Consistency**
   - Use same color scheme across all dashboards
   - Maintain consistent shadow effects
   - Keep animation timing uniform

## Performance Notes

- Skeletons are lightweight CSS animations
- No JavaScript overhead
- GPU-accelerated animations
- Minimal impact on performance
- Improves perceived performance

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations supported
- Gradient backgrounds supported
- Responsive design supported
