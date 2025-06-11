# WhatsApp Certificate Collection Bot

This project implements a fully automated WhatsApp bot that guides users through a certificate submission workflow. It uses the WhatsApp Business Cloud API, Express.js, and Supabase to manage a conversational flow, accept PDF uploads, and store them securely along with metadata.

## 📌 Project Overview

The bot is capable of:

- Initiating a conversation via WhatsApp message
- Dynamically handling button-based user replies
- Requesting course details (like B.Tech, M.Tech)
- **Accepting and validating uploaded certificate PDFs**
- Uploading received documents to Supabase Storage
- Saving metadata (phone, file URL, timestamp) in a Postgres table with RLS (Row Level Security) enforcement

The solution is deployed as a Node.js Express server and uses the official Meta Graph API to interact with WhatsApp.

---



### 🧪 Bot Interaction Flow

#### 1. User sends a greeting
The bot replies with a template asking if the user has a graduation certificate.
#### 2. User selects "Yes" and chooses degree
User selects "Yes" > "B.Tech" via interactive buttons.
![Greeting Template and Degree Selection](./screenshots/01_greeting_template.png)

---

#### 3. Bot prompts for certificate upload
Bot asks the user to upload a PDF certificate.

![Certificate Upload Prompt](./screenshots/03_upload_certificate.png)

---

### 🧾 Server Logs

Logs showing the entire flow and successful saving of PDF.

![Console Logs](./screenshots/04_logs_console.png)

---

### 📊 Supabase Table

Uploaded certificate record successfully stored with UUID and timestamp.

![Supabase Table](./screenshots/05_supabase_table.png)


### 🎥 Demo & Full Assets

A full video demo along with all screenshots is available in this Drive folder:  
👉 [View Demo and Assets](https://drive.google.com/drive/folders/your-folder-id-here)

---


## 🏗️ Architecture & Tech Stack

- **Node.js + Express** — Web server and message processing
- **Supabase** — Used for:
  - File storage (`certificates/`)
  - Postgres database with RLS-enabled `user_certificates` table
- **WhatsApp Business API (Cloud API)** — Messaging platform
- **Axios** — API calls to WhatsApp and Supabase
- **UUID + `gen_random_uuid()`** — For consistent primary key generation in Postgres

---

## 📂 Database Schema

Postgres table in Supabase:

```sql
create table public.user_certificates (
  id uuid not null default gen_random_uuid(),
  phone text null,
  file_url text null,
  uploaded_at timestamp without time zone null,
  constraint user_certificates_pkey primary key (id)
);

```

