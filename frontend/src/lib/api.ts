import axios from 'axios'
import { getAuth } from 'firebase/auth'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err.response?.data ?? err)
)

export default api
