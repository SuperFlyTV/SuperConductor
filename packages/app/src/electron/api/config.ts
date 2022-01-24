import axios from 'axios'

const API_URL = 'http://localhost:5000/'

const apiClient = axios.create({
	baseURL: API_URL,
})

apiClient.interceptors.request.use(
	(config) => {
		return {
			...config,
		}
	},
	(error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		return Promise.reject(error.response.data)
	}
)

const { get, post, put, delete: destroy } = apiClient
export { get, post, put, destroy }
