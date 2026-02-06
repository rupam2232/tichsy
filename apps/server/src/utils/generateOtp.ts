/**
 * Generates a random OTP of the specified length.
 * @param length - The length of the OTP to generate (default: 6)
 * @returns A random OTP string
 */

export default function generateOtp(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}