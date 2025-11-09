import otpGenerator from "otp-generator";

export const generateOTP = async () => {
    const otp = await otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    return otp;
}
