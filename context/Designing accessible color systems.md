---
title: "Designing accessible color systems"
source: "https://stripe.com/blog/accessible-color-systems"
author:
  - "[[Daryl Koopersmith]]"
  - "[[Wilson Miner]]"
published: 2019-10-14
created: 2026-01-06
description: "How we designed a color system with hand-picked, vibrant colors that also met standards for accessibility and contrast."
tags:
  - "clippings"
---
Color contrast is an important aspect of accessibility. Good contrast makes it easier for people with visual impairments to use products, and helps in imperfect conditions like low-light environments or older screens. With this in mind, we recently updated the colors in our user interfaces to be more accessible. Text and icon colors now reliably have legible contrast throughout the Stripe Dashboard and all other products built with our internal interface library.

Achieving the right contrast with color is challenging, especially because color is incredibly subjective and has a big effect on the aesthetics of a product. We wanted to create a color system with hand-picked, vibrant colors that also met standards for accessibility and contrast.

When we evaluated external tools to improve color contrast and legibility in our products, we noticed two common approaches to tackling the problem:

1. **Hand-pick colors and check their contrast against a standard.** Our experience told us that this approach made choosing colors too dependent on trial and error.
2. **Generate lighter and darker tints from a set of base colors.** Unfortunately, simply darkening or lightening can result in dull or muted colors, which can be difficult to distinguish from each other and often just don’t look good.

With the existing tools we found, it was hard to create a color system that allowed us to pick great colors while ensuring accessibility. We decided to create a new tool that uses perceptual color models to give real-time feedback about accessibility. This enabled us to quickly create a color scheme that met our needs, and gave us something we could iterate on in the future.

## Background

The colors we use in our product interfaces are based on our brand color palette. Using these colors in our products allows us to bring some of the character of Stripe’s brand into our interfaces.

