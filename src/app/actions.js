"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { scrapeProduct } from "@/lib/firecrawl";


export async function signOutUser() {

  try {

    const supabaseClient = await createClient();

    await supabaseClient.auth.signOut();

    revalidatePath("/");

    redirect("/");

  } catch (error) {

    console.log(error);

  }

}


export async function addOrUpdateScrapedProduct(formData) {

  try {

    const urlOfTheWebsite = formData.get("urlOfTheWebsiteThatIsToBeScraped");

    if (!urlOfTheWebsite) {

      return {
        error: "URL is required",
      };

    }

    const supabaseClient = await createClient();

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {

      return {
        error: "User is not authenticated to perform the action",
      };

    }

    // scraping product data with firecrawl
    const extractedProductData = await scrapeProduct(urlOfTheWebsite);

    console.log("Extracted product data: ", extractedProductData);

    if (!extractedProductData?.productName || extractedProductData?.currentPrice == null) {

      return {
        error: "Could not extract product information from this URL",
      };

    }


    const currentPriceOfTheScrapedProduct = parseFloat(extractedProductData?.currentPrice);

    console.log("Current Price: ", currentPriceOfTheScrapedProduct);

    const currencyCodeOfTheScrapedProduct = extractedProductData?.currencyCode || "USD";

    console.log('Currency: ', currencyCodeOfTheScrapedProduct)

    /**
     * Check whether this product already exists in the database for the
     * current user and the given product URL.
     *
     * We use both the user's ID and the product URL to find the product.
     *
     * Example:
     *
     * User ID: "user123"
     * Product URL: "https://example.com/iphone-16"
     *
     * If a matching product is found:
     *     → We get its ID and current price from the database.
     *     → Later, 'upsert' will update this existing product.
     *
     * If no matching product is found:
     *     → 'detailsOfTheProduct' will be null.
     *     → Later, 'upsert' will create a new product.
     *
     * We also retrieve the existing price so we can later compare it
     * with the newly scraped price and determine whether the price has changed.
     */
    const { data: detailsOfTheProduct } = await supabaseClient
      .from("products") 
      .select("id, current_price_of_the_scraped_product")
      .eq("id_of_user_who_scraped_the_product", user?.id)
      .eq("url_of_the_scraped_product", urlOfTheWebsite)
      .single();

    /**
     * 'isUpdate' tells us whether the product already exists in the database
     * for the current user and the given product URL.
     *
     * Example:
     *
     * If the product already exists:
     *     detailsOfTheProduct → product data
     *     isUpdate → true
     *
     * If the product does not exist:
     *     detailsOfTheProduct → null
     *     isUpdate → false
     *
     * We use this information later to:
     * 1. Decide whether the product is being updated or added for the first time.
     * 2. Add the product to price history if it is a new product or its price has changed.
     * 3. Show the appropriate success message to the user.
     */
    /**
     * PURPOSE of '!!' =>
     * Convert the truthy/falsy value of 'detailsOfTheProduct' into a boolean
     * (true or false) using the double NOT operator '!!'.
     *
     * Example:
     *
     * If the product exists:
     *     detailsOfTheProduct → { id: "123", current_price: 50000 }
     *     !!detailsOfTheProduct → true
     *
     * If the product does not exist:
     *     detailsOfTheProduct → null
     *     !!detailsOfTheProduct → false
     *
     * This allows 'isUpdate' to simply tell us whether the product exists.
     */
    const isUpdate = !!detailsOfTheProduct;

    /**
     * Upsert the scraped product data into the 'products' table.
     *
     * 'upsert' means:
     * - If a product with the same user ID + product URL already exists,
     *   update that existing product with the latest scraped data.
     * - If no such product exists, create a new product.
     *
     * Example:
     *
     * User ID: "user123"
     * Product URL: "https://example.com/iphone"
     *
     * If "user123 + https://example.com/iphone" already exists:
     *     → Update the existing product.
     *
     * If it does not exist:
     *     → Insert a new product.
     *
     * 'onConflict' tells Supabase to use these two columns together
     * to determine whether the product already exists.
     */
    const { data: product, error } = await supabaseClient
      .from("products")
      .upsert(
        {
          id_of_user_who_scraped_the_product: user?.id,
          url_of_the_scraped_product: urlOfTheWebsite,
          full_name_of_the_product: extractedProductData?.productName,
          current_price_of_the_scraped_product: currentPriceOfTheScrapedProduct,
          currency: currencyCodeOfTheScrapedProduct,
          image_url_of_the_scraped_product:
            extractedProductData?.productImageUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict:
            "id_of_user_who_scraped_the_product, url_of_the_scraped_product",
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {

      throw error;

    }

    /**
     * Add the product's price to the 'price history' table when:
     * - The product is being added for the first time, OR
     * - The product already exists but its price has changed.
     *
     * Example:
     *
     * New product:
     *     Product does not exist → Add its current price to price history.
     *
     * Existing product:
     *     Old price: ₹50,000
     *     New price: ₹48,000
     *     → Price has changed → Add ₹48,000 to price history.
     *
     * If the price has not changed:
     *     Old price: ₹50,000
     *     New price: ₹50,000
     *     → No new history record is needed.
     */

    /**
     * Compare the product's current price stored in the database
     * with the newly scraped price from the website.
     *
     * This helps us determine whether the product's price has changed
     * since the last time it was scraped.
     */
    const shouldAddTheProductToHistory = !isUpdate || product?.current_price_of_the_scraped_product !== currentPriceOfTheScrapedProduct;

    /**
     * If the product is new or its price has changed, add the latest
     * price to the price history table.
     *
     * This creates a record of the product's price at that particular time,
     * so we can track how the price changes over time.
     *
     * Example:
     *
     * Product: iPhone 16
     *
     * First time scraped:
     *     Price: ₹79,999
     *     → Add ₹79,999 to price history.
     *
     * Later scraped:
     *     Previous price: ₹79,999
     *     New price: ₹74,999
     *     → Price changed, so add ₹74,999 to price history.
     *
     * If the price has not changed:
     *     Previous price: ₹74,999
     *     New price: ₹74,999
     *     → Do not add a new history record.
     */
    if (shouldAddTheProductToHistory) {

      const { error } = await supabaseClient
        .from("price_history_of_a_particular_product")
        .insert({
          id_of_the_product_whose_history_is_stored: product?.id,
          price_of_the_product: currentPriceOfTheScrapedProduct,
          currency: currencyCodeOfTheScrapedProduct,
        });

      if (error) {

        throw error;
        
      }

    }

    revalidatePath("/");

    return {
      success: true,
      product: product,
      message: isUpdate ? "Product updated successfully with the latest price!" : "Product added successfully!",
    };

  } catch (error) {

    console.log(error);

    return {
      error: error?.message || "Something went wrong",
    };

  }

}


export async function deleteProduct(idOfTheProductThatIsToBeDeleted) {

  try {

    const supabaseClient = await createClient();

    const { error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", idOfTheProductThatIsToBeDeleted);

    if (error) {

      throw error;

    }

    revalidatePath("/");

    return {
      success: true,
    };

  } catch (error) {

    console.log(error);

    return {
      error: error?.message || "Something went wrong",
    };

  }

}


export async function getAllProducts() {

  try {

    const supabaseClient = await createClient();

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {

      return {
        error: "User is not authenticated to perform the action",
      };

    }

    const { data: allProductsOfTheCurrentlyAuthenticatedUser, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("id_of_user_who_scraped_the_product", user.id)
        .order("created_at", { ascending: false });

    if (error) {

      throw error;

    }

    return allProductsOfTheCurrentlyAuthenticatedUser || [];

  } catch (error) {

    console.log(error);

    return [];

  }

}


export async function getPriceHistoryOfAParticularProduct(productId) {

  try {

    const supabaseClient = await createClient();

    const { data: wholePriceHistoryOfTheParticularProduct, error } =
      await supabaseClient
        .from("price_history_of_a_particular_product")
        .select("*")
        .eq("id_of_the_product_whose_history_is_stored", productId)
        .order("checked_at", { ascending: true });

    if (error) {

      throw error;

    }

    return wholePriceHistoryOfTheParticularProduct || [];

  } catch (error) {

    console.log(error);

    return [];

  }

}
