# 📉 DipWatch

![Project Preview Thumbnail](/screenshots%20for%20readme/project_preview/1.png)

***A full-stack price tracking application that monitors product prices and sends email alerts when prices drop.***

## 📑 Contents

- [Introduction](#introduction)
- [What Problem Does DipWatch Solve?](#what-problem-does-dipwatch-solve)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Application Workflow](#application-workflow)
- [Get Started](#get-started)
- [Supabase Setup](#supabase-setup)
- [Supabase RLS Security](#supabase-rls-security)
- [Commands to Be Executed in the SQL Editor](#commands-to-be-executed-in-the-sql-editor)
- [Supabase Cron Job Setup](#supabase-cron-job-setup)
- [Screenshots of the Application](#screenshots-of-the-application)

---

## Introduction

**DipWatch** is a full-stack price tracking application that helps users monitor the prices of products available on the web.

Users can add a product by providing its URL, and DipWatch automatically scrapes and stores the product's latest price. The application keeps track of daily price changes and displays the price history using charts.

DipWatch also automatically checks tracked products every day at **9:00 AM** using a Supabase Cron Job. If the price of a product drops compared to its previously stored price, the user receives an email notification through Resend.

---

## What Problem Does DipWatch Solve?

Product prices on e-commerce websites can change frequently, making it difficult to know when a product reaches a lower price.

Users often have to repeatedly visit product pages and manually check whether the price has decreased.

**DipWatch solves this problem by automating the price-tracking process.**

Instead of manually checking products every day, users can:

- Add products they want to monitor.
- Let DipWatch automatically check their prices.
- View their historical price changes.
- Receive an email when a tracked product's price drops.

This makes it easier for users to keep an eye on products and avoid missing potential price drops.

---

## Features

- **Product Price Tracking** — Add products using their URLs and track their current prices.
- **Automatic Web Scraping** — Uses Firecrawl to retrieve the latest product information and price.
- **Daily Price History** — Stores the price of each tracked product for every day.
- **Price History Charts** — Visualizes historical price changes using interactive charts.
- **Automatic Price Checking** — Supabase Cron Jobs automatically check tracked products every day at **9:00 AM**.
- **Price Drop Detection** — Automatically compares the latest scraped price with the previously stored price.
- **📧 Price Drop Email Alerts** — Sends an email notification through Resend when a product's price decreases.
- **Authentication** — Users can securely sign in and manage their tracked products.
- **Toast Notifications** — Provides feedback for actions such as adding, updating, and deleting products.
- **Responsive UI** — Designed using Tailwind CSS and shadcn/ui.

---

## Tech Stack

| Technology       | Purpose                                 |
| ---------------- | --------------------------------------- |
| **Next.js**      | Full-stack application development      |
| **Supabase**     | Authentication, database, and Cron Jobs |
| **Firecrawl**    | Product data and price scraping         |
| **Resend**       | Price drop email notifications          |
| **Tailwind CSS** | Styling and responsive design           |
| **shadcn/ui**    | UI components                           |
| **Sonner**       | Toast notifications                     |
| **lucide-react** | Icons                                   |
| **Recharts**     | Price tracking history charts           |

---

## Application Workflow

The complete workflow of **DipWatch** can be understood in the following steps.

### 1. Adding a Product

```text
User Signs In
     |
     v
Provides Product URL
     |
     v
Next.js Server Action
     |
     v
Firecrawl Scrapes Product Information
     |
     v
Product Name + Current Price
     |
     v
Supabase Database
     |
     v
Today's Price Added to Price History
     |
     v
Product Displayed in DipWatch
```

### 2. Automatic Price Checking

Once a product is added, DipWatch automatically checks its price every day at **9:00 AM**.

```text
Supabase Cron Job
     |
     v
Executes Price-Check API Route
     |
     v
Fetch All Tracked Products
     |
     v
Firecrawl Scrapes Current Price
     |
     v
Compare Current Price with Stored Price
     |
     +-----------------------------+
     |                             |
     v                             v
Price Has Not Dropped         Price Has Dropped
     |                             |
     |                             v
     |                       Get User's Email
     |                             |
     |                             v
     |                       Resend Sends Email
     |                             |
     +-------------+---------------+
                   |
                   v
          Update Current Price
                   |
                   v
       Update Today's Price History
                   |
                   v
          Check Next Product
```

### 3. Price History

DipWatch maintains a daily price history for every tracked product.

For each product, there is **one price-history record per calendar day**. If the same product is checked multiple times on the same day, its existing history record is updated instead of creating duplicate records.

This historical data is then used by **Recharts** to display the product's price movement over time.

```text
Product
   |
   v
Daily Price
   |
   v
Supabase Price History
   |
   v
Historical Price Data
   |
   v
Recharts
   |
   v
Price Tracking History Chart
```

### Complete Workflow at a Glance

```text
User
  |
  v
Product URL
  |
  v
Next.js
  |
  v
Firecrawl
  |
  v
Supabase Database
  |
  v
Supabase Cron Job (Every Day at 9:00 AM)
  |
  v
Price-Check API
  |
  v
Firecrawl
  |
  v
Current Price
  |
  v
Compare with Stored Price
  |
  +--------------------+
  |                    |
  v                    v
No Price Drop       Price Drop
  |                    |
  |                    v
  |              Resend Email
  |                    |
  +---------+----------+
            |
            v
    Update Current Price
            |
            v
    Update Price History
            |
            v
    Recharts Price Chart
```

---

## Get Started

Follow the steps below to run **DipWatch** locally.

### 1. Clone the Repository

Clone the DipWatch GitHub repository:

```bash
git clone https://github.com/somenath203/dipwatch.git
```

Navigate into the project directory:

```bash
cd dipwatch
```

### 2. Install Dependencies

Install all the required dependencies using pnpm:

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory of the project and add the required environment variables.

For reference, check the `.env.example` file included in the repository.

The required environment variables are:

```env
FIRECRAWL_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

CRON_SECRET_KEY=

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the empty values with your own API keys and Supabase credentials.

> **Note:** Keep your secret keys private and never commit your `.env.local` file to GitHub.

### 4. Run the Development Server

Start the Next.js development server:

```bash
pnpm dev
```

Once the server starts, open:

```text
http://localhost:3000
```

You can now use **DipWatch** locally.

---

## Supabase Setup

DipWatch uses **Supabase** for authentication, database storage, and Cron Jobs. Before running the application, you need to create a Supabase project and set up the required database tables.

### 1. Create a Supabase Project

Create a new project in **Supabase**.

After creating the project, use the Supabase dashboard to create the following two tables:

- `products`
- `price_history_of_a_particular_product`

### 2. Create the `products` Table

Create a table named `products` with the following columns:

| Column                                 | Type          |
| -------------------------------------- | ------------- |
| `created_at`                           | `timestamptz` |
| `id_of_user_who_scraped_the_product`   | `uuid`        |
| `url_of_the_scraped_product`           | `text`        |
| `current_price_of_the_scraped_product` | `numeric`     |
| `currency`                             | `text`        |
| `image_url_of_the_scraped_product`     | `text`        |
| `updated_at`                           | `timestamp`   |
| `full_name_of_the_product`             | `text`        |

### 3. Create the `price_history_of_a_particular_product` Table

Create another table named `price_history_of_a_particular_product` with the following columns:

| Column                                      | Type        |
| ------------------------------------------- | ----------- |
| `id_of_the_product_whose_history_is_stored` | `uuid`      |
| `price_of_the_product`                      | `numeric`   |
| `currency`                                  | `text`      |
| `checked_at`                                | `timestamp` |
| `tracked_date`                              | `date`      |

---

## Supabase RLS Security

To protect users' data, Row Level Security (RLS) should be enabled for both database tables.

### 1. RLS Policies for `products`

Enable **Row Level Security** for the `products` table and create the following policies.

#### SELECT

Refer to the screenshot below and paste the following code inside `using()`:

```sql
(auth.uid() = id_of_user_who_scraped_the_product)
```

![Products SELECT RLS Policy](/screenshots%20for%20readme/products_rls_policies/select.png)

#### INSERT

Refer to the screenshot below and paste the following code inside `with check()`:

```sql
(auth.uid() = id_of_user_who_scraped_the_product)
```

![Products INSERT RLS Policy](/screenshots%20for%20readme/products_rls_policies/insert.png)

#### UPDATE

Refer to the screenshot below and paste the following code inside `using()`:

```sql
(auth.uid() = id_of_user_who_scraped_the_product)
```

![Products UPDATE RLS Policy](/screenshots%20for%20readme/products_rls_policies/update.png)

#### DELETE

Refer to the screenshot below and paste the following code inside `using()`:

```sql
(auth.uid() = id_of_user_who_scraped_the_product)
```

![Products DELETE RLS Policy](/screenshots%20for%20readme/products_rls_policies/delete.png)

### 2. RLS Policies for `price_history_of_a_particular_product`

Enable **Row Level Security** for the `price_history_of_a_particular_product` table and create the following policies.

#### INSERT

Refer to the screenshot below and paste the following code inside `with check()`:

```sql
(EXISTS (
  SELECT 1
  FROM products
  WHERE (
    (products.id = price_history_of_a_particular_product.id_of_the_product_whose_history_is_stored)
    AND
    (products.id_of_user_who_scraped_the_product = auth.uid())
  )
))
```

![Price History INSERT RLS Policy](/screenshots%20for%20readme/price_tracking_rls_policies/insert.png)

#### SELECT

Refer to the screenshot below and paste the following code inside `using()`:

```sql
(EXISTS (
  SELECT 1
  FROM products
  WHERE (
    (products.id = price_history_of_a_particular_product.id_of_the_product_whose_history_is_stored)
    AND
    (products.id_of_user_who_scraped_the_product = auth.uid())
  )
))
```

![Price History SELECT RLS Policy](/screenshots%20for%20readme/price_tracking_rls_policies/select.png)

---

## Commands to Be Executed in the SQL Editor

Refer to all the screenshots below for the SQL commands that need to be executed in **Supabase's SQL Editor**.

Run the commands shown in the screenshots one by one to complete the required database configuration for DipWatch.

![SQL Command 1](/screenshots%20for%20readme/sql_commands/command_one.png)

![SQL Command 2](/screenshots%20for%20readme/sql_commands/command_two.png)

![SQL Command 3](/screenshots%20for%20readme/sql_commands/command_three.png)

![SQL Command 4](/screenshots%20for%20readme/sql_commands/command_four.png)

---

## Supabase Cron Job Setup

DipWatch uses **Supabase Cron Jobs** to automatically check tracked product prices every day at **9:00 AM**.

Follow the steps below to configure the Cron Job.

### 1. Install Supabase Cron

Go to **Integrations** in your Supabase project, then click on **Cron** and install it.

Refer to the screenshot below:

![Install Supabase Cron](/screenshots%20for%20readme/cron_jobs/1.png)

### 2. Create a Cron Job

After installing Cron, go to the **Jobs** tab and click on **Create Job**.

Refer to the screenshot below:

![Create Supabase Cron Job](/screenshots%20for%20readme/cron_jobs/2.png)

### 3. Configure the Cron Schedule

Enter a suitable **Name** for the Cron Job.

In the **Schedule** field, enter:

```text
0 9 * * *
```

This schedules the Cron Job to execute **every day at 9:00 AM**.

Then, click on the **Install pg_net extension** button.

### 4. Configure the HTTP Request

Under the HTTP request configuration:

- **Method:** `POST`
- **Endpoint:** Enter the endpoint of the API route that checks for price drops and sends email alerts.
- **Timeout:** `4000`

### 5. Configure HTTP Headers

Under **HTTP Headers**, add the following headers.

#### Authorization Header

Set:

```text
Header name: Authorization
Header value: Bearer Cron Secret Key
```

Replace `Cron Secret Key` with the value of your `CRON_SECRET_KEY` environment variable.

#### Content-Type Header

Click **Add Header** and set:

```text
Header name: Content-Type
Header value: application/json
```

The final Cron Job configuration should look similar to the screenshots below.

![Supabase Cron Job Configuration One](/screenshots%20for%20readme/cron_jobs/4.png)

![Supabase Cron Job Configuration Two](/screenshots%20for%20readme/cron_jobs/5.png)

![Final Configuration Preview](/screenshots%20for%20readme/cron_jobs/6.png)

---

## Screenshots of the Application

Below are some screenshots showcasing the different parts of the **DipWatch** application.

### Home Page

![DipWatch Home Page](/screenshots%20for%20readme/project_preview/2.png)

### Tracked Products and Product Price History

![DipWatch Add Product](/screenshots%20for%20readme/project_preview/3.png)

### Price Drop Email Alert

![DipWatch Price Drop Email](/screenshots%20for%20readme/project_preview/4.png)
