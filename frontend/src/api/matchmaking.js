import axiosInstance from './axios';

// Opponent Requests
export const matchmakingAPI = {
  // Opponent Requests
  getMyCurrentRequest: () => axiosInstance.get('/matchmaking/requests/my_current/'),
  
  createOrUpdateRequest: (data) => axiosInstance.post('/matchmaking/requests/quick_create/', data),
  
  updateMyRequest: (data) => axiosInstance.put('/matchmaking/requests/my_current/', data),
  
  cancelMyRequest: () => axiosInstance.delete('/matchmaking/requests/cancel_my_request/'),
  
  getSuggestions: () => axiosInstance.get('/matchmaking/requests/suggestions/'),
  
  // Matches
  getMyMatches: () => axiosInstance.get('/matchmaking/matches/my_matches/'),
  
  createMatch: (data) => axiosInstance.post('/matchmaking/matches/', data),
  
  confirmMatch: (matchId) => axiosInstance.put(`/matchmaking/matches/${matchId}/confirm/`),
  
  recordMatchResult: (matchId, data) => axiosInstance.put(`/matchmaking/matches/${matchId}/record_result/`, data),
  
  cancelMatch: (matchId) => axiosInstance.delete(`/matchmaking/matches/${matchId}/cancel/`),

  // Profile
  getProfile: () => axiosInstance.get('/auth/profile/'),
  
  updateProfile: (data) => axiosInstance.put('/auth/profile/update/', data),
};

export default matchmakingAPI;
