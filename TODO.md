# TODO: Simplify mailer.js to use only Resend API

- [x] Update backend/src/lib/mailer.js: Remove SendGrid, Mailgun, and SMTP code, keep only Resend
- [x] Update backend/package.json: Remove unused dependencies (nodemailer, form-data, mailgun.js, @sendgrid/mail)
- [x] Run pnpm install to update dependencies
- [x] Verify changes and test email functionality
