# Visibility Dropdown Manual Test Plan

## Test URL
https://dev.greater.website

## Prerequisites
1. Have an account on lesser.host
2. Be logged in to Greater

## Test Cases

### 1. Dropdown Positioning - Normal Case
1. Navigate to https://dev.greater.website/compose
2. Click the visibility button (globe icon) in the compose box
3. **Expected**: Dropdown appears above the button with all 4 visibility options clearly visible
4. **Verify**: 
   - All text is readable (no overlapping)
   - Dropdown has proper spacing and padding
   - Each option shows icon, label, and description
   - Selected option has a checkmark

### 2. Dropdown Positioning - Near Top of Screen
1. Navigate to compose page
2. Scroll so the compose box is at the very top of the viewport
3. Click the visibility button
4. **Expected**: Dropdown automatically positions below the button instead of above
5. **Verify**: Dropdown doesn't go off the top of the screen

### 3. Click Outside to Close
1. Open the visibility dropdown
2. Click anywhere outside the dropdown (e.g., on the textarea)
3. **Expected**: Dropdown closes immediately

### 4. Select Different Visibility
1. Open the visibility dropdown
2. Click on "Followers only"
3. **Expected**: 
   - Dropdown closes
   - Button icon changes to the users icon
   - Next time you open dropdown, "Followers only" has a checkmark

### 5. Visual Improvements
**Verify all of the following**:
- Dropdown width is adequate (224px / 14rem)
- No text overlapping
- Proper contrast between text and background
- Icons are aligned properly
- Descriptions are visible and readable
- Selected state is clearly indicated

## Issues Fixed
1. ✅ Dropdown no longer goes off the top of the screen
2. ✅ Text no longer overlaps making options unreadable
3. ✅ Dropdown dynamically positions based on available space
4. ✅ Added checkmark to indicate selected option
5. ✅ Improved spacing and layout for better readability