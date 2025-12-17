export async function getAddressFromCoords(
  lat: number,
  lon: number
): Promise<{
  fullAddress: string;
  wilaya: string;
}> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=fr`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "biqpod-algeria-app", // You should customize this
    },
  });
  const data = await response.json();
  if (data && data.address) {
    const { state, county, city, town, village } = data.address;
    return {
      fullAddress: data.display_name,
      wilaya: state || county || city || town || village || "Wilaya inconnue",
    };
  } else {
    throw new Error("Adresse non trouvée");
  }
}
