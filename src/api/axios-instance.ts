import axiosReal from "axios";
import { wafIntercept } from "@madie/madie-util";

const axios = axiosReal.create();
axios.interceptors.response.use((response) => response, wafIntercept);

export default axios;
