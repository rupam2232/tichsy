export default function loadRazorpayScript(src: string = "https://checkout.razorpay.com/v1/checkout.js"): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      reject(new Error("Payment SDK failed to load"));
    };
    document.body.appendChild(script);
  });
}
