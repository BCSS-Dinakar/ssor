# WhatsApp Cloud API (Meta) Setup Guide

This guide details the step-by-step process of setting up a Meta Developer App, obtaining the necessary WhatsApp API credentials, and creating the message templates required for the SSOR authentication flow.

---

## 1. Create a Meta Developer Account & App

1. Go to the [Meta for Developers Portal](https://developers.facebook.com/) and register for a developer account.
2. Click **My Apps** and select **Create App**.
3. Choose **Other** for the use case, click Next, and select **Business** as the app type.
4. Fill in your App Name and contact email, select your Business Portfolio (if applicable), and click **Create App**.

---

## 2. Set Up WhatsApp Product

1. On the App Dashboard, scroll down to the **Add products to your app** section.
2. Click **Set Up** on the **WhatsApp** card.
3. If prompted, select a Meta Business Account (or create one) to associate with your app.
4. You will be redirected to the **API Setup** page, which contains your temporary credentials:
   - **Temporary Access Token** (expires in 24 hours)
   - **Phone Number ID** (a Meta test number or your registered number)
   - **WhatsApp Business Account ID (WABA ID)**

---

## 3. Generate a Permanent System User Token

*Temporary access tokens expire after 24 hours. For production (and stable development), you must generate a permanent token.*

1. Go to the **Meta Business Suite** → **Settings** → **Business Settings**.
2. Under **Users**, select **System Users**.
3. Create a new System User (choose **Admin System User**).
4. Select the newly created user and click **Add Assets**. Assign your Developer App to this user and give it full access.
5. Click **Generate New Token**.
6. Select your app and check the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Click **Generate Token**. Copy and store this token securely — this is your permanent `WHATSAPP_TOKEN` for the `.env` file.

---

## 4. Set Up WhatsApp Message Templates

SSOR uses two pre-approved message templates: `ssor_login_otp` (for delivering OTP codes) and `ssor_login_alert` (utility notification after login).

1. Go to the **WhatsApp Manager** (from the API Setup page or Meta Business Suite → WhatsApp Manager → Account Tools → Message Templates).
2. Click **Create Template**.

### Template 1: OTP Template
- **Category:** Authentication
- **Name:** `ssor_login_otp`
- **Language:** English (en)
- **Header:** None
- **Body:** 
  ```text
  {{1}} is your verification code. For security, do not share this code.
  ```
- **Buttons:** Add a **Copy Code** button. 
  - Button Type: Copy Code
  - Button text: Copy Code
- **Configuration in `templates.json`:**
  ```json
  "ssor_login_otp": {
    "name": "ssor_login_otp",
    "language": "en",
    "category": "authentication",
    "buttonSubType": "url"
  }
  ```

### Template 2: Login Alert Template
- **Category:** Utility
- **Name:** `ssor_login_alert`
- **Language:** English (en)
- **Body:**
  ```text
  Hello {{1}}, a new login was detected on your SSOR account at {{2}}. If this was not you, please contact support immediately.
  ```
- **Configuration in `templates.json`:**
  ```json
  "ssor_login_alert": {
    "name": "ssor_login_alert",
    "language": "en",
    "category": "utility",
    "namedParams": true,
    "variables": ["user_name", "login_time"]
  }
  ```

---

## 5. Configure the Backend `.env` File

Add the generated credentials to the `backend/.env` file:

```env
WHATSAPP_TOKEN=your_permanent_system_user_token
PHONE_NUMBER_ID=your_phone_number_id
WABA_ID=your_whatsapp_business_account_id
GRAPH_VERSION=v23.0
```
