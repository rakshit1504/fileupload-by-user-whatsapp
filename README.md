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

## 🏗️ Architecture & Tech Stack

- **Node.js + Express** — Web server and message processing
- **Supabase** — Used for:
  - File storage (`certificates/`)
  - Postgres database with RLS-enabled `user_certificates` table
- **WhatsApp Business API (Cloud API)** — Messaging platform
- **Axios** — API calls to WhatsApp and Supabase
- **UUID + `gen_random_uuid()`** — For consistent primary key generation in Postgres


## 🔁 Message Flow

1. User sends **"hi"**  
2. Bot replies with a **graduation template**, asking if the user has completed graduation.  
3. User clicks **"Yes"**  
4. Bot replies with a **degree template**, asking for course type (e.g., *B.Tech*).  
5. User clicks course type  
6. Bot replies:  
   > "Thank you! please provide certificate in PDF form"  
7. User sends the **PDF file**  
8. Server downloads the file via Meta API  
9. File is saved to **Supabase Storage** in the path:  
 certificates/<phone_number>/<timestamp>_<filename>.pdf  
10. Metadata including phone, file URL, and timestamp is inserted into the `user_certificates` table in Supabase  
11. Bot sends a **success message** with a **public link** to the uploaded certificate




---

### 🧪 Bot Interaction Flow

#### 1. User sends a greeting
The bot replies with a template asking if the user has a graduation certificate.
#### 2. User selects "Yes" and chooses degree
User selects "Yes" > "B.Tech" via interactive buttons.
![Greeting Template and Degree Selection](./screenshots/01_greeting_template.png)


#### 3. Bot prompts for certificate upload
Bot asks the user to upload a PDF certificate.

![Certificate Upload Prompt](./screenshots/03_upload_certificate.png)


### 🧾 Server Logs

Logs showing the entire flow and successful saving of PDF.

![Console Logs](./screenshots/04_logs_console.png)


### 📊 Supabase Table

Uploaded certificate record successfully stored with UUID and timestamp.

![Supabase Table](./screenshots/05_supabase_table.png)


### 🎥 Demo & Full Assets

A full video demo along with all screenshots is available in this Drive folder:  
👉 [View Demo and Assets](https://drive.google.com/drive/folders/1Wc9SxgNWbBNpbqUx1CTXwPtVCzYXqQNw?usp=sharing)

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



## 🔐 Environment Variables

The following environment variables must be set in a `.env` file for the server to function properly:

```env
PORT=3000
WEBHOOK_VERIFY_TOKEN=<your-whatsapp-verify-token>
GRAPH_API_TOKEN=<your-whatsapp-access-token>
PHONE_NUMBER_ID=<your-whatsapp-phone-number-id>

SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-service-role-key>  # Must be the service role key
```

## Installation & Setup

1. Clone the repository
2. Install dependencies (npm i)
3. Configure environment   
Create a .env file in the root and add all required variables as described above.  
4. Start the server (npm start)
 Make sure this server is accessible by your WhatsApp webhook (via HTTPS) — use ngrok for local development.

## File Structure
.  
├── server.js               # Main Express app  
├── uploadToSupabase.js    # File upload logic for Supabase  
├── supabase.js  
├── package.json  
└── .env                   # Environment variables (not checked into repo)

---

## Notable Implementation Details

- **User State Tracking** is handled in-memory via a simple `userState` object keyed by phone number. This avoids storing partial user conversations in a DB.

- **Media Fetching** uses WhatsApp’s `/media/<id>` endpoint secured with the same bearer token.

- **PDF Validation** is based on MIME type — only `application/pdf` documents are accepted.

- **Storage Path Structure** ensures organization and uniqueness based on timestamp and phone.


## Acknowledgements
This project was designed and implemented by **Rakshit Bansal** as a clean and scalable solution to automate user document collection through WhatsApp. It demonstrates a practical use of:

- Modern serverless database tech (Supabase)

- Production-ready messaging APIs (Meta)

- Secure, structured storage patterns


## Future Improvements

- Replace in-memory state with persistent Redis or DB caching for high-concurrency support

- Add file size validation and duplicate checks

- Implement rate-limiting and logging for abuse prevention

- Admin dashboard to view/download submissions





