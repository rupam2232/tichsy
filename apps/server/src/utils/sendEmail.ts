import { env } from "../env.js";
import { Resend } from "resend";
const resend = new Resend(env.RESEND_API_KEY);

type T = {
  success: boolean;
  message: string;
};

async function sendEmail(
  to: string | string[],
  template: { id: string; variables: { [key: string]: string | number } }
): Promise<T> {
  try {
    const { data, error } = await resend.emails.send({
      to,
      template,
    });

    return {
      success: !!data,
      message: error?.message || "Email sent successfully",
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email",
    };
  }
}

export default sendEmail;
