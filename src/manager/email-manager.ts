import { emailAdapter } from "../adapters/email-adapter.js";

export const emailManager = {
  async sendConfirmationEmail(email: string, confirmationCode: string) {
    await emailAdapter.sendEmail(
      email,
      "Email confirmation",
      `<h1>Thank you for your registration</h1>
              <p>To finish registration please follow the link below:</p>
              <a href="https://somesite.com/confirm-email?code=${confirmationCode}">Confirm email</a>`,
    );
  },
};
