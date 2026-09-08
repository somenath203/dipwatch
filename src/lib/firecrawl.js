import { Firecrawl } from "firecrawl";


const app = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});


export async function scrapeProduct(urlOfTheProductThatIsToBeScraped) {

  try {

    const res = await app.scrape(urlOfTheProductThatIsToBeScraped, {
      formats: [
        {
          type: "json",
          prompt: "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, EUR, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available",
          schema: {
            type: "object",
            required: ["productName", "currentPrice"],
            properties: {
              productName: {
                type: "string",
              },
              currentPrice: {
                type: "string",
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

      throw new Error('No data extracted from URL');

    }

    return extractedDataFromURL;

  } catch (error) {

    console.log(error);

    throw new Error(`Failed to scrape product: ${error?.message}`);

  }
  
}
