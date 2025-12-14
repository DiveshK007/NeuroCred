# Add NeuroCred Logo Here

## Instructions

1. **Save your logo image** as `neurocred-logo.png` in this directory (`frontend/public/`)

2. **Recommended specifications:**
   - Format: PNG (with transparency) or SVG
   - Size: At least 512x512 pixels (will be scaled automatically)
   - Background: Transparent (preferred) or dark background
   - The logo should show:
     - A circular icon with gradient outline (blue to purple)
     - Letter "N" in the center with gradient
     - "NeuroCred" text below (or just the icon)

3. **File location:**
   ```
   frontend/public/neurocred-logo.png
   ```

4. **After adding the file:**
   - The logo will automatically appear in:
     - Sidebar (when expanded and collapsed)
     - Navigation bar
     - Anywhere `NeuroCredLogo` component is used

## Current Status

✅ Logo component is configured to use the image
✅ Fallback to SVG version if image not found
✅ Responsive sizing (sm, md, lg)

The component will automatically use your logo image once you place it in this directory.
