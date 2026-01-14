export const fetchMedication = async (drugName) => {
  try {
    // Rritim limitin në 100 (maksimumi i lejuar nga FDA për kërkesë)
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${drugName}&limit=100`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) return [];
    
    // Kthejmë të gjitha rezultatet që gjeti API
    return data.results || [];
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};