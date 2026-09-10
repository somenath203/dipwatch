import { Firecrawl } from "firecrawl";

const app = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function scrapeProduct(urlOfTheProductThatIsToBeScraped) {
  try {
    const res = await app.scrape(urlOfTheProductThatIsToBeScraped, {
      onlyMainContent: false,
      formats: [
        "markdown",
        {
          type: "json",
          prompt: `
Extract product information from this ecommerce product page.

productName:
The exact product name.

currentPrice:
The current selling price as a number only.
Remove currency symbols and thousands separators.

currencyCode:
The ISO 4217 currency code.

productImageUrl:
Return the URL of the actual main product photograph.

IMPORTANT:
- Do NOT return placeholder images.
- Do NOT return transparent-background.png.
- Do NOT return loading images.
- Do NOT return logos, icons, sprites, tracking images, or generic website assets.
- Return the actual product image URL if available.
- If multiple product images are available, return the primary/main product image.
- The image URL should point to an actual image of the product.

Example:
₹950.00 -> currentPrice: 950, currencyCode: "INR"
`,
          schema: {
            type: "object",
            required: ["productName", "currentPrice", "currencyCode"],
            properties: {
              productName: {
                type: "string",
              },
              currentPrice: {
                type: "number",
              },
              currencyCode: {
                type: "string",
              },
              productImageUrl: {
                type: "string",
              },
            },
          },
        },
      ],
    });

    const extractedDataFromURL = res?.json;

    if (!extractedDataFromURL || !extractedDataFromURL?.productName) {
      throw new Error("No data extracted from URL");
    }

    return extractedDataFromURL;
  } catch (error) {
    console.log(error);

    throw new Error(`Failed to scrape product: ${error?.message}`);
  }
}
