# Custom CSS Template - Embedding Guide

## Overview

The **Custom CSS (Unstyled)** template provides a minimal, unstyled assessment that you can embed in your application and style with your own CSS. This is perfect for maintaining brand consistency when embedding assessments in your own website or application.

## How to Use

### 1. Select the Custom CSS Template

In your assessment's appearance settings, choose the **"Custom CSS (Unstyled)"** template. This will:
- Remove all default styling
- Apply minimal, semantic HTML structure
- Use `inherit` for fonts to match your site
- Set no borders or shadows

### 2. Available CSS Classes

Target these classes in your own CSS to style the assessment:

#### Container Classes
```css
.assessment-container          /* Main wrapper for entire assessment */
.assessment-card               /* Card containing the current question */
.assessment-progress-bar       /* Progress bar container */
.assessment-progress-fill      /* Progress bar fill */
```

#### Question Classes
```css
.assessment-question           /* Question text container */
.assessment-question-title     /* Question heading */
.assessment-question-description /* Optional question description */
```

#### Answer Option Classes
```css
.assessment-options            /* Container for all options */
.assessment-option             /* Individual option container */
.assessment-option-selected    /* Selected option state */
.assessment-option-radio       /* Radio button for single choice */
.assessment-option-checkbox    /* Checkbox for multiple choice */
.assessment-option-label       /* Label text for option */
```

#### Input Classes
```css
.assessment-input              /* Text input field */
.assessment-textarea           /* Long text textarea */
.assessment-rating             /* Rating scale container */
.assessment-rating-button      /* Individual rating button */
```

#### Button Classes
```css
.assessment-button             /* Generic button */
.assessment-button-primary     /* Primary action button (Next/Submit) */
.assessment-button-secondary   /* Secondary button (Back) */
```

### 3. Example Custom Styles

Here's a complete example of custom CSS for the assessment:

```css
/* Match your site's fonts and colors */
.assessment-container {
  font-family: 'Your Brand Font', sans-serif;
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
  min-height: 100vh;
  padding: 2rem;
}

.assessment-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Style questions */
.assessment-question-title {
  color: #your-text-color;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 1rem;
}

.assessment-question-description {
  color: #666;
  font-size: 16px;
  margin-bottom: 2rem;
}

/* Style options */
.assessment-option {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.assessment-option:hover {
  border-color: #your-accent-color;
  background: #f9f9f9;
}

.assessment-option-selected {
  border-color: #your-brand-color;
  background: rgba(your-brand-color-rgb, 0.1);
}

/* Style buttons */
.assessment-button-primary {
  background: #your-brand-color;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.assessment-button-primary:hover {
  background: #your-brand-color-darker;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Style progress bar */
.assessment-progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow:  hidden;
  margin-bottom: 2rem;
}

.assessment-progress-fill {
  height: 100%;
  background: #your-brand-color;
  transition: width 0.3s ease;
}
```

## Embedding

### Standard Embed

Use the standard iframe embed code:

```html
<iframe 
  src="https://yourapp.com/a/[assessment-id]" 
  width="100%" 
  height="600px"
  frameborder="0"
></iframe>
```

### With Custom CSS (Advanced)

If you want to inject your CSS directly:

1. Host your custom CSS file on your domain
2. Use the `customCSS` query parameter:

```html
<iframe 
  src="https://yourapp.com/a/[assessment-id]?customCSS=https://yourdomain.com/assessment-styles.css" 
  width="100%" 
  height="600px"
  frameborder="0"
></iframe>
```

### Hide Branding

For Pro/Agency users, add `hidebranding=true`:

```html
<iframe 
  src="https://yourapp.com/a/[assessment-id]?hidebranding=true" 
  width="100%" 
  height="600px"
  frameborder="0"
></iframe>
```

## Best Practices

### 1. Mobile Responsive

Make sure your custom styles are mobile-friendly:

```css
@media (max-width: 768px) {
  .assessment-card {
    padding: 1.5rem;
  }
  
  .assessment-question-title {
    font-size: 22px;
  }
}
```

### 2. Accessibility

Maintain good contrast ratios and focus states:

```css
.assessment-option:focus-within {
  outline: 2px solid #your-brand-color;
  outline-offset: 2px;
}

/* Ensure minimum 4.5:1 contrast ratio for text */
```

### 3. Animation

Add subtle animations for better UX:

```css
.assessment-option {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Testing

1. **Preview** - Use the preview mode to test your custom CSS
2. **Multiple Screens** - Test on desktop, tablet, and mobile
3. **Different Questions** - Ensure styles work for all question types
4. **Accessibility** - Test with keyboard navigation and screen readers

## Support

If you need help with custom CSS:
- Check our [video tutorial](#)
- Join our [community forum](#)
- Contact support for Agency tier users

## Examples

Check out these example implementations:
- [Minimal Professional](examples/minimal-professional.css)
- [Colorful Creative](examples/colorful-creative.css)
- [Corporate Blue](examples/corporate-blue.css)
