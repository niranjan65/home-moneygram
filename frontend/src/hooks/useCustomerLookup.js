import { useState } from "react";
import { useUser } from "../context/UserContext";

export const useCustomerLookup = (setValue) => {
  const [loading, setLoading] = useState(false);
  const loginUser = useUser();
  const fetchCustomer = async (idNumber) => {
    if (!idNumber || idNumber.length < 3) return;

    try {
      setLoading(true);

      const res = await fetch(
        `https://mhmoneyexpress.anantdv.com/api/resource/Customer/${idNumber}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
        }
      );

      if (!res.ok) return;

      const { data } = await res.json();

      setValue("firstName", data.custom_first_name || "");
      setValue("lastName", data.custom_last_name || "");
      setValue("country", data.custom_country || "");
      setValue("city", data.custom_city || "");

      if (data.image) {
        const url = data.image.startsWith("http")
          ? data.image
          : `https://mhmoneyexpress.anantdv.com${data.image}`;

        setValue("docFile", url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { fetchCustomer, loading };
};