![starting-colors-wide](https://images.stripeassets.com/fzn2n1nzq965/7g7H8gPOI5XLvzeW5QE2TF/5c46a4ba82437434b514cbf56be2141c/starting-colors-wide.png?w=1082&q=80&fm=webp)

starting-colors-wide

Unfortunately, it was difficult to meet (and maintain) contrast guidelines with these colors. The web accessibility guidelines suggest a [minimum contrast ratio](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html#key-terms) of 4.5 for small text, and 3.0 for large text. When we audited color usage in our products, we discovered that none of the default text colors we were using for small text (except for black) met the contrast threshold.

![original-contrast-values](https://images.stripeassets.com/fzn2n1nzq965/43vghEvHpuJ28RKj9CMC6y/1f46656820b0e14a5cf0e87da51f73a7/original-contrast-values.png?w=1082&q=80&fm=webp)

original-contrast-values

Choosing accessible color combinations required each individual designer or engineer to understand the guidelines and select color pairs with enough contrast in each situation. With certain combinations of colors, options were limited and the accessible color combinations just didn’t look good.

When we first looked at ways to improve text contrast in our products, we initially explored shifting the default colors for text one step darker on our scale, illustrated by the left column below.

![original-contrast-comparison](https://images.stripeassets.com/fzn2n1nzq965/2laRYgsVcz8WlWIhpolle9/962abc3116d0df406b287e9a1e982c2b/original-contrast-comparison.png?w=1082&q=80&fm=webp)

original-contrast-comparison

Unfortunately, some of our colors *still* didn’t have sufficient contrast at the next darkest shade. Once we got to a shade with sufficient contrast on our existing scales (the right column), we lost a lot of the brightness and vibrancy of our colors. The colors pass guidelines on a white background, but they’re dark and muddy and it’s difficult to tell the hues apart.

Without digging deeper it would be easy to just accept the tradeoff that you need to choose between having accessible colors or colors that look good. In order to get both, we needed to rework our color system from the ground up.

We wanted to design a new color system that would provide three key benefits out of the box:

1. **Predictable accessibility:** Colors have enough contrast to pass accessibility guidelines.
2. **Clear, vibrant hues:** Users can easily distinguish colors from one another.
3. **Consistent visual weight:** At each level, no single color appears to take priority over another.

## A brief interlude on color spaces

To explain how we got there, we need to get a little nerdy about color.

We’re used to working with color on screens in terms of the [RGB color space](https://en.wikipedia.org/wiki/RGB_color_space). Colors are specified in terms of how much red, green, and blue light is mixed on screen to make the color.

![rgb-mixing](https://images.stripeassets.com/fzn2n1nzq965/4Cz8TVlaIiEkx7Fsg560VK/363bccd84ba99c4900ed9f06b037b13b/rgb-mixing.png?w=1082&q=80&fm=webp)

rgb-mixing

Unfortunately, while describing colors this way comes naturally to computers, it doesn’t come naturally to humans. Given an RGB color value, what needs to change to make it lighter? More colorful? Add more yellow?

It’s more intuitive for us to think of colors as organized by three attributes:

- **Hue:** What color is it?
- **Chroma:** How colorful is it?
- **Lightness:** How bright is it?
![hue-saturation-lightness](https://images.stripeassets.com/fzn2n1nzq965/4IdlOX63N8wI35qXY9KYGq/3e85d795abd1bfce1dfa49e1581c76af/hue-saturation-lightness.png?w=1082&q=80&fm=webp)

hue-saturation-lightness

A popular color space that supports specifying colors in this way is [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV). It’s well supported in design tools and popular code libraries for color manipulation. There’s just one problem: the way HSL calculates lightness is flawed. What most color spaces don’t take into account is that different hues are inherently perceived as different levels of lightness by the human eye—at the same level of mathematical lightness, yellow appears lighter than blue.

The image below is a set of colors with the same lightness and saturation in a display color space. While the color space claims the saturation and lightness are all the same, our eyes disagree. Notice that some of these colors appear lighter or more saturated than others. For example, the blues appear especially dark and the yellows and greens appear especially light.

![display-color-space](https://images.stripeassets.com/fzn2n1nzq965/5KL7DDZCUSvhTM4xjV7S18/4e7910e90000a1c0be1f826805276172/display-color-space.png?w=1082&q=80&fm=webp)

display-color-space

There *are*  color spaces which attempt to model human perception of color. **Perceptually uniform** color spaces model colors based on factors that relate more to human vision, and perform sophisticated color transformations to ensure that these dimensions reflect how human vision works.

![perceptually-uniform-color-space](https://images.stripeassets.com/fzn2n1nzq965/5dAcbhS0qlqMFJdjyxbj6k/4fa90be503e5ae8adb0607491772a0fd/perceptually-uniform-color-space.png?w=1082&q=80&fm=webp)

perceptually-uniform-color-space

When we take a sample of colors with the same lightness and saturation in a perceptually uniform color space, we can observe a significant difference. These colors appear to blend together, and each color appears to be just as light and as saturated as the rest. This is perceptual uniformity at work.

There are surprisingly few tools that support perceptually uniform color models, and none that came close to helping us design a color palette. So we built our own.

## Visualizing color

We built a web interface to allow us to visualize and manipulate our color system using perceptually uniform color models. The tool gave us an immediate feedback loop while we were iterating on our colors—we could see the effect of every change.

 <video><source src="//videos.stripeassets.com/fzn2n1nzq965/7GDaCnGLsYrdVIwXIqURwA/630fea9f6c464c7b6ac518cd97e91ba8/colortool-loop.mp4?w=1620&amp;fm=webm" type="video/webm"> <source src="//videos.stripeassets.com/fzn2n1nzq965/7GDaCnGLsYrdVIwXIqURwA/630fea9f6c464c7b6ac518cd97e91ba8/colortool-loop.mp4?w=1620&amp;fm=mp4" type="video/mp4"></video>

The color space illustrated above is known as [CIELAB](https://en.wikipedia.org/wiki/CIELAB_color_space)  or, affectionately, Lab. The L in Lab stands for  *lightness*, but unlike the lightness in HSL, it’s designed to be perceptually uniform. By translating our color scales into the Lab color space, we can adjust our colors based on their perceptual contrast and visually compare the results.

The diagram below shows the lightness and contrast values of our previous color palette visualized in the color tool. You can see that the perceptual lightness of each of our colors follows a different curve, with the yellow and green colors much lighter than the blues and purples at the same point.

![original-lightness-values](https://images.stripeassets.com/fzn2n1nzq965/7bAkvmGTaEhDpPU87hgVuQ/89199ca68d67f1d1b7596e403db7f92c/original-lightness-values.png?w=1080&q=80&fm=webp)

original-lightness-values

By manipulating our colors in perceptually uniform color space, we were able to produce a set of colors which have uniform contrast across all the hues, and preserve as much of the intended hue and saturation of our current colors. In the proposed colors, yellow has the same contrast range as blue, but they still *look* like our colors.

In the diagram below, you can see the perceptual lightness for each color follows the same curve, meaning each color (the labels on the left) has the same contrast value at a given level (the number labels on the top).

![lightness-curve-blue](https://images.stripeassets.com/fzn2n1nzq965/3cY3JPJbVezaY6gbZnHGWH/680b8663250c0917281e6c4303fdb0cb/lightness-curve-blue.png?w=1082&q=80&fm=webp)

lightness-curve-blue

Our new tool also showed us what was possible. Visualizing a perceptually uniform color model allowed us to see the constraints of visual perception. The shaded areas in the charts represent so-called imaginary colors which aren’t actually reproducible or perceivable. It turns out “really dark yellow” isn’t actually a thing.

Most tools for mixing colors allow you to set values across the full range for each parameter, and just clip the colors or return the nearest fit colors that don’t actually represent the parameters you set. Visualizing the available color space in real time as we made changes allowed us to iterate much faster because we could tell what changes were possible and what changes moved us closer to our goal: “bright”, differentiated colors that met the appropriate contrast guidelines.

At some points, finding a set of colors that worked together was like threading a needle. Here, the shaded areas show how limited the space is to actually find a combination of values that allows for roughly equal lightness for all hues.

![lightness-thread-the-needle](https://images.stripeassets.com/fzn2n1nzq965/RdwVlVibTaTskg1iVEVLR/a3c05e4d87f8113599ae550fa7545b8f/lightness-thread-the-needle.png?w=1082&q=80&fm=webp)

lightness-thread-the-needle

![uniform-contrast-values-icons](https://images.stripeassets.com/fzn2n1nzq965/1bR4e17YhONwT9BWyrHllH/5b7813b2dfb9e57011c2b133ee858ec4/uniform-contrast-values-icons.png?w=1082&q=80&fm=webp)

uniform-contrast-values-icons

## Results

After a lot of iterations and tests with real components and interfaces, we arrived at a palette of colors that achieved our goals: our colors predictably passed accessibility guidelines, kept their clear, vibrant hues, and maintained a consistent visual weight across hues.

Our new default colors for text and icons now pass the accessibility contrast threshold defined in the WCAG 2.0 guidelines.

![uniform-contrast-values-text](https://images.stripeassets.com/fzn2n1nzq965/3ZPP6fI931onmKlwC7w373/c3a945f27ab6743d2fa2ca0563822729/uniform-contrast-values-text.png?w=1082&q=80&fm=webp)

uniform-contrast-values-text

In addition to passing contrast guidelines over white backgrounds, each color also passes when displayed atop the lightest color value in any hue. Since we commonly use these lightly tinted backgrounds to offset or highlight sections, this makes it simple and predictable to ensure text has sufficient contrast throughout our products.

Because the new colors are uniformly organized based on contrast, we also have straightforward guidelines built-in for choosing appropriate contrast pairs in less common cases. Any two colors are guaranteed to have sufficient contrast for small text if they are at least five levels apart, and at least four levels apart for icons and large text.

With contrast guidelines built in to the system, it’s simple to make adjustments for color contrast in different components with predictable results.

![badges](https://images.stripeassets.com/fzn2n1nzq965/6adtkO2ouMiAMZRjBusR2C/5d6f76d0a5f8dac0a908bff95d7e63bc/badges.png?w=1082&q=80&fm=webp)

For example, we redesigned our Badge component to use a color background to clearly differentiate each color. At the lightest possible value, the colors were too difficult to distinguish from each other. By shifting both the background and the text color up one level, we were able to maintain text contrast across all badge colors without fine tuning each color combination individually.

## Conclusion

We learned that designing accessible color systems doesn’t have to mean fumbling around in the dark. We just needed to change how we thought about color:

#### Use a perceptually uniform color model

When designing an accessible color system, using a perceptually uniform color model (like CIELAB) helped us understand how each color appears to our eyes as opposed to how it appears to a computer. This allowed us to validate our intuitions and use numbers to compare the lightness and colorfulness of all of our colors.

#### Accessible doesn’t mean vibrant

The WCAG accessibility standard intentionally only focuses on the contrast between a foreground and a background color—not how vibrant they appear. Understanding how vibrant each color appears can helps to distinguish hues from one another.

#### Color is hard to reason about, tools can help

One of the pitfalls of perceptually uniform color models is that there are *impossible colors* —there’s no such thing as “very colorful dark yellow” or “vibrant light royal blue”. Building our own tool helped us see exactly which colors were possible and allowed us to rapidly iterate on our color palette until we produced a palette that was accessible, vibrant, and still felt like Stripe.

#### Additional resources

To learn more about color, we recommend the following resources:

- [“Perceptually uniform color spaces”](https://programmingdesignsystems.com/color/perceptually-uniform-color-spaces/index.html) from Programming Design Systems by Rune Madsen
- [“Color: From Hexcodes to Eyeballs”](http://jamie-wong.com/post/color/) by Jamie Wong
- [“Color Spaces”](https://ciechanow.ski/color-spaces/) by Bartosz Ciechanowski