import axios from 'axios';

export const api = process.env.REACT_APP_FUNCTION_URL;

const subscribe = async (email) => {
  try {
    await axios.post(`${api}/email`, { email });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const emailService = {
  subscribe,
};
