import axios from "axios";

const externalBaseUrl = process.env.EXTERNAL_API_BASE_URL;
const externalApiKey = process.env.EXTERNAL_API_KEY;

export const searchLocations = async (req, res) => {
  try {
    if (!externalBaseUrl || !externalApiKey) {
      return res.internalServerError({ message: "External API not configured" });
    }

    const { q, lat, lng, radius } = req.query;
    const url = `${externalBaseUrl}/locations/search`;
    const response = await axios.get(url, {
      params: { q, lat, lng, radius },
      headers: { "x-api-key": externalApiKey },
      timeout: 10000,
    });

    return res.success({ data: response.data });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Failed to fetch locations";
    return res.status(status).json({ status: false, message });
  }
};

export const getLocationDetails = async (req, res) => {
  try {
    if (!externalBaseUrl || !externalApiKey) {
      return res.internalServerError({ message: "External API not configured" });
    }

    const { id } = req.params;
    const url = `${externalBaseUrl}/locations/${id}`;
    const response = await axios.get(url, {
      headers: { "x-api-key": externalApiKey },
      timeout: 10000,
    });

    return res.success({ data: response.data });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Failed to fetch location details";
    return res.status(status).json({ status: false, message });
  }
};


