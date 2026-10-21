# Enquiry form: Google Sheet + Gmail

The contact form on metey.in sends each enquiry to a small Google Apps Script. The script:

- adds a row to a Google Sheet (date, reference number, name, email, phone, service, message), and
- emails the enquiry to info@metey.in (cc prasad@metey.in). Hitting **Reply** answers the visitor directly.

Until the script is connected, the form doesn't claim to have sent anything. It offers "Email us directly" and "WhatsApp" links instead, with the visitor's details already filled in.

## One-time setup (about 10 minutes)

1. Sign in to the Google account that should own the enquiries (for example the office Gmail).
2. Create a new Google Sheet and name it **METEY Website Enquiries**.
3. In the sheet, open **Extensions → Apps Script**.
4. Delete the sample code and paste in everything from [`Code.gs`](Code.gs). Click **Save**.
5. Click **Deploy → New deployment**.
   - Click the gear next to "Select type" and choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click **Deploy**, then **Authorize access** and allow the permissions. Google may say the app isn't verified. That's expected for your own script: choose **Advanced → Go to (project name)**.
6. Copy the **Web app URL**. It ends in `/exec`. Open it in a browser and you should see "METEY enquiry endpoint is running."
7. In this repository, open [`tools/build.mjs`](../../tools/build.mjs) and paste the URL in:

   ```js
   const ENQUIRY_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```

8. Run `node tools/build.mjs`, then commit and push. Vercel redeploys the site.
9. Send a test enquiry from https://metey.in/contact/. A row should appear in the sheet, and an email should reach info@metey.in.

## Good to know

- **Changing the script later:** use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. That keeps the same URL. A *New deployment* creates a new URL, which you'd have to paste into `build.mjs` again.
- **Changing who gets notified:** edit `NOTIFY_TO` / `NOTIFY_CC` at the top of the script, then redeploy as above.
- **Daily limit:** a free Gmail account can send about 100 notification emails a day; Google Workspace accounts get about 1,500. Enquiries are always saved to the sheet, even if the email limit is reached.
- **Spam:** the form has a hidden field that people never see. Bots that fill it in are silently ignored.
