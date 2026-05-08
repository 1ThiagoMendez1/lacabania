# **App Name**: Cabaña POS

## Core Features:

- Secure Authentication & User Roles: Implement robust role-based access control for Administrators, Cashiers, Servers, Cooks, and Bartenders to ensure secure system usage.
- Menu & Product Management: Enable administrators to create, read, update, and delete menu items, including categories, pricing, station assignments, and inventory tracking details.
- Intuitive Order Entry: Provide servers with a touch-optimized interface to select tables, add menu items, specify quantities, and include basic modifiers or special notes for each order.
- Real-time Station Order Boards: Display pending and in-preparation orders on dedicated screens for Kitchen, Grill, Roast, and Bar stations, with real-time status updates via WebSockets.
- Billing & Payment Processing: Cashiers can manage table accounts, apply payments (supporting a single payment method for MVP), and generate basic printed receipts upon closing a table.
- Automated Order Routing & Printing: Automatically route individual order items to the correct physical printers (e.g., Roast printer, Bar printer) based on the item's category.
- Operational AI Insight Tool: A tool that uses historical sales patterns and projected demand to generate actionable staffing recommendations or inventory prep suggestions for upcoming peak hours or busy days.

## Style Guidelines:

- The overall visual scheme is dark, drawing inspiration from charcoal and deep woods to evoke a rustic yet sophisticated 'Tierra y Fuego' ambiance.
- Primary color: A vibrant 'Naranja brasa' (#C4501A) serves as the primary accent, reminiscent of grilling flames, used for interactive elements and key highlights to draw attention effectively against the dark theme.
- Background color: A deep 'Negro carbón' (#1A0F08) establishes the dark foundation, providing an immersive canvas that evokes the smoky atmosphere of a traditional llanero grill. This dark tone shares a subtle hue similarity with the primary orange but is heavily desaturated for contrast.
- Accent color: A rich 'Dorado' (#D4A843) (yellow ocre) is used for decorative elements, borders, and significant indicators. This golden hue connects to the imagery of the vast sabana llanera and contrasts beautifully with the primary and background.
- Complementary dark colors like 'Marrón oscuro' (#2C1810) are used for UI components such as cards and sections, providing depth reminiscent of aged leather.
- Text color: A soft 'Crema vainilla' (#F5E6D3) ensures high readability for all primary text elements, making content legible and warm against the dark backdrop.
- Headlines and display text will use 'Playfair Display' (serif) for an elegant and handcrafted menu aesthetic, reflecting artisanal quality.
- Body and UI text will utilize 'Inter' (sans-serif), ensuring clean readability and legibility for a touch-optimized interface, suitable for rapid interactions.
- Monospace text for prices, order numbers, and raw data will employ 'JetBrains Mono' (monospace) for its clear and distinct character display.
- For decorative purposes and specific logo elements, 'Satisfy' (cursive) will be used to add a touch of artistic flair.
- Custom SVG icons will embody llanero themes, featuring motifs such as the sombrero vueltiao, cattle, flames, and traditional cutlery to enrich the brand identity.
- UI components will feature subtle texture overlays of wood grain and worn leather on backgrounds, consistent 12px border-radius on all interactive elements, and warm amber drop-shadow effects to mimic the glow of a campfire.
- Implement smooth 'ease' transitions over 200-300ms for seamless navigation, along with micro-interactions for buttons (e.g., scale and glow effects) and notifications that visually 'fall' into the view.