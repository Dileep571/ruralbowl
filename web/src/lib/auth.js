import { authAPI } from './api';

export const login = async (email, password) => {
  try {
    const data = await authAPI.login({ email, password });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const register = async (name, email, password, phone, address) => {
  try {
    const data = await authAPI.register({ name, email, password, phone, address });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = () => {
  authAPI.logout();
};

export const getCurrentUser = () => {
  return authAPI.getCurrentUser();
};

export const isAuthenticated = () => {
  return authAPI.isAuthenticated();
};

export const updateProfile = async (profileData) => {
  try {
    const data = await authAPI.updateProfile(profileData);
    // Update local storage with new user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
