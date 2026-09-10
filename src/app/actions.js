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

    const currencyCodeOfTheScrapedProduct = extractedProductData?.currencyCode || "USD";

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
     */
    /*
     * PURPOSE of "onConflict: "id_of_user_who_scraped_the_product, url_of_the_scraped_product","
     * 'onConflict' tells Supabase which columns together
     * should be treated as a unique combination when performing
     * the 'upsert' operation.
     *
     * Here, we use:
     * 1. 'id_of_user_who_scraped_the_product'
     * 2. 'url_of_the_scraped_product'
     *
     * This means the same user can have the same product URL
     * only once in the 'products' table.
     *
     * If a product with the same user ID and product URL already exists:
     *     → 'upsert' updates that existing product.
     *
     * If no product with the same user ID and product URL exists:
     *     → 'upsert' creates a new product.
     *
     * Example:
     *
     * User ID: "user123"
     * Product URL: "https://example.com/iphone-16"
     *
     * If this combination already exists:
     *     → Update the existing product.
     *
     * If this combination does not exist:
     *     → Insert a new product.
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
          ignoreDuplicates: false, // 'ignoreDuplicates: false' means that if a matching product already exists, 'upsert' will update it instead of ignoring the new data.
        },
      )
      .select()
      .single();

    if (error) {

      throw error;

    }

    // getting today's date
    const todaysDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // checking whether today's history row already exist in 'price_history_of_a_particular_product' table
    const { data: todaysPriceHistoryDataForTheParticularProduct, error: checkHistoryProductError } = await supabaseClient
      .from("price_history_of_a_particular_product")
      .select("id")
      .eq("id_of_the_product_whose_history_is_stored", product?.id)
      .eq("tracked_date", todaysDate)
      .maybeSingle();

    /*
     * .single() vs .maybeSingle()
     * '.single()' expects exactly one row to be returned.
     * If no row or more than one row is returned, Supabase returns an error.
     *
     * '.maybeSingle()' is similar to '.single()', but it also allows
     * no row to be returned.
     *
     * In our case, we use '.maybeSingle()' because the product may or may not
     * already exist in the database.
     *
     * If the product exists:
     *     → Returns that product.
     *
     * If the product does not exist:
     *     → Returns null instead of treating it as an error.
     *
     * Therefore, '.maybeSingle()' is more suitable for checking
     * whether a product already exists.
     */

    if (checkHistoryProductError) {

      throw checkHistoryProductError;

    }

    // if today's date's row for the particular product exists, just update the price
    // else, insert a new row in 'price_history_of_a_particular_product for that product
    if (todaysPriceHistoryDataForTheParticularProduct) {
      // If 'todaysPriceHistoryData' is 'true', it means the price record for this
      // date i.e. for 'today' already exist, so, in this case, just update the price
      // in the same row in 'price_history_of_a_particular_product' table
      const { error: updateProductHistoryError } = await supabaseClient
        .from("price_history_of_a_particular_product")
        .update({
          price_of_the_product: currentPriceOfTheScrapedProduct,
          currency: currencyCodeOfTheScrapedProduct,
          tracked_date: todaysDate,
          checked_at: new Date().toISOString(),
        })
        .eq("id", todaysPriceHistoryDataForTheParticularProduct?.id);

      if (updateProductHistoryError) {

        throw updateProductHistoryError;

      }
    } else {
      // If todaysPriceHistoryData' is 'false', it means, today's price
      // does not exist in 'price_history_of_a_particular_product' for the particular
      // product. In that case, create a new row for this product's price

      const { error: insertPriceHistoryForTheParticularProductError } =
        await supabaseClient
          .from("price_history_of_a_particular_product")
          .insert({
            id_of_the_product_whose_history_is_stored: product?.id,
            price_of_the_product: currentPriceOfTheScrapedProduct,
            currency: currencyCodeOfTheScrapedProduct,
            tracked_date: todaysDate,
            checked_at: new Date().toISOString(),
          });

      if (insertPriceHistoryForTheParticularProductError) {

        throw insertPriceHistoryForTheParticularProductError;

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

    const {data: { user }} = await supabaseClient.auth.getUser();

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
        .order("tracked_date", { ascending: true });

    if (error) {

      throw error;

    }

    return wholePriceHistoryOfTheParticularProduct || [];

  } catch (error) {

    console.log(error);

    return [];

  }
  
}
