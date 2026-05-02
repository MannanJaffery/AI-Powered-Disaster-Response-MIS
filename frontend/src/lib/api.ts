import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("drms_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginEndpoint = error.config?.url === "/login"
    if (error.response?.status === 401 && !isLoginEndpoint && typeof window !== "undefined") {
      localStorage.removeItem("drms_token")
      localStorage.removeItem("drms_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
