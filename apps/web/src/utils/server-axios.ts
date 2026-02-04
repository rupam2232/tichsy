import axios from "axios";
import { cookies } from "next/headers";

const serverAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_BASE_URL,
});

serverAxios.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    config.headers.Cookie = cookieHeader;
  }
  return config;
});

export default serverAxios;
