import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { scrapeProduct } from "@/lib/firecrawl";
import { sendPriceDropAlert } from "@/lib/resendemail";


export async function POST(req) {

  try {

    const authHeader = req?.headers?.get("authorization");

    // Cron secret is basically a secret code for accessing this particular function which will be triggered by 'supabase cron job'
    const cronSecretKey = process.env.CRON_SECRET_KEY;

    if (!cronSecretKey || authHeader !== `Bearer ${cronSecretKey}`) {

      return NextResponse.json({
        error: "Unauthorized",
      }, { status: 401 });

    }

    // Supabase's 'SUPABASE_SERVICE_ROLE_KEY' allows us to bypass the Role-Level-Security(RLS) of our tables
    const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    /*
     * We are fetching all products from the 'products' table because this code
     * is being executed by a cron job, not by a request from a logged-in user.
     *
     * Unlike our normal application flow, there is no "currently logged-in
     * user" associated with this cron job.
     *
     * The purpose of this cron job is to periodically check the prices of
     * all products being tracked by all users.
     *
     * Therefore, we fetch all products of all users and then process each
     * product one by one.
     *
     * For each product:
     *     → Scrape its URL to get the latest price.
     *     → Compare the latest price with the price stored in the database.
     *     → If the price has dropped, send a price-drop alert to the user
     *       who is tracking that product.
     *
     * The 'id_of_user_who_scraped_the_product' column tells us which user
     * owns each product, so we can identify the correct user when sending
     * the price-drop notification.
     */
    const { data: dataOfProductsOfAllUsers, error: fetchAllProductsError } = await supabaseClient.from("products").select("*");

    if (fetchAllProductsError) {

      throw fetchAllProductsError;

    }

    for (const product of dataOfProductsOfAllUsers) {

      try {

        /*
         * Scrape the latest information for each product stored in the database.
         *
         * For every product:
         *     → Scrape its URL to get the latest price from the website.
         *     → Compare the latest scraped price with the current price stored
         *       in the database.
         *
         * If the latest price is lower than the price stored in the database:
         *     → A price drop has occurred.
         *     → Send an email notification to the user who is tracking that product.
         *
         * This entire process will be executed periodically by a Supabase cron job,
         * allowing us to automatically monitor the prices of all tracked products
         * at regular time intervals without requiring the user to manually check
         * the product price.
         */

        const scrapedProductData = await scrapeProduct(product?.url_of_the_scraped_product);

        if (scrapedProductData?.currentPrice == null) {
          /*
           * If the current price could not be extracted from the website,
           * we cannot compare the price or check for a price drop.
           *
           * Therefore, 'continue' skips the current product and immediately
           * moves to the next product in the 'for...of' loop.
           *
           * We use 'continue' instead of 'return' because we do not want
           * one failed product to stop the entire cron job from checking
           * the remaining products.
           */

          continue;

        }

        const currentPriceOfProductAsPerTheScrapedData = parseFloat(scrapedProductData?.currentPrice);

        const priceofProductStoredInDB = parseFloat(product?.current_price_of_the_scraped_product);


        if (Number.isNaN(currentPriceOfProductAsPerTheScrapedData) || Number.isNaN(priceofProductStoredInDB)) {

          continue;

        }

        if (currentPriceOfProductAsPerTheScrapedData < priceofProductStoredInDB) {

          /**
           * If the current price of the product in the website is less than the price of the same product stored in DB, then
           * send email alert to the user regarding the price drop of that product
           */

          const { data: { user }} = await supabaseClient.auth.admin.getUserById(product?.id_of_user_who_scraped_the_product);

          const emailAddressOfTheUser = user?.email;

          if (emailAddressOfTheUser) {

            // send email
            await sendPriceDropAlert(
              emailAddressOfTheUser,
              product,
              currentPriceOfProductAsPerTheScrapedData,
              priceofProductStoredInDB,
            );

          }

        }

        /*
         * Update the 'products' table with the latest scraped price.
         *
         * This is important because 'products' stores the current/latest
         * known price of the product.
         *
         * Updating this value also prevents the same price drop from
         * triggering the same email repeatedly on every cron execution.
         */
        const { error: updateProductPriceError } = await supabaseClient
          .from("products")
          .update({
            current_price_of_the_scraped_product:
              currentPriceOfProductAsPerTheScrapedData,
            currency: scrapedProductData?.currencyCode || product?.currency,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product?.id);

        if (updateProductPriceError) {

          throw updateProductPriceError;

        }

        /*
         * Get today's date in IST.
         *
         * We use the date in 'tracked_date' so that each product has
         * only one price-history record per calendar day.
         */
        const todaysDate = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });

        /*
         * Insert or update today's price-history record.
         *
         * 'upsert()' does both operations:
         *
         *     → If a record with the same product ID and today's date
         *       already exists, it updates that record.
         *
         *     → If no such record exists, it inserts a new record.
         *
         * The 'onConflict' columns must have a UNIQUE constraint
         * in the database.
         */

        const { error: upsertProductHistoryError } = await supabaseClient
          .from("price_history_of_a_particular_product")
          .upsert(
            {
              id_of_the_product_whose_history_is_stored: product?.id,
              price_of_the_product: currentPriceOfProductAsPerTheScrapedData,
              currency: scrapedProductData?.currencyCode || product?.currency,
              tracked_date: todaysDate,
              checked_at: new Date().toISOString(),
            },
            {
              onConflict:
                "id_of_the_product_whose_history_is_stored,tracked_date",
            },
          );

        if (upsertProductHistoryError) {

          throw upsertProductHistoryError;

        }

      } catch (error) {

        console.log(error);

      }

    }

    return NextResponse.json({
      success: true,
      message: "price check completed successfully",
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json({
      error: error?.message,
    }, { status: 500 });

  }
  
}
